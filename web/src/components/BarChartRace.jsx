import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import YearSlider from './YearSlider';

const TOP_N = 15;
const BAR_HEIGHT = 38;
const GAP = 4;

export default function BarChartRace({ data, dataType = 'production', excludePrefs }) {
  const { years: allYears, salesByYear, productionByYear, regions, regionColors } = data;

  const rawSourceByYear = dataType === 'production' ? productionByYear : salesByYear;
  const excludeSet = useMemo(() => new Set(excludePrefs || []), [excludePrefs]);

  // 除外対象があれば年度データをフィルタして再ソート
  const sourceByYear = useMemo(() => {
    if (excludeSet.size === 0) return rawSourceByYear;
    const filtered = {};
    for (const [year, arr] of Object.entries(rawSourceByYear)) {
      filtered[year] = arr
        .filter(d => !excludeSet.has(d.pref))
        .sort((a, b) => (b.value || 0) - (a.value || 0));
    }
    return filtered;
  }, [rawSourceByYear, excludeSet]);

  const availableYears = useMemo(
    () => allYears.filter(y => sourceByYear[String(y)] && sourceByYear[String(y)].length > 0),
    [allYears, sourceByYear]
  );

  const [yearIndex, setYearIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const intervalRef = useRef(null);

  // Reset year index when dataType changes
  useEffect(() => {
    setYearIndex(0);
    setIsPlaying(false);
  }, [dataType]);

  const currentYear = availableYears[yearIndex] || availableYears[0];
  const yearData = sourceByYear[String(currentYear)] || [];
  const topData = yearData.slice(0, TOP_N);
  const maxValue = topData.length > 0 ? topData[0].value : 1;

  const togglePlay = useCallback(() => {
    setIsPlaying(prev => {
      if (prev) return false;
      // 終端まで到達していたら最古年度に戻してから再生
      if (yearIndex >= availableYears.length - 1) {
        setYearIndex(0);
      }
      return true;
    });
  }, [yearIndex, availableYears.length]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setYearIndex((prev) => {
          if (prev >= availableYears.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, availableYears.length]);

  const handleYearChange = useCallback((year) => {
    const idx = availableYears.indexOf(year);
    if (idx >= 0) setYearIndex(idx);
  }, [availableYears]);

  const totalHeight = TOP_N * (BAR_HEIGHT + GAP);

  return (
    <div className="w-full">
      <YearSlider
        min={availableYears[0]}
        max={availableYears[availableYears.length - 1]}
        value={currentYear}
        onChange={handleYearChange}
        isPlaying={isPlaying}
        onPlayToggle={togglePlay}
        speed={speed}
        onSpeedChange={setSpeed}
      />

      <div className="relative" style={{ height: totalHeight }}>
        {topData.map((item, rank) => {
          const region = regions[item.pref] || '不明';
          const color = regionColors[region] || '#6b7280';
          const widthPct = (item.value / maxValue) * 80;
          const y = rank * (BAR_HEIGHT + GAP);

          return (
            <div
              key={item.pref}
              className="absolute left-0 right-0 flex items-center"
              style={{
                height: BAR_HEIGHT,
                transform: `translateY(${y}px)`,
                transition: 'transform 0.4s ease, opacity 0.4s ease',
              }}
            >
              <span className="w-16 text-right text-sm font-medium pr-2 shrink-0">
                {item.pref}
              </span>
              <div
                className="h-full rounded-r-md flex items-center justify-end pr-2 relative"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: color,
                  transition: 'width 0.4s ease',
                  minWidth: '2px',
                }}
              >
                <span className="text-white text-xs font-bold whitespace-nowrap drop-shadow">
                  {Math.round(item.value).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center text-xs">
        {Object.entries(regionColors).map(([region, color]) => (
          <div key={region} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span>{region}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
