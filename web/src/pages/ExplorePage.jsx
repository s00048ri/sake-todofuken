import { useState } from 'react';
import PrefectureSelector from '../components/PrefectureSelector';
import TimeSeriesChart from '../components/TimeSeriesChart';
import TypeBreakdown from '../components/TypeBreakdown';
import { SourceBanner } from '../components/SourceBadge';
import salesData from '../data/salesByPref.json';

export default function ExplorePage() {
  const [selectedPrefs, setSelectedPrefs] = useState(['兵庫', '新潟', '秋田', '山形', '福島']);
  const [metric, setMetric] = useState('absolute');
  const [dataKey, setDataKey] = useState('sales');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">インタラクティブ探索</h2>
        <p className="text-sm text-stone-500 mb-3">
          都道府県を選んで時系列推移を比較。プリセットから仮説検証パターンも選べます。
        </p>
        <PrefectureSelector
          selected={selectedPrefs}
          onChange={setSelectedPrefs}
          regionColors={salesData.regionColors}
        />
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setDataKey('sales')}
            className={`px-3 py-1 text-sm rounded ${dataKey === 'sales' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            販売数量 (1963-)
          </button>
          <button
            onClick={() => setDataKey('production')}
            className={`px-3 py-1 text-sm rounded ${dataKey === 'production' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            製成数量 (2007-)
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMetric('absolute')}
            className={`px-3 py-1 text-sm rounded ${metric === 'absolute' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            絶対量
          </button>
          <button
            onClick={() => setMetric('share')}
            className={`px-3 py-1 text-sm rounded ${metric === 'share' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            シェア
          </button>
        </div>
      </div>

      <SourceBanner
        sources={dataKey === 'production' ? ['gaikyo_old', 'estat_nenpo'] : ['jikeiretsu_13']}
        period={dataKey === 'production' ? '1997-2023年' : '1963-2023年'}
      />

      {/* Time series chart */}
      <TimeSeriesChart
        data={salesData}
        selectedPrefs={selectedPrefs}
        metric={metric}
        dataKey={dataKey}
      />

      {/* Type breakdown */}
      <div className="space-y-2">
        <SourceBanner
          sources={['seizojokyo']}
          period="2020-2024酒造年度"
        />
        <TypeBreakdown selectedPrefs={selectedPrefs} />
      </div>
    </div>
  );
}
