import { useState, useCallback, useMemo, useEffect } from 'react';
import BubbleMap from '../components/BubbleMap';
import YearSlider from '../components/YearSlider';
import { SourceBanner } from '../components/SourceBadge';
import salesData from '../data/salesByPref.json';
import { useI18n } from '../i18n/index.jsx';

const DEFAULT_DATA_TYPE = 'production';

const EXCLUDE_PRESETS = {
  production: { prefs: ['兵庫', '京都', '新潟'] },
  sales: { prefs: ['東京'] },
};

export default function MapPage() {
  const { t, lang, region: tRegion } = useI18n();
  const { years, salesByYear, productionByYear, regions, regionColors } = salesData;

  const [dataType, setDataType] = useState(DEFAULT_DATA_TYPE);
  const [scaleMode, setScaleMode] = useState('global');
  const [excludeFlags, setExcludeFlags] = useState({ production: false, sales: false });
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);

  const preset = EXCLUDE_PRESETS[dataType];
  const excluded = excludeFlags[dataType];
  const excludePrefs = excluded ? preset.prefs : [];

  const availableYears = useMemo(
    () =>
      dataType === 'production'
        ? years.filter((y) => productionByYear[String(y)])
        : years,
    [dataType, years, productionByYear]
  );

  const [currentYear, setCurrentYear] = useState(availableYears[0]);

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
      filtered[year] = arr.filter((d) => !excludeSet.has(d.pref));
    }
    return filtered;
  }, [rawSourceByYear, excludePrefs]);

  const yearData = sourceByYear[String(currentYear)] || [];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentYear((prev) => {
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
    const idx = availableYears.indexOf(currentYear);
    if (idx >= availableYears.length - 1) {
      setCurrentYear(availableYears[0]);
    }
    setIsPlaying(true);
  }, [isPlaying, availableYears, currentYear]);

  const yearTotal = yearData.reduce((s, d) => s + (d.value || 0), 0);

  const excludeLabel =
    dataType === 'production'
      ? lang === 'en'
        ? 'Top 3 (Hyogo, Kyoto, Niigata)'
        : '主要3県（兵庫・京都・新潟）'
      : lang === 'en'
      ? 'Tokyo'
      : '東京';

  const checkboxPrefix = lang === 'en' ? 'Exclude ' : '';
  const checkboxSuffix = lang === 'en' ? '' : ' を除外';

  const scaleModes = [
    { value: 'global', label: t('map.scaleGlobal'), hint: t('map.scaleGlobalHint') },
    { value: 'year', label: t('map.scaleYear'), hint: t('map.scaleYearHint') },
    { value: 'share', label: t('map.scaleShare'), hint: t('map.scaleShareHint') },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold">{t('map.title')}</h2>
          <p className="text-sm text-stone-500">
            {dataType === 'sales' ? t('map.descSales') : t('map.descProduction')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setDataType('production')}
            className={`px-3 py-1 text-sm rounded ${dataType === 'production' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            {t('dataType.production')}
          </button>
          <button
            onClick={() => setDataType('sales')}
            className={`px-3 py-1 text-sm rounded ${dataType === 'sales' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            {t('dataType.sales')}
          </button>
        </div>
      </div>

      <SourceBanner
        sources={dataType === 'production' ? ['gaikyo_old', 'estat_nenpo'] : ['jikeiretsu_13']}
        period={dataType === 'production' ? t('period.production') : t('period.sales')}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-stone-500">{t('map.scaleLabel')}</span>
        {scaleModes.map((mode) => (
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

      <div className="flex items-center gap-2 flex-wrap">
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={excluded}
            onChange={(e) =>
              setExcludeFlags((prev) => ({ ...prev, [dataType]: e.target.checked }))
            }
            className="w-4 h-4 accent-stone-700"
          />
          <span>
            {checkboxPrefix}
            <span className="font-medium">{excludeLabel}</span>
            {checkboxSuffix}
          </span>
        </label>
        <span className="text-xs text-stone-400">
          — {dataType === 'production' ? t('exclude.productionHint') : t('exclude.salesHint')}
        </span>
      </div>

      {dataType === 'sales' && scaleMode === 'year' && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded">
          ⚠ {t('map.salesNote')}
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
        {currentYear}
        {lang === 'ja' ? '年 ' : ' '}
        {excluded ? t('map.totalLabelExcluded', { name: excludeLabel }) : t('map.totalLabel')}:{' '}
        <span className="font-bold text-stone-700">
          {Math.round(yearTotal).toLocaleString()} kL
        </span>
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

      <div className="flex flex-wrap gap-3 mt-2 justify-center text-xs">
        {Object.entries(regionColors).map(([region, color]) => (
          <div key={region} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color, opacity: 0.65 }}
            />
            <span>{tRegion(region)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
