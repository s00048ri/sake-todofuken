/**
 * 出典バッジ：各ビュー上部に表示するデータソース情報
 */

const SOURCE_INFO = {
  jikeiretsu_13: {
    label: '国税庁統計年報 時系列Excel',
    short: '時系列Excel',
    url: 'https://www.nta.go.jp/publication/statistics/kokuzeicho/jikeiretsu/xls/13.xlsx',
    method: '悉皆集計',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  estat_nenpo: {
    label: '国税庁統計年報 表0802（e-Stat）',
    short: 'e-Stat統計年報',
    url: 'https://www.e-stat.go.jp/stat-search/files?toukei=00351010&tstat=000001043366',
    method: '悉皆集計',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  gaikyo_old: {
    label: '国税庁「清酒製造業の概況」表17',
    short: '旧概況',
    url: 'https://www.nta.go.jp/taxes/sake/shiori-gaikyo/seishu/02.htm',
    method: '悉皆調査',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  gaikyo_new: {
    label: '国税庁「酒類製造業及び酒類卸売業の概況」',
    short: '新概況',
    url: 'https://www.nta.go.jp/taxes/sake/shiori-gaikyo/seizo_oroshiuri/',
    method: '2021年以降はアンケート集計',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  seizojokyo: {
    label: '国税庁「清酒の製造状況等について」',
    short: '製造状況',
    url: 'https://www.nta.go.jp/taxes/sake/shiori-gaikyo/seizojokyo/07.htm',
    method: '悉皆調査',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
  },
};

export function SourceBadge({ sourceKey, showMethod = false }) {
  const info = SOURCE_INFO[sourceKey];
  if (!info) return null;
  return (
    <a
      href={info.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded border ${info.color} hover:underline`}
      title={info.label}
    >
      <span>{info.short}</span>
      {showMethod && <span className="text-[10px] opacity-70">({info.method})</span>}
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

export function SourceBanner({ sources, period, note }) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-stone-50 border border-stone-200 rounded text-xs">
      <span className="text-stone-500">出典:</span>
      {sources.map(s => (
        <SourceBadge key={s} sourceKey={s} />
      ))}
      {period && <span className="text-stone-500 ml-2">期間: {period}</span>}
      {note && <span className="text-stone-400 ml-2 italic">{note}</span>}
    </div>
  );
}

export { SOURCE_INFO };
