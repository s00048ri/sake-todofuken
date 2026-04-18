import { useState } from 'react';
import { SourceBanner } from '../components/SourceBadge';
import shipmentData from '../data/shipment.json';
import { useI18n } from '../i18n/index.jsx';

const YEARS = Object.keys(shipmentData).sort();
const TOP_N = 20;

export default function ShipmentPage() {
  const { t, lang, pref: tPref } = useI18n();
  const [year, setYear] = useState(YEARS[YEARS.length - 1]);
  const [view, setView] = useState('shipment');

  const data = shipmentData[year];
  const isSurvey = data.isSurvey;

  const fmt = (v, digits = 0) =>
    v != null ? v.toLocaleString('ja-JP', { maximumFractionDigits: digits }) : '—';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold mb-1">{t('shipment.title')}</h2>
        <p className="text-sm text-stone-500">
          {view === 'shipment' ? t('shipment.descShipment') : t('shipment.descExport')}
        </p>
      </div>

      <SourceBanner
        sources={['gaikyo_new']}
        period="2019-2024"
        note={isSurvey ? t('shipment.surveyNote') : ''}
      />

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setView('shipment')}
            className={`px-3 py-1 text-sm rounded ${view === 'shipment' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            {t('shipment.tabShipment')}
          </button>
          <button
            onClick={() => setView('export')}
            className={`px-3 py-1 text-sm rounded ${view === 'export' ? 'bg-stone-800 text-white' : 'bg-stone-200'}`}
          >
            {t('shipment.tabExport')}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-stone-600">{t('shipment.yearLabel')}</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="text-sm border border-stone-300 rounded px-2 py-1"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
                {lang === 'ja' ? '年' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {view === 'shipment' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100 text-stone-600 text-xs">
                <th className="text-left p-2">{t('shipment.cols.rank')}</th>
                <th className="text-left p-2">{t('shipment.cols.prefecture')}</th>
                <th className="text-right p-2">{t('shipment.cols.totalKl')}</th>
                <th className="text-right p-2">{t('shipment.cols.selfPrefKl')}</th>
                <th className="text-right p-2">{t('shipment.cols.selfBureauKl')}</th>
                <th className="text-right p-2">{t('shipment.cols.otherBureauKl')}</th>
                <th className="text-right p-2">{t('shipment.cols.selfPrefPct')}</th>
              </tr>
            </thead>
            <tbody>
              {data.shipments.slice(0, TOP_N).map((row, i) => (
                <tr key={row.pref} className="border-t border-stone-100 hover:bg-stone-50">
                  <td className="p-2 text-stone-400">{i + 1}</td>
                  <td className="p-2 font-medium">{tPref(row.pref)}</td>
                  <td className="p-2 text-right font-bold">{fmt(row.total)}</td>
                  <td className="p-2 text-right">{fmt(row.selfPref)}</td>
                  <td className="p-2 text-right">{fmt(row.selfBureau)}</td>
                  <td className="p-2 text-right">{fmt(row.otherBureau)}</td>
                  <td className="p-2 text-right text-stone-500">{fmt(row.selfPrefPct, 1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-stone-400 mt-2">{t('shipment.shipmentLegend')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-100 text-stone-600 text-xs">
                <th className="text-left p-2">{t('shipment.cols.rank')}</th>
                <th className="text-left p-2">{t('shipment.cols.prefecture')}</th>
                <th className="text-right p-2">{t('shipment.cols.businessCount')}</th>
                <th className="text-right p-2">{t('shipment.cols.domesticKl')}</th>
                <th className="text-right p-2">{t('shipment.cols.exportKl')}</th>
                <th className="text-right p-2">{t('shipment.cols.exportMil')}</th>
                <th className="text-right p-2">{t('shipment.cols.exportRatio')}</th>
              </tr>
            </thead>
            <tbody>
              {data.exports.slice(0, TOP_N).map((row, i) => (
                <tr key={row.pref} className="border-t border-stone-100 hover:bg-stone-50">
                  <td className="p-2 text-stone-400">{i + 1}</td>
                  <td className="p-2 font-medium">{tPref(row.pref)}</td>
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
