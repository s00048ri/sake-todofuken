import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import BubbleMap from '../components/BubbleMap';
import YearSlider from '../components/YearSlider';
import { SourceBanner } from '../components/SourceBadge';
import salesData from '../data/salesByPref.json';

const SCALE_MODES = [
  { value: 'global', label: '絶対量（全期間固定）', hint: '全期間の最大値を基準。経年縮小が見える' },
  { value: 'year', label: '絶対量（年ごと）', hint: 'その年の最大値を基準。動きが弱い場合あり' },
  { value: 'share', label: 'シェア（全国比%）', hint: '全国計に対する割合。シェア変化を強調' },
];

const DEFAULT_DATA_TYPE = 'production'; // 初期表示は製成数量

// データタイプごとの除外候補
const EXCLUDE_PRESETS = {
  production: {
    prefs: ['兵庫', '京都', '新潟'],
    label: '主要3県（兵庫・京都・新潟）',
    hint: '中規模県の動きが見やすくなります',
  },
  sales: {
    prefs: ['東京'],
    label: '東京',
    hint: '突出する消費地を除くと他県の動きが見えます',
  },
};

export default function MapPage() {
  const { years, salesByYear, productionByYear, regions, regionColors } = salesData;

  const [dataType, setDataType] = useState(DEFAULT_DATA_TYPE);
  const [scaleMode, setScaleMode] = useState('global');
  // データタイプごとに除外フラグを独立管理
  const [excludeFlags, setExcludeFlags] = useState({ production: false, sales: false });
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);

  const preset = EXCLUDE_PRESETS[dataType];
  const excluded = excludeFlags[dataType];
  const excludePrefs = excluded ? preset.prefs : [];

  // dataType に応じた利用可能年度（旧い順）
  const availableYears = useMemo(() => (
    dataType === 'production'
      ? years.filter(y => productionByYear[String(y)])
      : years
  ), [dataType, years, productionByYear]);

  // 初期表示は最古年度から（1997年, 1963年など）
  const [currentYear, setCurrentYear] = useState(availableYears[0]);

  // dataType 切替時も最古年度にリセット
  useEffect(() => {
    setCurrentYear(availableYears[0]);
    setIsPlaying(false);
  }, [dataType, availableYears]);

  const rawSourceByYear = dataType === 'production' ? productionByYear : salesByYear;

  const sourceByYear = useMemo(() => {
    if (excludePrefs.length === 0) return rawSourceByYear;
    const excludeSet = new Set(excludePrefs);
    const filtered = {};
    for (const [year, arr] of Object.entries(rawSourceByYear)) {
      filtered[year] = arr.filter(d => !excludeSet.has(d.pref));
    }
    return filtered;
  }, [rawSourceByYear, excludePrefs]);

  const yearData = sourceByYear[String(currentYear)] || [];

  // 再生ロジック: useEffect + setInterval
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentYear(prev => {
        const idx = availableYears.indexOf(prev);
        if (idx >= availableYears.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return availableYears[idx + 1];
      });
    }, speed);
    return () => clearInterval(timer);
  }, [isPlaying, speed, availableYears]);

  const handlePlayToggle = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    // 最終年度で再生を押された場合は最古年度から再開
    const idx = availableYears.indexOf(currentYear);
    if (idx >= availableYears.length - 1) {
      setCurrentYear(availableYears[0]);
    }
    setIsPlaying(true);
  }, [isPlaying, availableYears, currentYear]);

  const yearTotal = yearData.reduce((s, d) => s + (d.value || 0), 0);

  const salesNote = dataType === 'sales'
    ? '販売数量は人口分布に連動するため都道府県シェアが安定しています。動きを見るには「シェア」または「製成数量」をお試しください。'
    : '';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold">都道府県別 清酒バブルマップ</h2>
          <p className="text-sm text-stone-500">
            バブルの大きさが{dataType === 'sales' ? '販売（消費）' : '製成'}数量を表します
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDataType('production')}
            className={`px-3 py-1 text-sm rounded ${dataType === 'production' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            製成数量
          </button>
          <button
            onClick={() => setDataType('sales')}
            className={`px-3 py-1 text-sm rounded ${dataType === 'sales' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            販売数量
          </button>
        </div>
      </div>

      <SourceBanner
        sources={dataType === 'production' ? ['gaikyo_old', 'estat_nenpo'] : ['jikeiretsu_13']}
        period={dataType === 'production' ? '1997-2023年' : '1963-2023年'}
      />

      {/* スケールモード切替 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-stone-500">バブル基準:</span>
        {SCALE_MODES.map(mode => (
          <button
            key={mode.value}
            onClick={() => setScaleMode(mode.value)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              scaleMode === mode.value
                ? 'bg-stone-800 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
            title={mode.hint}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* 除外トグル（dataTypeに応じて対象が変わる） */}
      <div className="flex items-center gap-2 flex-wrap">
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={excluded}
            onChange={e =>
              setExcludeFlags(prev => ({ ...prev, [dataType]: e.target.checked }))
            }
            className="w-4 h-4 accent-stone-700"
          />
          <span>
            <span className="font-medium">{preset.label}</span> を除外
          </span>
        </label>
        <span className="text-xs text-stone-400">— {preset.hint}</span>
      </div>

      {dataType === 'sales' && scaleMode === 'year' && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded">
          ⚠ {salesNote}
        </p>
      )}

      <YearSlider
        min={availableYears[0]}
        max={availableYears[availableYears.length - 1]}
        value={currentYear}
        onChange={setCurrentYear}
        isPlaying={isPlaying}
        onPlayToggle={handlePlayToggle}
        speed={speed}
        onSpeedChange={setSpeed}
      />

      <div className="text-xs text-stone-500 text-center">
        {currentYear}年 {excluded ? `全国計(${preset.label}除く)` : '全国計'}:{' '}
        <span className="font-bold text-stone-700">{Math.round(yearTotal).toLocaleString()} kL</span>
      </div>

      <BubbleMap
        yearData={yearData}
        year={currentYear}
        regions={regions}
        regionColors={regionColors}
        allYearsData={sourceByYear}
        scaleMode={scaleMode}
        excludePrefs={excludePrefs}
      />

      {/* 凡例 */}
      <div className="flex flex-wrap gap-3 mt-2 justify-center text-xs">
        {Object.entries(regionColors).map(([region, color]) => (
          <div key={region} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, opacity: 0.65 }} />
            <span>{region}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
