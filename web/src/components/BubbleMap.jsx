import { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import centroids from '../data/prefectures.json';

const WIDTH = 800;
const HEIGHT = 800;
const MARGIN = { top: 10, right: 10, bottom: 10, left: 10 };

/**
 * BubbleMap
 *
 * scaleMode:
 *  - 'global'   : 全期間の最大値を基準にスケール固定 → 経年縮小が見える（既定）
 *  - 'year'     : その年の最大値を基準に正規化 → 年ごとの相対構成
 *  - 'share'    : 全国計に対するシェア（%）でスケール → シェア変化を強調
 */
export default function BubbleMap({ yearData, year, regions, regionColors, allYearsData, scaleMode = 'global' }) {
  const [topoData, setTopoData] = useState(null);
  const [hoveredPref, setHoveredPref] = useState(null);

  useEffect(() => {
    d3.json(`${import.meta.env.BASE_URL}japan.topojson`).then(setTopoData);
  }, []);

  const projection = useMemo(() => {
    if (!topoData) return null;
    const geojson = topojson.feature(topoData, topoData.objects.japan);
    return d3.geoMercator()
      .fitExtent(
        [[MARGIN.left, MARGIN.top], [WIDTH - MARGIN.right, HEIGHT - MARGIN.bottom]],
        geojson
      );
  }, [topoData]);

  const pathGenerator = useMemo(() => {
    if (!projection) return null;
    return d3.geoPath().projection(projection);
  }, [projection]);

  const features = useMemo(() => {
    if (!topoData) return [];
    return topojson.feature(topoData, topoData.objects.japan).features;
  }, [topoData]);

  // Per-year total for share mode
  const yearTotal = useMemo(() => {
    if (!yearData) return 0;
    return yearData.reduce((sum, d) => sum + (d.value || 0), 0);
  }, [yearData]);

  // Value lookup for current year (absolute or share)
  const valueMap = useMemo(() => {
    const map = {};
    if (yearData) {
      yearData.forEach(d => {
        if (scaleMode === 'share' && yearTotal > 0) {
          map[d.pref] = ((d.value || 0) / yearTotal) * 100; // percentage
        } else {
          map[d.pref] = d.value || 0;
        }
      });
    }
    return map;
  }, [yearData, scaleMode, yearTotal]);

  // Domain max for the radius scale
  const domainMax = useMemo(() => {
    if (scaleMode === 'share') {
      // シェアは全年度を通して最大のシェアを取る（通常、東京の12-13%程度）
      if (!allYearsData) return 15;
      let maxShare = 0;
      Object.values(allYearsData).forEach(arr => {
        const total = arr.reduce((s, d) => s + (d.value || 0), 0);
        if (total > 0) {
          arr.forEach(d => {
            const share = ((d.value || 0) / total) * 100;
            if (share > maxShare) maxShare = share;
          });
        }
      });
      return maxShare;
    }
    if (scaleMode === 'global' && allYearsData) {
      // 全期間の最大値を取る
      let maxVal = 0;
      Object.values(allYearsData).forEach(arr => {
        arr.forEach(d => {
          if ((d.value || 0) > maxVal) maxVal = d.value;
        });
      });
      return maxVal;
    }
    // 'year' モード: その年の最大値
    if (!yearData || yearData.length === 0) return 1;
    return Math.max(...yearData.map(d => d.value || 0));
  }, [scaleMode, yearData, allYearsData]);

  const radiusScale = useMemo(() => {
    return d3.scaleSqrt().domain([0, domainMax]).range([2, 45]);
  }, [domainMax]);

  if (!topoData || !projection) {
    return <div className="text-center py-20 text-stone-400">地図を読み込み中...</div>;
  }

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-2xl mx-auto">
        {features.map((feature, i) => (
          <path
            key={i}
            d={pathGenerator(feature)}
            fill="#e7e5e4"
            stroke="#a8a29e"
            strokeWidth={0.5}
          />
        ))}

        {Object.entries(centroids).map(([pref, [lng, lat]]) => {
          const value = valueMap[pref];
          if (!value || value <= 0) return null;
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
              {(r > 12 || isHovered) && (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={isHovered ? 12 : 9}
                  fontWeight="bold"
                  fill="white"
                  pointerEvents="none"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                >
                  {pref}
                </text>
              )}
            </g>
          );
        })}
      </svg>

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
    </div>
  );
}
