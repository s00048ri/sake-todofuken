import { useState } from 'react';
import { SourceBanner } from '../components/SourceBadge';
import shipmentData from '../data/shipment.json';

const YEARS = Object.keys(shipmentData).sort();
const TOP_N = 20;

export default function ShipmentPage() {
  const [year, setYear] = useState(YEARS[YEARS.length - 1]);
  const [view, setView] = useState('shipment'); // 'shipment' or 'export'

  const data = shipmentData[year];
  const isSurvey = data.isSurvey;

  // 値のフォーマット
  const fmt = (v, digits = 0) =>
    v != null ? v.toLocaleString('ja-JP', { maximumFractionDigits: digits }) : '—';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold mb-1">出荷・輸出データ</h2>
        <p className="text-sm text-stone-500">
          {view === 'shipment'
            ? '都道府県別の課税移出数量（出荷量）と移出先（自県/自局/他局）内訳'
            : '都道府県別の輸出売上数量・金額・輸出割合'}
        </p>
      </div>

      <SourceBanner
        sources={['gaikyo_new']}
        period="2019-2024年"
        note={isSurvey ? '※この年のデータはアンケート集計（悉皆ではない）' : ''}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setView('shipment')}
            className={`px-3 py-1 text-sm rounded ${view === 'shipment' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            課税移出数量
          </button>
          <button
            onClick={() => setView('export')}
            className={`px-3 py-1 text-sm rounded ${view === 'export' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            輸出
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-600">年:</label>
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="text-sm border border-stone-300 rounded px-2 py-1"
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
        </div>
      </div>

      {view === 'shipment' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100 text-stone-600 text-xs">
                <th className="text-left p-2">順位</th>
                <th className="text-left p-2">都道府県</th>
                <th className="text-right p-2">合計 (kL)</th>
                <th className="text-right p-2">自県 (kL)</th>
                <th className="text-right p-2">自局 (kL)</th>
                <th className="text-right p-2">他局 (kL)</th>
                <th className="text-right p-2">自県%</th>
              </tr>
            </thead>
            <tbody>
              {data.shipments.slice(0, TOP_N).map((row, i) => (
                <tr key={row.pref} className="border-t border-stone-100 hover:bg-stone-50">
                  <td className="p-2 text-stone-400">{i + 1}</td>
                  <td className="p-2 font-medium">{row.pref}</td>
                  <td className="p-2 text-right font-bold">{fmt(row.total)}</td>
                  <td className="p-2 text-right">{fmt(row.selfPref)}</td>
                  <td className="p-2 text-right">{fmt(row.selfBureau)}</td>
                  <td className="p-2 text-right">{fmt(row.otherBureau)}</td>
                  <td className="p-2 text-right text-stone-500">{fmt(row.selfPrefPct, 1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-stone-400 mt-2">
            自県 = 同一都道府県内への移出 / 自局 = 同一国税局管内の他県への移出 / 他局 = 他国税局管内への移出
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100 text-stone-600 text-xs">
                <th className="text-left p-2">順位</th>
                <th className="text-left p-2">都道府県</th>
                <th className="text-right p-2">事業者数</th>
                <th className="text-right p-2">国内売上 (kL)</th>
                <th className="text-right p-2">輸出数量 (kL)</th>
                <th className="text-right p-2">輸出金額 (百万円)</th>
                <th className="text-right p-2">輸出割合</th>
              </tr>
            </thead>
            <tbody>
              {data.exports.slice(0, TOP_N).map((row, i) => (
                <tr key={row.pref} className="border-t border-stone-100 hover:bg-stone-50">
                  <td className="p-2 text-stone-400">{i + 1}</td>
                  <td className="p-2 font-medium">{row.pref}</td>
                  <td className="p-2 text-right">{fmt(row.businessCount)}</td>
                  <td className="p-2 text-right">{fmt(row.domesticVolume)}</td>
                  <td className="p-2 text-right font-bold">{fmt(row.exportVolume)}</td>
                  <td className="p-2 text-right">{fmt(row.exportAmount)}</td>
                  <td className="p-2 text-right text-stone-500">{fmt(row.exportRatio, 1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
