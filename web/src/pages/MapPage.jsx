import { useState, useCallback } from 'react';
import BubbleMap from '../components/BubbleMap';
import YearSlider from '../components/YearSlider';
import { SourceBanner } from '../components/SourceBadge';
import salesData from '../data/salesByPref.json';

const SCALE_MODES = [
  { value: 'global', label: '絶対量（全期間固定）', hint: '全期間の最大値を基準。経年縮小が見える' },
  { value: 'year', label: '絶対量（年ごと）', hint: 'その年の最大値を基準。動きが弱い場合あり' },
  { value: 'share', label: 'シェア（全国比%）', hint: '全国計に対する割合。シェア変化を強調' },
];

export default function MapPage() {
  const { years, salesByYear, productionByYear, regions, regionColors } = salesData;

  const [currentYear, setCurrentYear] = useState(years[years.length - 1]);
  const [dataType, setDataType] = useState('sales'); // 'sales' or 'production'
  const [scaleMode, setScaleMode] = useState('global');
  const [isPlaying, setIsPlaying] = useState(false);

  const availableYears = dataType === 'production'
    ? years.filter(y => productionByYear[String(y)])
    : years;

  const sourceByYear = dataType === 'production' ? productionByYear : salesByYear;
  const yearData = sourceByYear[String(currentYear)] || [];

  const handlePlayToggle = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      const timer = setInterval(() => {
        setCurrentYear(prev => {
          const idx = availableYears.indexOf(prev);
          if (idx >= availableYears.length - 1) {
            setIsPlaying(false);
            clearInterval(timer);
            return prev;
          }
          return availableYears[idx + 1];
        });
      }, 500);
      return () => clearInterval(timer);
    }
  }, [isPlaying, availableYears]);

  // 年度の全国計（スライダー横に表示）
  const yearTotal = yearData.reduce((s, d) => s + (d.value || 0), 0);

  // 動きが見えない理由の注意書き
  const sharePct = dataType === 'sales'
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
            onClick={() => { setDataType('sales'); setCurrentYear(years[years.length - 1]); }}
            className={`px-3 py-1 text-sm rounded ${dataType === 'sales' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            販売数量
          </button>
          <button
            onClick={() => { setDataType('production'); setCurrentYear(2023); }}
            className={`px-3 py-1 text-sm rounded ${dataType === 'production' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            製成数量
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

      {dataType === 'sales' && scaleMode === 'year' && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded">
          ⚠ {sharePct}
        </p>
      )}

      <YearSlider
        min={availableYears[0]}
        max={availableYears[availableYears.length - 1]}
        value={currentYear}
        onChange={setCurrentYear}
        isPlaying={isPlaying}
        onPlayToggle={handlePlayToggle}
      />

      <div className="text-xs text-stone-500 text-center">
        {currentYear}年 全国計: <span className="font-bold text-stone-700">{Math.round(yearTotal).toLocaleString()} kL</span>
      </div>

      <BubbleMap
        yearData={yearData}
        year={currentYear}
        regions={regions}
        regionColors={regionColors}
        allYearsData={sourceByYear}
        scaleMode={scaleMode}
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
