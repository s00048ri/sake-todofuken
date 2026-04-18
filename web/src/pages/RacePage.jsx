import { useState } from 'react';
import BarChartRace from '../components/BarChartRace';
import { SourceBanner } from '../components/SourceBadge';
import salesData from '../data/salesByPref.json';
import { useI18n } from '../i18n/index.jsx';

const EXCLUDE_PRESETS_MAP = {
  production: { prefs: ['兵庫', '京都', '新潟'], labelKey: 'exclude.productionLabel', hintKey: 'exclude.productionHint' },
  sales: { prefs: ['東京'], labelKey: 'exclude.salesLabel', hintKey: 'exclude.salesHint' },
};

export default function RacePage() {
  const { t, lang } = useI18n();
  const [dataType, setDataType] = useState('production');
  const [excludeFlags, setExcludeFlags] = useState({ production: false, sales: false });

  const preset = EXCLUDE_PRESETS_MAP[dataType];
  const excluded = excludeFlags[dataType];

  // 英語時は "Top 3 (Hyogo, Kyoto, Niigata)" のように表示
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
        note={dataType === 'production' ? t('race.productionNote') : ''}
      />

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

      <BarChartRace data={salesData} dataType={dataType} excludePrefs={excluded ? preset.prefs : []} />
    </div>
  );
}
