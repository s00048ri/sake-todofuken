import { useState } from 'react';
import BarChartRace from '../components/BarChartRace';
import { SourceBanner } from '../components/SourceBadge';
import salesData from '../data/salesByPref.json';

// データタイプごとの除外候補（突出して見にくくする都道府県）
const EXCLUDE_PRESETS = {
  production: {
    prefs: ['兵庫', '京都', '新潟'],
    label: '主要3県（兵庫・京都・新潟）',
    hint: '中規模県（秋田・山形・福島・長野等）の動きが見やすくなります',
  },
  sales: {
    prefs: ['東京'],
    label: '東京',
    hint: '消費地として突出する東京を除くと、他県の順位変動が見えます',
  },
};

export default function RacePage() {
  const [dataType, setDataType] = useState('production');
  // データタイプごとに除外フラグを独立管理
  const [excludeFlags, setExcludeFlags] = useState({ production: false, sales: false });

  const productionSources = ['gaikyo_old', 'estat_nenpo'];
  const salesSources = ['jikeiretsu_13'];

  const preset = EXCLUDE_PRESETS[dataType];
  const excluded = excludeFlags[dataType];

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

      <BarChartRace
        data={salesData}
        dataType={dataType}
        excludePrefs={excluded ? preset.prefs : []}
      />
    </div>
  );
}
