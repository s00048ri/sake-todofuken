import { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import centroids from '../data/prefectures.json';

// 本州・北海道・四国・九州 (本土) に限定
// 沖縄県 および 東京都小笠原諸島・鹿児島県南西諸島等はクリップ
const MAP_BOUNDS = {
  west: 128.5,   // 長崎県対馬付近
  east: 146.0,   // 北海道東端
  south: 30.8,   // 鹿児島県本土南端 (奄美諸島除外)
  north: 45.7,   // 北海道宗谷岬
};

// 描画領域（viewBox）
const WIDTH = 1000;
const HEIGHT = 900;
const MARGIN = { top: 10, right: 10, bottom: 10, left: 10 };

// クリップ対象（バブルを非表示にする都道府県）
const EXCLUDED_PREFS = new Set(['沖縄']);

/**
 * BubbleMap
 *
 * scaleMode:
 *  - 'global'  : 全期間の最大値を基準にスケール固定 → 経年縮小が見える（既定）
 *  - 'year'    : その年の最大値を基準に正規化
 *  - 'share'   : 全国計に対するシェア(%)でスケール
 */
export default function BubbleMap({ yearData, year, regions, regionColors, allYearsData, scaleMode = 'global' }) {
  const [topoData, setTopoData] = useState(null);
  const [hoveredPref, setHoveredPref] = useState(null);

  useEffect(() => {
    d3.json(`${import.meta.env.BASE_URL}japan.topojson`).then(setTopoData);
  }, []);

  // 本土限定のバウンディングボックスをGeoJSON Polygonとして構築
  const boundsFeature = useMemo(() => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [MAP_BOUNDS.west, MAP_BOUNDS.south],
        [MAP_BOUNDS.east, MAP_BOUNDS.south],
        [MAP_BOUNDS.east, MAP_BOUNDS.north],
        [MAP_BOUNDS.west, MAP_BOUNDS.north],
        [MAP_BOUNDS.west, MAP_BOUNDS.south],
      ]],
    },
  }), []);

  // バウンディングボックスにフィットさせた投影法
  const projection = useMemo(() => {
    return d3.geoMercator().fitExtent(
      [[MARGIN.left, MARGIN.top], [WIDTH - MARGIN.right, HEIGHT - MARGIN.bottom]],
      boundsFeature
    );
  }, [boundsFeature]);

  const pathGenerator = useMemo(() => {
    if (!projection) return null;
    return d3.geoPath().projection(projection);
  }, [projection]);

  // 沖縄を除外した都道府県境界
  const features = useMemo(() => {
    if (!topoData) return [];
    const all = topojson.feature(topoData, topoData.objects.japan).features;
    return all.filter(f => {
      const name = (f.properties?.nam_ja || '').replace(/[県府都]$/, '');
      return !EXCLUDED_PREFS.has(name);
    });
  }, [topoData]);

  // 年度合計（シェアモード用）
  const yearTotal = useMemo(() => {
    if (!yearData) return 0;
    return yearData.reduce((sum, d) => sum + (d.value || 0), 0);
  }, [yearData]);

  // 値のマップ
  const valueMap = useMemo(() => {
    const map = {};
    if (yearData) {
      yearData.forEach(d => {
        if (EXCLUDED_PREFS.has(d.pref)) return;
        if (scaleMode === 'share' && yearTotal > 0) {
          map[d.pref] = ((d.value || 0) / yearTotal) * 100;
        } else {
          map[d.pref] = d.value || 0;
        }
      });
    }
    return map;
  }, [yearData, scaleMode, yearTotal]);

  // スケールのドメイン最大値
  const domainMax = useMemo(() => {
    if (scaleMode === 'share') {
      if (!allYearsData) return 15;
      let maxShare = 0;
      Object.values(allYearsData).forEach(arr => {
        const total = arr
          .filter(d => !EXCLUDED_PREFS.has(d.pref))
          .reduce((s, d) => s + (d.value || 0), 0);
        if (total > 0) {
          arr.forEach(d => {
            if (EXCLUDED_PREFS.has(d.pref)) return;
            const share = ((d.value || 0) / total) * 100;
            if (share > maxShare) maxShare = share;
          });
        }
      });
      return maxShare;
    }
    if (scaleMode === 'global' && allYearsData) {
      let maxVal = 0;
      Object.values(allYearsData).forEach(arr => {
        arr.forEach(d => {
          if (EXCLUDED_PREFS.has(d.pref)) return;
          if ((d.value || 0) > maxVal) maxVal = d.value;
        });
      });
      return maxVal;
    }
    if (!yearData || yearData.length === 0) return 1;
    return Math.max(
      ...yearData.filter(d => !EXCLUDED_PREFS.has(d.pref)).map(d => d.value || 0)
    );
  }, [scaleMode, yearData, allYearsData]);

  const radiusScale = useMemo(() => {
    return d3.scaleSqrt().domain([0, domainMax]).range([3, 60]);
  }, [domainMax]);

  if (!topoData || !projection) {
    return <div className="text-center py-20 text-stone-400">地図を読み込み中...</div>;
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full mx-auto"
        style={{ maxWidth: '900px' }}
      >
        {/* SVGクリップパス: バウンディングボックス外を非表示にする */}
        <defs>
          <clipPath id="japan-clip">
            <rect x="0" y="0" width={WIDTH} height={HEIGHT} />
          </clipPath>
        </defs>

        <g clipPath="url(#japan-clip)">
          {/* 県境界（沖縄を除く） */}
          {features.map((feature, i) => (
            <path
              key={i}
              d={pathGenerator(feature)}
              fill="#e7e5e4"
              stroke="#a8a29e"
              strokeWidth={0.6}
            />
          ))}

          {/* バブル */}
          {Object.entries(centroids).map(([pref, [lng, lat]]) => {
            if (EXCLUDED_PREFS.has(pref)) return null;
            const value = valueMap[pref];
            if (!value || value <= 0) return null;

            // バウンディングボックス外は描画しない
            if (lng < MAP_BOUNDS.west || lng > MAP_BOUNDS.east ||
                lat < MAP_BOUNDS.south || lat > MAP_BOUNDS.north) return null;

            const [x, y] = projection([lng, lat]);
            const r = radiusScale(value);
            const region = regions[pref] || '';
            const color = regionColors[region] || '#6b7280';
            const isHovered = hoveredPref === pref;

            return (
              <g key={pref}>
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={color}
                  fillOpacity={isHovered ? 0.9 : 0.65}
                  stroke={isHovered ? '#1c1917' : color}
                  strokeWidth={isHovered ? 2 : 1}
                  style={{ transition: 'r 0.4s ease, fill-opacity 0.2s' }}
                  onMouseEnter={() => setHoveredPref(pref)}
                  onMouseLeave={() => setHoveredPref(null)}
                />
                {(r > 14 || isHovered) && (
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={isHovered ? 14 : 11}
                    fontWeight="bold"
                    fill="white"
                    pointerEvents="none"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
                  >
                    {pref}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* ツールチップ */}
      {hoveredPref && valueMap[hoveredPref] && (
        <div className="absolute top-4 right-4 bg-white shadow-lg rounded-lg px-4 py-3 text-sm border">
          <div className="font-bold text-base">{hoveredPref}</div>
          <div className="text-stone-500">{regions[hoveredPref]}</div>
          <div className="mt-1 text-lg font-bold">
            {scaleMode === 'share'
              ? `${valueMap[hoveredPref].toFixed(2)} %`
              : `${Math.round(valueMap[hoveredPref]).toLocaleString()} kL`}
          </div>
          <div className="text-stone-400 text-xs">{year}年</div>
        </div>
      )}

      <p className="text-xs text-stone-400 text-center mt-1">
        ※ 本マップは本州・北海道・四国・九州本土のみ表示（沖縄県・南西諸島・小笠原諸島は除外）
      </p>
    </div>
  );
}
