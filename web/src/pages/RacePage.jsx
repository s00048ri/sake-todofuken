import { useState } from 'react';
import BarChartRace from '../components/BarChartRace';
import { SourceBanner } from '../components/SourceBadge';
import salesData from '../data/salesByPref.json';
import { useI18n } from '../i18n/index.jsx';

const EXCLUDE_PRESETS_MAP = {
  production: { prefs: ['兵庫', '京都', '新潟'] },
  sales: { prefs: ['東京'] },
};

export default function RacePage() {
  const { t, lang } = useI18n();
  const [dataType, setDataType] = useState('production');
  const [excludeFlags, setExcludeFlags] = useState({ production: false, sales: false });
  const [perCapitaMode, setPerCapitaMode] = useState('off'); // 'off' | 'total' | 'adult'

  const preset = EXCLUDE_PRESETS_MAP[dataType];
  const excluded = excludeFlags[dataType];

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

  // 人口補正は販売数量のみで意味がある
  const showPerCapita = dataType === 'sales';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold">{t('race.title')}</h2>
          <p className="text-sm text-stone-500">
            {dataType === 'production' ? t('race.productionDesc') : t('race.salesDesc')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setDataType('production');
              setPerCapitaMode('off');
            }}
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
        note={dataType === 'production' ? t('race.productionNote') : ''}
      />

      {/* 人口補正トグル (販売数量のみ) */}
      {showPerCapita && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-stone-500">{t('perCapita.label')}:</span>
          <button
            onClick={() => setPerCapitaMode('off')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              perCapitaMode === 'off' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {t('perCapita.modeOff')}
          </button>
          <button
            onClick={() => setPerCapitaMode('total')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              perCapitaMode === 'total' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {t('perCapita.modeTotal')}
          </button>
          <button
            onClick={() => setPerCapitaMode('adult')}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              perCapitaMode === 'adult' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
            title={t('perCapita.adultUnavailable')}
          >
            {t('perCapita.modeAdult')}
          </button>
          {perCapitaMode === 'adult' && (
            <span className="text-xs text-amber-600">⚠ {t('perCapita.adultUnavailable')}</span>
          )}
        </div>
      )}

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

      <BarChartRace
        data={salesData}
        dataType={dataType}
        excludePrefs={excluded ? preset.prefs : []}
        perCapitaMode={showPerCapita ? perCapitaMode : 'off'}
      />
    </div>
  );
}
