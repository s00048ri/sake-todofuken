import { useState } from 'react';
import BarChartRace from '../components/BarChartRace';
import { SourceBanner } from '../components/SourceBadge';
import salesData from '../data/salesByPref.json';

export default function RacePage() {
  const [dataType, setDataType] = useState('production');

  const productionSources = ['gaikyo_old', 'estat_nenpo'];
  const salesSources = ['jikeiretsu_13'];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold">都道府県別 清酒ランキング</h2>
          <p className="text-sm text-stone-500">
            {dataType === 'production'
              ? '製成数量（20度換算 kL）1997-2023年。生産地ベース。'
              : '販売（消費）数量（kL）1963-2023年。消費地ベース。'}
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
        sources={dataType === 'production' ? productionSources : salesSources}
        period={dataType === 'production' ? '1997-2023年' : '1963-2023年'}
        note={dataType === 'production' ? '1997-2006年は旧概況、2007年以降はe-Stat' : ''}
      />

      <BarChartRace data={salesData} dataType={dataType} />
    </div>
  );
}
