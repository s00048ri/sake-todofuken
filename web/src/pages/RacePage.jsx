import { useState } from 'react';
import BarChartRace from '../components/BarChartRace';
import { SourceBanner } from '../components/SourceBadge';
import salesData from '../data/salesByPref.json';

const BIG3 = ['兵庫', '京都', '新潟'];

export default function RacePage() {
  const [dataType, setDataType] = useState('production');
  const [excludeBig3, setExcludeBig3] = useState(false);

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

      {/* Big 3 除外トグル */}
      <div className="flex items-center gap-2">
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={excludeBig3}
            onChange={e => setExcludeBig3(e.target.checked)}
            className="w-4 h-4 accent-stone-700"
          />
          <span>
            主要3県（<span className="font-medium">兵庫・京都・新潟</span>）を除外
          </span>
        </label>
        <span className="text-xs text-stone-400">
          — 中規模県（秋田・山形・福島・長野等）の動きが見やすくなります
        </span>
      </div>

      <BarChartRace
        data={salesData}
        dataType={dataType}
        excludePrefs={excludeBig3 ? BIG3 : []}
      />
    </div>
  );
}
