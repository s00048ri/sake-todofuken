import { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import centroids from '../data/prefectures.json';

const WIDTH = 800;
const HEIGHT = 800;
const MARGIN = { top: 10, right: 10, bottom: 10, left: 10 };

export default function BubbleMap({ yearData, year, regions, regionColors }) {
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

  // Value lookup for current year
  const valueMap = useMemo(() => {
    const map = {};
    if (yearData) {
      yearData.forEach(d => { map[d.pref] = d.value; });
    }
    return map;
  }, [yearData]);

  const maxValue = useMemo(() => {
    if (!yearData || yearData.length === 0) return 1;
    return Math.max(...yearData.map(d => d.value || 0));
  }, [yearData]);

  const radiusScale = useMemo(() => {
    return d3.scaleSqrt().domain([0, maxValue]).range([2, 45]);
  }, [maxValue]);

  if (!topoData || !projection) {
    return <div className="text-center py-20 text-stone-400">地図を読み込み中...</div>;
  }

  // Prefecture name mapping: nam_ja includes 県/府/都, our data doesn't
  const namToShort = (nam_ja) => {
    if (!nam_ja) return null;
    return nam_ja.replace(/[県府都]$/, '').replace('北海道', '北海道');
  };

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full max-w-2xl mx-auto">
        {/* Prefecture boundaries */}
        {features.map((feature, i) => (
          <path
            key={i}
            d={pathGenerator(feature)}
            fill="#e7e5e4"
            stroke="#a8a29e"
            strokeWidth={0.5}
          />
        ))}

        {/* Bubbles */}
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

      {/* Tooltip */}
      {hoveredPref && valueMap[hoveredPref] && (
        <div className="absolute top-4 right-4 bg-white shadow-lg rounded-lg px-4 py-3 text-sm border">
          <div className="font-bold text-base">{hoveredPref}</div>
          <div className="text-stone-500">{regions[hoveredPref]}</div>
          <div className="mt-1 text-lg font-bold">
            {Math.round(valueMap[hoveredPref]).toLocaleString()} kL
          </div>
          <div className="text-stone-400 text-xs">{year}年</div>
        </div>
      )}
    </div>
  );
}
