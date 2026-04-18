import { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import centroids from '../data/prefectures.json';
import { useI18n } from '../i18n/index.jsx';

// 本州・北海道・四国・九州 (本土) に限定
const MAP_BOUNDS = {
  west: 128.5,   // 長崎県対馬付近
  east: 146.0,   // 北海道東端
  south: 30.8,   // 鹿児島県本土南端（奄美諸島は除外）
  north: 45.7,   // 北海道宗谷岬
};

// 描画領域
const WIDTH = 1000;
const HEIGHT = 900;
const MARGIN = { top: 10, right: 10, bottom: 10, left: 10 };

// 沖縄インセット（天気予報スタイルの左上別枠）
const INSET = {
  x: 20,
  y: 40,
  width: 200,
  height: 170,
  bounds: {
    west: 126.5,   // 慶良間諸島付近
    east: 128.4,   // 大東諸島手前
    south: 24.0,   // 八重山諸島
    north: 27.0,   // 本島北端
  },
};

/**
 * BubbleMap
 *
 * scaleMode: 'global' | 'year' | 'share'
 * excludePrefs: ユーザーが除外する都道府県（バブルも県境界も非表示）
 *
 * 沖縄は本土の地理的範囲外のため、左上インセットに同一radiusScaleで別枠表示。
 */
export default function BubbleMap({ yearData, year, regions, regionColors, allYearsData, scaleMode = 'global', excludePrefs }) {
  const { t, lang, pref: tPref, region: tRegion } = useI18n();
  const [topoData, setTopoData] = useState(null);
  const [hoveredPref, setHoveredPref] = useState(null);

  const userExcluded = useMemo(() => new Set(excludePrefs || []), [excludePrefs]);

  useEffect(() => {
    d3.json(`${import.meta.env.BASE_URL}japan.topojson`).then(setTopoData);
  }, []);

  // 本土用 projection (MultiPoint で fitExtent)
  const mainBoundsGeometry = useMemo(() => ({
    type: 'MultiPoint',
    coordinates: [
      [MAP_BOUNDS.west, MAP_BOUNDS.south],
      [MAP_BOUNDS.east, MAP_BOUNDS.south],
      [MAP_BOUNDS.east, MAP_BOUNDS.north],
      [MAP_BOUNDS.west, MAP_BOUNDS.north],
    ],
  }), []);

  const projection = useMemo(() => {
    return d3.geoMercator().fitExtent(
      [[MARGIN.left, MARGIN.top], [WIDTH - MARGIN.right, HEIGHT - MARGIN.bottom]],
      mainBoundsGeometry
    );
  }, [mainBoundsGeometry]);

  const pathGenerator = useMemo(() => (
    projection ? d3.geoPath().projection(projection) : null
  ), [projection]);

  // 沖縄インセット用 projection
  const insetProjection = useMemo(() => {
    return d3.geoMercator().fitExtent(
      [[INSET.x + 8, INSET.y + 22], [INSET.x + INSET.width - 8, INSET.y + INSET.height - 10]],
      {
        type: 'MultiPoint',
        coordinates: [
          [INSET.bounds.west, INSET.bounds.south],
          [INSET.bounds.east, INSET.bounds.south],
          [INSET.bounds.east, INSET.bounds.north],
          [INSET.bounds.west, INSET.bounds.north],
        ],
      }
    );
  }, []);

  const insetPath = useMemo(() => (
    insetProjection ? d3.geoPath().projection(insetProjection) : null
  ), [insetProjection]);

  // 都道府県境界: 本土と沖縄に分離
  const { mainlandFeatures, okinawaFeature } = useMemo(() => {
    if (!topoData) return { mainlandFeatures: [], okinawaFeature: null };
    const all = topojson.feature(topoData, topoData.objects.japan).features;
    const okinawa = all.find(f => {
      const name = (f.properties?.nam_ja || '').replace(/[県府都]$/, '');
      return name === '沖縄';
    }) || null;
    const mainland = all.filter(f => {
      const name = (f.properties?.nam_ja || '').replace(/[県府都]$/, '');
      return name !== '沖縄' && !userExcluded.has(name);
    });
    return { mainlandFeatures: mainland, okinawaFeature: okinawa };
  }, [topoData, userExcluded]);

  // 年度合計（シェアモード用）— 沖縄含む
  const yearTotal = useMemo(() => {
    if (!yearData) return 0;
    return yearData
      .filter(d => !userExcluded.has(d.pref))
      .reduce((sum, d) => sum + (d.value || 0), 0);
  }, [yearData, userExcluded]);

  // 値のマップ（沖縄も含む）
  const valueMap = useMemo(() => {
    const map = {};
    if (yearData) {
      yearData.forEach(d => {
        if (userExcluded.has(d.pref)) return;
        if (scaleMode === 'share' && yearTotal > 0) {
          map[d.pref] = ((d.value || 0) / yearTotal) * 100;
        } else {
          map[d.pref] = d.value || 0;
        }
      });
    }
    return map;
  }, [yearData, scaleMode, yearTotal, userExcluded]);

  // スケールのドメイン最大値（沖縄含む）
  const domainMax = useMemo(() => {
    if (scaleMode === 'share') {
      if (!allYearsData) return 15;
      let maxShare = 0;
      Object.values(allYearsData).forEach(arr => {
        const total = arr
          .filter(d => !userExcluded.has(d.pref))
          .reduce((s, d) => s + (d.value || 0), 0);
        if (total > 0) {
          arr.forEach(d => {
            if (userExcluded.has(d.pref)) return;
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
          if (userExcluded.has(d.pref)) return;
          if ((d.value || 0) > maxVal) maxVal = d.value;
        });
      });
      return maxVal;
    }
    if (!yearData || yearData.length === 0) return 1;
    return Math.max(
      ...yearData.filter(d => !userExcluded.has(d.pref)).map(d => d.value || 0)
    );
  }, [scaleMode, yearData, allYearsData, userExcluded]);

  const radiusScale = useMemo(() => {
    return d3.scaleSqrt().domain([0, domainMax]).range([3, 60]);
  }, [domainMax]);

  if (!topoData || !projection) {
    return <div className="text-center py-20 text-stone-400">地図を読み込み中...</div>;
  }

  // 沖縄のデータがあるかどうか
  const okinawaValue = valueMap['沖縄'];
  const showInset = okinawaFeature && !userExcluded.has('沖縄') && okinawaValue !== undefined && okinawaValue > 0;

  // 沖縄バブル
  let okinawaBubble = null;
  if (showInset) {
    const [olng, olat] = centroids['沖縄'];
    const [ox, oy] = insetProjection([olng, olat]);
    const orReg = regions['沖縄'] || '';
    const ocolor = regionColors[orReg] || '#6b7280';
    const or = radiusScale(okinawaValue);
    const isHov = hoveredPref === '沖縄';
    okinawaBubble = (
      <g>
        <circle
          cx={ox}
          cy={oy}
          r={or}
          fill={ocolor}
          fillOpacity={isHov ? 0.9 : 0.65}
          stroke={isHov ? '#1c1917' : ocolor}
          strokeWidth={isHov ? 2 : 1}
          style={{ transition: 'r 0.4s ease, fill-opacity 0.2s' }}
          onMouseEnter={() => setHoveredPref('沖縄')}
          onMouseLeave={() => setHoveredPref(null)}
        />
        {(or > 10 || isHov) && (
          <text
            x={ox}
            y={oy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={isHov ? 12 : 10}
            fontWeight="bold"
            fill="white"
            pointerEvents="none"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}
          >
            {tPref('沖縄')}
          </text>
        )}
      </g>
    );
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full mx-auto"
        style={{ maxWidth: '900px' }}
      >
        <defs>
          <clipPath id="japan-clip">
            <rect x="0" y="0" width={WIDTH} height={HEIGHT} />
          </clipPath>
          <clipPath id="inset-clip">
            <rect x={INSET.x} y={INSET.y} width={INSET.width} height={INSET.height} />
          </clipPath>
        </defs>

        {/* 本土 */}
        <g clipPath="url(#japan-clip)">
          {mainlandFeatures.map((feature, i) => (
            <path
              key={i}
              d={pathGenerator(feature)}
              fill="#e7e5e4"
              stroke="#a8a29e"
              strokeWidth={0.6}
            />
          ))}

          {Object.entries(centroids).map(([pref, [lng, lat]]) => {
            if (pref === '沖縄') return null;  // 沖縄はインセットで描画
            if (userExcluded.has(pref)) return null;
            const value = valueMap[pref];
            if (!value || value <= 0) return null;
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
                    {tPref(pref)}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* 沖縄インセット（データがある時のみ表示） */}
        {showInset && (
          <g clipPath="url(#inset-clip)">
            {/* インセット背景枠 */}
            <rect
              x={INSET.x}
              y={INSET.y}
              width={INSET.width}
              height={INSET.height}
              fill="#fafaf9"
              stroke="#78716c"
              strokeWidth={1}
              strokeDasharray="4,2"
            />
            {/* インセットタイトル */}
            <text
              x={INSET.x + INSET.width / 2}
              y={INSET.y + 15}
              textAnchor="middle"
              fontSize={11}
              fontWeight="bold"
              fill="#57534e"
            >
              {t('map.insetTitle')}
            </text>
            {/* 沖縄県境界 */}
            {okinawaFeature && (
              <path
                d={insetPath(okinawaFeature)}
                fill="#e7e5e4"
                stroke="#a8a29e"
                strokeWidth={0.6}
              />
            )}
            {/* 沖縄バブル */}
            {okinawaBubble}
          </g>
        )}
      </svg>

      {/* ツールチップ */}
      {hoveredPref && valueMap[hoveredPref] && (
        <div className="absolute top-4 right-4 bg-white shadow-lg rounded-lg px-4 py-3 text-sm border">
          <div className="font-bold text-base">{tPref(hoveredPref)}</div>
          <div className="text-stone-500">{tRegion(regions[hoveredPref])}</div>
          <div className="mt-1 text-lg font-bold">
            {scaleMode === 'share'
              ? `${valueMap[hoveredPref].toFixed(2)} %`
              : `${Math.round(valueMap[hoveredPref]).toLocaleString()} kL`}
          </div>
          <div className="text-stone-400 text-xs">{year}{lang === 'ja' ? '年' : ''}</div>
        </div>
      )}

      <p className="text-xs text-stone-400 text-center mt-1">
        ※ {t('map.mapNote')}
        {showInset && ` ${t('map.okinawaNote')}`}
      </p>
    </div>
  );
}
