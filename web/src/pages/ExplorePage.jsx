import { useState } from 'react';
import PrefectureSelector from '../components/PrefectureSelector';
import TimeSeriesChart from '../components/TimeSeriesChart';
import TypeBreakdown from '../components/TypeBreakdown';
import { SourceBanner } from '../components/SourceBadge';
import salesData from '../data/salesByPref.json';
import { useI18n } from '../i18n/index.jsx';

export default function ExplorePage() {
  const { t } = useI18n();
  const [selectedPrefs, setSelectedPrefs] = useState(['兵庫', '新潟', '秋田', '山形', '福島']);
  const [metric, setMetric] = useState('absolute');
  const [dataKey, setDataKey] = useState('sales');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">{t('explore.title')}</h2>
        <p className="text-sm text-stone-500 mb-3">{t('explore.intro')}</p>
        <PrefectureSelector selected={selectedPrefs} onChange={setSelectedPrefs} />
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setDataKey('sales')}
            className={`px-3 py-1 text-sm rounded ${dataKey === 'sales' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            {t('explore.salesBtn')}
          </button>
          <button
            onClick={() => setDataKey('production')}
            className={`px-3 py-1 text-sm rounded ${dataKey === 'production' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            {t('explore.productionBtn')}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMetric('absolute')}
            className={`px-3 py-1 text-sm rounded ${metric === 'absolute' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            {t('explore.absolute')}
          </button>
          <button
            onClick={() => setMetric('share')}
            className={`px-3 py-1 text-sm rounded ${metric === 'share' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            {t('explore.share')}
          </button>
        </div>
      </div>

      <SourceBanner
        sources={dataKey === 'production' ? ['gaikyo_old', 'estat_nenpo'] : ['jikeiretsu_13']}
        period={dataKey === 'production' ? t('period.production') : t('period.sales')}
      />

      <TimeSeriesChart data={salesData} selectedPrefs={selectedPrefs} metric={metric} dataKey={dataKey} />

      <div className="space-y-2">
        <SourceBanner sources={['seizojokyo']} period="2020-2024 BY" />
        <TypeBreakdown selectedPrefs={selectedPrefs} />
      </div>
    </div>
  );
}
