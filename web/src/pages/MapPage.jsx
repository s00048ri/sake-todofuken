import { useState, useCallback } from 'react';
import BubbleMap from '../components/BubbleMap';
import YearSlider from '../components/YearSlider';
import { SourceBanner } from '../components/SourceBadge';
import salesData from '../data/salesByPref.json';

export default function MapPage() {
  const { years, salesByYear, productionByYear, regions, regionColors } = salesData;

  const [currentYear, setCurrentYear] = useState(years[years.length - 1]);
  const [dataType, setDataType] = useState('sales'); // 'sales' or 'production'
  const [isPlaying, setIsPlaying] = useState(false);

  const availableYears = dataType === 'production'
    ? years.filter(y => productionByYear[String(y)])
    : years;

  const yearData = dataType === 'production'
    ? productionByYear[String(currentYear)] || []
    : salesByYear[String(currentYear)] || [];

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

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
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

      <YearSlider
        min={availableYears[0]}
        max={availableYears[availableYears.length - 1]}
        value={currentYear}
        onChange={setCurrentYear}
        isPlaying={isPlaying}
        onPlayToggle={handlePlayToggle}
      />

      <BubbleMap
        yearData={yearData}
        year={currentYear}
        regions={regions}
        regionColors={regionColors}
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
