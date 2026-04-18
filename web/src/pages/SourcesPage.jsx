import metadata from '../data/metadata.json';
import { SOURCE_INFO } from '../components/SourceBadge';
import { useI18n } from '../i18n/index.jsx';

// 英語版の用語（訳が必要な部分）
const TERMS_EN = {
  製成数量: { term: 'Production volume', def: 'Volume produced at manufacturing facilities. A producer-based metric.' },
  '販売（消費）数量': { term: 'Sales (consumption) volume', def: 'Volume sold to consumers within each prefecture. A consumer-based metric.' },
  課税移出数量: { term: 'Tax-declared shipment', def: 'Volume shipped from manufacturing facilities subject to liquor tax. A shipment-based metric.' },
  '20度換算': { term: '20°-equivalent', def: 'Volume normalized to 20% alcohol content (standard unit for specific-designation sake).' },
  '酒造年度 (BY)': { term: 'Brewing Year (BY)', def: 'July 1 to June 30 of the following year (e.g., BY 令和6 = 2024-07-01 to 2025-06-30).' },
  '年度（税務年度）': { term: 'Fiscal year', def: 'April 1 to March 31 of the following year (used by e-Stat Statistics Yearbook).' },
};

const SOURCES_EN_OVERRIDE = {
  jikeiretsu_13: {
    name: 'NTA Statistics Yearbook — Time-series Excel 13.xlsx',
    official_title: 'Liquor tax status (13) Sales/consumption volume by prefecture',
    publisher: 'National Tax Agency of Japan',
    format: 'Excel (.xlsx)',
    coverage: '1963 (Showa 38) – 2023 (Reiwa 5), 61 years',
    metric: 'Sales (consumption) volume (kL) — consumer-based',
    notes: 'Hokkaido is substituted with the Sapporo Bureau total; Okinawa is missing in some years. Census-based from 1963.',
  },
  estat_nenpo: {
    name: 'NTA Statistics Yearbook — Table 0802 (via e-Stat)',
    official_title: 'Table 2: Production volume & sales volume — Sheet "3(3) Production by prefecture"',
    publisher: 'NTA / e-Stat',
    format: 'Excel (.xls/.xlsx)',
    coverage: '2007 (Heisei 19) – 2023 (Reiwa 5), 17 years',
    metric: 'Production volume (kL) — producer-based (sake column extracted)',
    notes: '2007-2010 are old .xls, 2011+ are .xlsx. Covers all 47 prefectures. Typically released ~2-3 years after data collection.',
  },
  gaikyo_old: {
    name: 'NTA — Overview of Sake Manufacturing, Table 17',
    official_title: 'Production & tax-declared shipment volume trends by prefecture',
    publisher: 'National Tax Agency of Japan',
    format: 'PDF',
    coverage: '1997 (Heisei 9) – 2017 (Heisei 29), 21 years',
    metric: 'Production volume 20°-equiv. (kL)',
    notes: 'Discontinued after Heisei 30 (FY2018). Each PDF contains 3-5 years of rolling data. Census-based.',
  },
  gaikyo_new: {
    name: 'NTA — Overview of Liquor Manufacturing & Wholesale (Sake Section)',
    official_title: 'Prefecture-level business count & transactions / Tax-declared shipment volumes',
    publisher: 'National Tax Agency of Japan',
    format: 'PDF',
    coverage: '2019 (Reiwa 1 data) – 2024 (Reiwa 6 data), 6 years',
    metric: 'Tax-declared shipment (kL), export volume (kL), export value (million JPY), etc.',
    notes: 'IMPORTANT: From the Reiwa 4 survey (2021 data) onward, this is survey-based (not a census). Not directly comparable with older census-based data. Response counts vary year to year (e.g., Kyoto 2021 is abnormally low due to low response).',
  },
  seizojokyo: {
    name: 'NTA — Sake Production Report (Reference Tables 7 & 2)',
    official_title: 'Sake production status by prefecture and sake type (All / Junmai / Junmai Ginjo / Ginjo / Honjozo / General)',
    publisher: 'National Tax Agency of Japan',
    format: 'PDF',
    coverage: 'Brewing Year Reiwa 2 (2020) – Reiwa 6 (2024), 5 brewing years',
    metric: 'Production volume 20°-equiv. (kL), brewery count, milling ratio, average composition',
    notes: 'Brewing year (BY) runs July 1 to June 30. Cross-tabulation by specific sake type. BY 2020 is a simplified version (Reference 2 only), others are detailed (Reference 7).',
  },
};

const NOTES_EN = [
  'The historical peak of sake production was 1973 (Showa 48) at ~1.77 million kL.',
  'The specific-designation sake system was established in 1988 (Showa 63) under the Notice on Manufacturing Method and Quality Labeling Standards for Sake.',
  'From 2021 (Reiwa 4 survey) onward, the Overview of Liquor Manufacturing & Wholesale is survey-based. Expect a discontinuity with older census data.',
  'Production volume (producer-based) and sales volume (consumer-based) are different metrics — use them according to your purpose.',
  'Prefecture-level production data before 1997 is not available online. The paper edition of the NTA Statistics Yearbook (via National Diet Library) is required for earlier years.',
];

