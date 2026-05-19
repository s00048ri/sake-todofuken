import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import YearSlider from './YearSlider';
import { useI18n } from '../i18n/index.jsx';

const TOP_N = 15;
const BAR_HEIGHT = 38;
const GAP = 4;

/**
 * BarChartRace
 *
 * perCapitaMode:
 *  - 'off'   : 絶対量（kL）— 既定
 *  - 'total' : 1人あたり（kL → L/人換算、総人口で割る）
 *  - 'adult' : 15歳以上1人あたり（データがある年のみ、無い年は'total'にフォールバック）
 */
export default function BarChartRace({ data, dataType = 'production', excludePrefs, perCapitaMode = 'off' }) {
  const { t, pref: tPref, region: tRegion } = useI18n();
  const { years: allYears, salesByYear, productionByYear, populationByYear, regions, regionColors } = data;

  const rawSourceByYear = dataType === 'production' ? productionByYear : salesByYear;
  const excludeSet = useMemo(() => new Set(excludePrefs || []), [excludePrefs]);

  // 1. 除外フィルタ + 2. 人口補正 を統合した再ソート
  const sourceByYear = useMemo(() => {
    const out = {};
    for (const [year, arr] of Object.entries(rawSourceByYear)) {
      const popYear = populationByYear?.[year];
      const filtered = arr
        .filter((d) => !excludeSet.has(d.pref))
        .map((d) => {
          let value = d.value;
          if (perCapitaMode !== 'off' && popYear) {
            const popInfo = popYear[d.pref];
            if (popInfo) {
              // 適切な人口を選択（adultモードでデータ無ければtotalにフォールバック）
              let pop = perCapitaMode === 'adult' ? popInfo.age15plus : popInfo.total;
              if (perCapitaMode === 'adult' && !pop) pop = popInfo.total;
              if (pop && pop > 0) {
                // kL → L換算して人口で割る（L/人）
                value = (d.value * 1000) / pop;
              } else {
                value = null;
              }
            } else {
              value = null;
            }
          }
          return value != null ? { pref: d.pref, value } : null;
        })
        .filter((d) => d !== null)
        .sort((a, b) => (b.value || 0) - (a.value || 0));

      if (filtered.length > 0) {
        out[year] = filtered;
      }
    }
    return out;
  }, [rawSourceByYear, excludeSet, populationByYear, perCapitaMode]);

  const availableYears = useMemo(
    () => allYears.filter((y) => sourceByYear[String(y)] && sourceByYear[String(y)].length > 0),
    [allYears, sourceByYear]
  );

  const [yearIndex, setYearIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const intervalRef = useRef(null);

  // dataType or perCapitaMode が変わったら年度をリセット
  useEffect(() => {
    setYearIndex(0);
    setIsPlaying(false);
  }, [dataType, perCapitaMode]);

  // yearIndex が availableYears の範囲外になった場合の補正
  useEffect(() => {
    if (yearIndex >= availableYears.length) {
      setYearIndex(Math.max(0, availableYears.length - 1));
    }
  }, [yearIndex, availableYears.length]);

  const currentYear = availableYears[yearIndex] || availableYears[0];
  const yearData = sourceByYear[String(currentYear)] || [];
  const topData = yearData.slice(0, TOP_N);
  const maxValue = topData.length > 0 ? topData[0].value : 1;

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      if (prev) return false;
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

  const handleYearChange = useCallback(
    (year) => {
      const idx = availableYears.indexOf(year);
      if (idx >= 0) setYearIndex(idx);
    },
    [availableYears]
  );

  const totalHeight = TOP_N * (BAR_HEIGHT + GAP);

  // 値のフォーマット
  const formatValue = (v) => {
    if (perCapitaMode !== 'off') {
      // L/人で1桁の精度
      return v >= 10 ? v.toFixed(1) : v.toFixed(2);
    }
    return Math.round(v).toLocaleString();
  };

  const unitLabel =
    perCapitaMode === 'adult' ? t('perCapita.unitAdult') :
    perCapitaMode === 'total' ? t('perCapita.unit') : '';

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
              <span className="w-20 text-right text-sm font-medium pr-2 shrink-0">
                {tPref(item.pref)}
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
                  {formatValue(item.value)}
                  {unitLabel && <span className="ml-1 opacity-80">{unitLabel}</span>}
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
            <span>{tRegion(region)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
