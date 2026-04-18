import metadata from '../data/metadata.json';
import { SOURCE_INFO } from '../components/SourceBadge';

export default function SourcesPage() {
  const sources = metadata.sources || {};
  const files = metadata.files || {};
  const notes = metadata.important_notes || [];
  const definitions = metadata.key_definitions || {};

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">データ出典</h2>
        <p className="text-sm text-stone-600">
          本サイトで表示しているデータは全て公的統計（国税庁発表）を集計・加工したものです。
          5つの出典を組み合わせて長期パネルデータを構築しています。
        </p>
      </div>

      {/* 出典一覧 */}
      <section>
        <h3 className="text-lg font-bold mb-3">使用している統計資料</h3>
        <div className="space-y-4">
          {Object.entries(sources).map(([key, src]) => {
            const badge = SOURCE_INFO[key];
            return (
              <div key={key} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                  <h4 className="font-bold text-base">
                    {badge ? (
                      <span className={`inline-block px-2 py-0.5 mr-2 text-xs rounded border ${badge.color}`}>
                        {badge.short}
                      </span>
                    ) : null}
                    {src.name}
                  </h4>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    出典ページを開く →
                  </a>
                </div>
                {src.official_title && (
                  <p className="text-sm text-stone-700 mb-1">
                    <span className="text-stone-500">正式名称: </span>
                    {src.official_title}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                  <div><span className="text-stone-500">発行: </span>{src.publisher}</div>
                  <div><span className="text-stone-500">形式: </span>{src.format}</div>
                  <div><span className="text-stone-500">期間: </span>{src.coverage}</div>
                  <div><span className="text-stone-500">指標: </span>{src.metric}</div>
                </div>
                {src.notes && (
                  <p className="text-xs text-stone-500 mt-2 bg-amber-50 border border-amber-100 p-2 rounded">
                    ⚠ {src.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 用語定義 */}
      <section>
        <h3 className="text-lg font-bold mb-3">用語の定義</h3>
        <dl className="space-y-2 text-sm">
          {Object.entries(definitions).map(([term, definition]) => (
            <div key={term} className="flex gap-3 pb-2 border-b border-stone-100">
              <dt className="font-bold w-32 shrink-0">{term}</dt>
              <dd className="text-stone-700">{definition}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 重要な注記 */}
      <section>
        <h3 className="text-lg font-bold mb-3">重要な注記</h3>
        <ul className="space-y-2 text-sm text-stone-700 list-disc pl-5">
          {notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </section>

      {/* データファイル */}
      <section>
        <h3 className="text-lg font-bold mb-3">公開データファイル</h3>
        <p className="text-sm text-stone-600 mb-3">
          本プロジェクトで構築した統合パネルデータは以下のCSVで公開予定です。
        </p>
        <div className="space-y-2">
          {Object.entries(files).map(([filename, info]) => (
            <div key={filename} className="border rounded p-3 bg-stone-50 text-sm">
              <div className="font-mono text-xs font-bold text-stone-700">{filename}</div>
              <div className="text-stone-600 mt-1">{info.description}</div>
              {info.caveat && (
                <div className="text-xs text-amber-700 mt-1">⚠ {info.caveat}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 引用方法 */}
      <section className="bg-stone-50 p-4 rounded border">
        <h3 className="text-lg font-bold mb-2">引用について</h3>
        <p className="text-sm text-stone-700 mb-2">
          本サイトのデータまたは可視化を引用する場合は、以下の形式を推奨します:
        </p>
        <pre className="text-xs bg-white p-3 rounded border whitespace-pre-wrap leading-relaxed">
{`本データは以下の公的統計を統合・加工したものです:
・国税庁統計年報 時系列データ (1963-2023)
・国税庁統計年報 表0802 (e-Stat経由, 2007-2023)
・国税庁「清酒製造業の概況」(1997-2017)
・国税庁「酒類製造業及び酒類卸売業の概況」(2019-2024)
・国税庁「清酒の製造状況等について」(2020BY-2024BY)`}
        </pre>
      </section>

      <div className="text-xs text-stone-400 text-center pt-4">
        メタデータ版数: v{metadata.version} / 最終更新: {metadata.last_updated}
      </div>
    </div>
  );
}