const FILE_DESC_EN = {
  'production_by_pref.csv': 'Main panel: sales + production volumes by prefecture and year, with source flags',
  'production_by_pref_type.csv': 'Prefecture × brewing year × sake type panel',
  'tokumei_ratio_by_pref.csv': 'Specific-designation sake ratio by prefecture',
  'shipment_by_pref.csv': 'Prefecture-level tax-declared shipment (with destination breakdown)',
  'business_export_by_pref.csv': 'Prefecture-level business count, domestic sales, and exports',
};

const FILE_CAVEAT_EN = {
  'shipment_by_pref.csv': 'Data from 2021 onward is survey-based, not a census',
  'business_export_by_pref.csv': 'Data from 2021 onward is survey-based, not a census',
};

export default function SourcesPage() {
  const { t, lang } = useI18n();

  const sources = metadata.sources || {};
  const files = metadata.files || {};
  const notes = lang === 'en' ? NOTES_EN : metadata.important_notes || [];
  const definitions = metadata.key_definitions || {};

  const getSourceView = (key, src) => {
    if (lang !== 'en') return src;
    return { ...src, ...SOURCES_EN_OVERRIDE[key] };
  };

  const citationText =
    lang === 'en'
      ? `This data integrates and processes the following public statistics:
・NTA Statistics Yearbook — Time-series data (1963–2023)
・NTA Statistics Yearbook — Table 0802 via e-Stat (2007–2023)
・NTA — Overview of Sake Manufacturing Industry (1997–2017)
・NTA — Overview of Liquor Manufacturing & Wholesale (2019–2024)
・NTA — Sake Production Report (BY 2020–2024)`
      : `本データは以下の公的統計を統合・加工したものです:
・国税庁統計年報 時系列データ (1963-2023)
・国税庁統計年報 表0802 (e-Stat経由, 2007-2023)
・国税庁「清酒製造業の概況」(1997-2017)
・国税庁「酒類製造業及び酒類卸売業の概況」(2019-2024)
・国税庁「清酒の製造状況等について」(2020BY-2024BY)`;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('sources.title')}</h2>
        <p className="text-sm text-stone-600">{t('sources.intro')}</p>
      </div>

      <section>
        <h3 className="text-lg font-bold mb-3">{t('sources.usedSources')}</h3>
        <div className="space-y-4">
          {Object.entries(sources).map(([key, srcRaw]) => {
            const src = getSourceView(key, srcRaw);
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
                    {t('sources.openSourcePage')}
                  </a>
                </div>
                {src.official_title && (
                  <p className="text-sm text-stone-700 mb-1">
                    <span className="text-stone-500">{t('sources.officialTitle')} </span>
                    {src.official_title}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                  <div>
                    <span className="text-stone-500">{t('sources.publisher')} </span>
                    {src.publisher}
                  </div>
                  <div>
                    <span className="text-stone-500">{t('sources.format')} </span>
                    {src.format}
                  </div>
                  <div>
                    <span className="text-stone-500">{t('sources.coverage')} </span>
                    {src.coverage}
                  </div>
                  <div>
                    <span className="text-stone-500">{t('sources.metric')} </span>
                    {src.metric}
                  </div>
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

      <section>
        <h3 className="text-lg font-bold mb-3">{t('sources.termsTitle')}</h3>
        <dl className="space-y-2 text-sm">
          {Object.entries(definitions).map(([termJa, defJa]) => {
            const enEntry = TERMS_EN[termJa];
            const term = lang === 'en' && enEntry ? enEntry.term : termJa;
            const def = lang === 'en' && enEntry ? enEntry.def : defJa;
            return (
              <div key={termJa} className="flex gap-3 pb-2 border-b border-stone-100">
                <dt className="font-bold w-40 shrink-0">{term}</dt>
                <dd className="text-stone-700">{def}</dd>
              </div>
            );
          })}
        </dl>
      </section>

      <section>
        <h3 className="text-lg font-bold mb-3">{t('sources.notesTitle')}</h3>
        <ul className="space-y-2 text-sm text-stone-700 list-disc pl-5">
          {notes.map((note, i) => (
            <li key={i}>{note}</li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-bold mb-3">{t('sources.filesTitle')}</h3>
        <p className="text-sm text-stone-600 mb-3">{t('sources.filesIntro')}</p>
        <div className="space-y-2">
          {Object.entries(files).map(([filename, info]) => (
            <div key={filename} className="border rounded p-3 bg-stone-50 text-sm">
              <div className="font-mono text-xs font-bold text-stone-700">{filename}</div>
              <div className="text-stone-600 mt-1">
                {lang === 'en' ? FILE_DESC_EN[filename] || info.description : info.description}
              </div>
              {(info.caveat || FILE_CAVEAT_EN[filename]) && (
                <div className="text-xs text-amber-700 mt-1">
                  ⚠ {lang === 'en' ? FILE_CAVEAT_EN[filename] || info.caveat : info.caveat}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-stone-50 p-4 rounded border">
        <h3 className="text-lg font-bold mb-2">{t('sources.citation')}</h3>
        <p className="text-sm text-stone-700 mb-2">{t('sources.citationIntro')}</p>
        <pre className="text-xs bg-white p-3 rounded border whitespace-pre-wrap leading-relaxed">
          {citationText}
        </pre>
      </section>

      <div className="text-xs text-stone-400 text-center pt-4">
        {t('sources.versionLabel', { v: metadata.version, date: metadata.last_updated })}
      </div>
    </div>
  );
}
