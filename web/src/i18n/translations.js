/**
 * 翻訳データ
 *
 * 使い方:
 *   const { t, lang } = useI18n();
 *   <h2>{t('race.title')}</h2>
 *   <div>{prefName('兵庫', lang)}</div>   // 「兵庫」or「Hyogo」
 */

export const STRINGS = {
  ja: {
    site: {
      title: '日本酒の地理学',
      subtitle: '都道府県別清酒生産量の変遷 1963-2024',
      description: '日本の清酒（日本酒）の都道府県別生産量の長期パネルデータ（1963-2024）をインタラクティブに可視化。公的統計を統合。',
    },
    nav: {
      race: 'レース',
      map: '地図',
      explore: '探索',
      shipment: '出荷・輸出',
      sources: '出典',
    },
    footer: {
      dataSources: 'データ出典:',
      sourcesList: '国税庁統計年報（時系列Excel・e-Stat）、清酒製造業の概況、酒類製造業及び酒類卸売業の概況、清酒の製造状況等について',
      seeDetails: '詳細は',
      sourcesPage: '出典ページ',
      seeDetailsEnd: 'をご覧ください。データは公的統計を統合・加工したものです。',
    },
    dataType: {
      production: '製成数量',
      sales: '販売数量',
      productionLong: '製成数量（20度換算 kL）',
      salesLong: '販売（消費）数量（kL）',
    },
    period: {
      production: '1997-2023年',
      sales: '1963-2023年',
    },
    race: {
      title: '都道府県別 清酒ランキング',
      productionDesc: '製成数量（20度換算 kL）1997-2023年。生産地ベース。',
      salesDesc: '販売（消費）数量（kL）1963-2023年。消費地ベース。',
      productionNote: '1997-2006年は旧概況、2007年以降はe-Stat',
    },
    map: {
      title: '都道府県別 清酒バブルマップ',
      descProduction: 'バブルの大きさが製成数量を表します',
      descSales: 'バブルの大きさが販売（消費）数量を表します',
      scaleLabel: 'バブル基準:',
      scaleGlobal: '絶対量（全期間固定）',
      scaleYear: '絶対量（年ごと）',
      scaleShare: 'シェア（全国比%）',
      scaleGlobalHint: '全期間の最大値を基準。経年縮小が見える',
      scaleYearHint: 'その年の最大値を基準。動きが弱い場合あり',
      scaleShareHint: '全国計に対する割合。シェア変化を強調',
      totalLabel: '全国計',
      totalLabelExcluded: '全国計({name}除く)',
      salesNote: '販売数量は人口分布に連動するため都道府県シェアが安定しています。動きを見るには「シェア」または「製成数量」をお試しください。',
      mapNote: '本土マップは本州・北海道・四国・九州のみ（南西諸島・小笠原諸島は地理的に除外）。',
      okinawaNote: '沖縄は左上インセット（バブルの大きさは本土と同じスケール）。',
      insetTitle: '沖縄県（別スケール表示ではありません）',
    },
    exclude: {
      productionLabel: '主要3県（兵庫・京都・新潟）',
      productionLabelEn: '主要3県（兵庫・京都・新潟）',
      salesLabel: '東京',
      productionHint: '中規模県（秋田・山形・福島・長野等）の動きが見やすくなります',
      salesHint: '消費地として突出する東京を除くと、他県の順位変動が見えます',
      suffix: ' を除外',
    },
    year: '年',
    unit: { kl: 'kL' },
    explore: {
      title: 'インタラクティブ探索',
      intro: '都道府県を選んで時系列推移を比較。プリセットから仮説検証パターンも選べます。',
      salesBtn: '販売数量 (1963-)',
      productionBtn: '製成数量 (2007-)',
      absolute: '絶対量',
      share: 'シェア',
      noPrefs: '上のセレクターから都道府県を選択してください',
      typeTitle: '特定名称酒構成（{year}酒造年度、20度換算 kL）',
      presets: {
        hypo1: '仮説1: 灘 vs 伏見',
        hypo2: '仮説2: 新潟の台頭',
        hypo3: '仮説3: 東北の台頭',
        metro: '大都市圏消費',
        clear: 'クリア',
      },
      regionGroup: {
        tohoku: '東北',
        kanto: '関東',
        chubu: '中部',
        kinki: '近畿',
        others: 'その他',
      },
      selectedCount: '{n}/{max} 選択中',
    },
    shipment: {
      title: '出荷・輸出データ',
      descShipment: '都道府県別の課税移出数量（出荷量）と移出先（自県/自局/他局）内訳',
      descExport: '都道府県別の輸出売上数量・金額・輸出割合',
      tabShipment: '課税移出数量',
      tabExport: '輸出',
      surveyNote: '※この年のデータはアンケート集計（悉皆ではない）',
      yearLabel: '年:',
      cols: {
        rank: '順位',
        prefecture: '都道府県',
        totalKl: '合計 (kL)',
        selfPrefKl: '自県 (kL)',
        selfBureauKl: '自局 (kL)',
        otherBureauKl: '他局 (kL)',
        selfPrefPct: '自県%',
        businessCount: '事業者数',
        domesticKl: '国内売上 (kL)',
        exportKl: '輸出数量 (kL)',
        exportMil: '輸出金額 (百万円)',
        exportRatio: '輸出割合',
      },
      shipmentLegend: '自県 = 同一都道府県内への移出 / 自局 = 同一国税局管内の他県への移出 / 他局 = 他国税局管内への移出',
    },
    sources: {
      title: 'データ出典',
      intro: '本サイトで表示しているデータは全て公的統計（国税庁発表）を集計・加工したものです。5つの出典を組み合わせて長期パネルデータを構築しています。',
      usedSources: '使用している統計資料',
      openSourcePage: '出典ページを開く →',
      officialTitle: '正式名称:',
      publisher: '発行:',
      format: '形式:',
      coverage: '期間:',
      metric: '指標:',
      termsTitle: '用語の定義',
      notesTitle: '重要な注記',
      filesTitle: '公開データファイル',
      filesIntro: '本プロジェクトで構築した統合パネルデータは以下のCSVで公開予定です。',
      citation: '引用について',
      citationIntro: '本サイトのデータまたは可視化を引用する場合は、以下の形式を推奨します:',
      versionLabel: 'メタデータ版数: v{v} / 最終更新: {date}',
    },
    srcMethod: {
      census: '悉皆集計',
      survey: 'アンケート集計',
      surveyFrom2021: '2021年以降はアンケート集計',
    },
    yearSlider: {
      play: '▶',
      pause: '⏸',
    },
  },

  en: {
    site: {
      title: 'Geography of Sake',
      subtitle: 'Sake Production by Prefecture, 1963–2024',
      description: 'Long-term panel data (1963–2024) on sake (nihonshu) production by Japanese prefecture, interactively visualized. Integrated from official statistics.',
    },
    nav: {
      race: 'Race',
      map: 'Map',
      explore: 'Explore',
      shipment: 'Shipment',
      sources: 'Sources',
    },
    footer: {
      dataSources: 'Data sources:',
      sourcesList: 'NTA Statistics Yearbook (time-series Excel / e-Stat), Overview of Sake Manufacturing Industry, Overview of Liquor Manufacturing & Wholesale, Sake Production Report',
      seeDetails: 'See the',
      sourcesPage: 'Sources page',
      seeDetailsEnd: ' for details. All data are aggregated from public statistics.',
    },
    dataType: {
      production: 'Production',
      sales: 'Sales',
      productionLong: 'Production volume (20°-equiv., kL)',
      salesLong: 'Sales/consumption volume (kL)',
    },
    period: {
      production: '1997–2023',
      sales: '1963–2023',
    },
    race: {
      title: 'Sake Ranking by Prefecture',
      productionDesc: 'Production volume (20°-equiv., kL), 1997–2023. Producer-based.',
      salesDesc: 'Sales/consumption volume (kL), 1963–2023. Consumer-based.',
      productionNote: '1997–2006: old industry overview; 2007–: e-Stat',
    },
    map: {
      title: 'Sake Bubble Map by Prefecture',
      descProduction: 'Bubble size represents production volume',
      descSales: 'Bubble size represents sales/consumption volume',
      scaleLabel: 'Bubble scale:',
      scaleGlobal: 'Absolute (all-period fixed)',
      scaleYear: 'Absolute (per year)',
      scaleShare: 'Share (% of national)',
      scaleGlobalHint: 'Scaled to all-period max. Shows historical decline.',
      scaleYearHint: 'Scaled to each year\'s max. Movement may be weak.',
      scaleShareHint: 'Share of national total. Emphasizes share changes.',
      totalLabel: 'National total',
      totalLabelExcluded: 'National total (excl. {name})',
      salesNote: 'Sales volume tracks population distribution, so prefectural shares are very stable. Try "Share" mode or "Production" for more movement.',
      mapNote: 'Main map covers Honshu, Hokkaido, Shikoku and Kyushu only (Nansei and Ogasawara Islands are geographically excluded).',
      okinawaNote: 'Okinawa is shown in the upper-left inset (bubble size uses the same scale as the main map).',
      insetTitle: 'Okinawa (same bubble scale as main map)',
    },
    exclude: {
      productionLabel: 'Top 3 (Hyogo, Kyoto, Niigata)',
      salesLabel: 'Tokyo',
      productionHint: 'Makes medium-size prefectures (Akita, Yamagata, Fukushima, Nagano, etc.) easier to see',
      salesHint: 'Removes the dominant consumption center to reveal movement in other prefectures',
      suffix: '',
    },
    excludeSuffixBefore: 'Exclude ',
    year: '',
    unit: { kl: 'kL' },
    explore: {
      title: 'Interactive Explorer',
      intro: 'Select prefectures to compare trends. Use presets to test hypotheses.',
      salesBtn: 'Sales (1963–)',
      productionBtn: 'Production (2007–)',
      absolute: 'Absolute',
      share: 'Share',
      noPrefs: 'Select prefectures from the selector above',
      typeTitle: 'Sake type composition (BY {year}, 20°-equiv. kL)',
      presets: {
        hypo1: 'H1: Nada vs. Fushimi',
        hypo2: 'H2: Rise of Niigata',
        hypo3: 'H3: Rise of Tohoku',
        metro: 'Metro consumption',
        clear: 'Clear',
      },
      regionGroup: {
        tohoku: 'Tohoku',
        kanto: 'Kanto',
        chubu: 'Chubu',
        kinki: 'Kinki',
        others: 'Others',
      },
      selectedCount: '{n}/{max} selected',
    },
    shipment: {
      title: 'Shipment & Export Data',
      descShipment: 'Tax-declared shipment volumes by prefecture, broken down by destination (own / same bureau / other bureau)',
      descExport: 'Export volume, value, and export ratio by prefecture',
      tabShipment: 'Shipment',
      tabExport: 'Export',
      surveyNote: '* This year\'s data is survey-based (not a census)',
      yearLabel: 'Year:',
      cols: {
        rank: '#',
        prefecture: 'Prefecture',
        totalKl: 'Total (kL)',
        selfPrefKl: 'Own pref. (kL)',
        selfBureauKl: 'Own bureau (kL)',
        otherBureauKl: 'Other bureau (kL)',
        selfPrefPct: 'Own pref. %',
        businessCount: 'Businesses',
        domesticKl: 'Domestic (kL)',
        exportKl: 'Export vol. (kL)',
        exportMil: 'Export value (M JPY)',
        exportRatio: 'Export %',
      },
      shipmentLegend: 'Own pref. = within the same prefecture / Own bureau = to other prefectures in the same NTA regional bureau / Other bureau = to other regional bureaus',
    },
    sources: {
      title: 'Data Sources',
      intro: 'All data on this site are aggregated and processed from public statistics published by Japan\'s National Tax Agency (NTA). Five sources are combined to build this long-term panel.',
      usedSources: 'Statistical sources used',
      openSourcePage: 'Open source page →',
      officialTitle: 'Official title:',
      publisher: 'Publisher:',
      format: 'Format:',
      coverage: 'Coverage:',
      metric: 'Metric:',
      termsTitle: 'Terminology',
      notesTitle: 'Important notes',
      filesTitle: 'Data files',
      filesIntro: 'The integrated panel data built in this project will be released as CSVs:',
      citation: 'Citation',
      citationIntro: 'When citing data or visualizations from this site, the following format is recommended:',
      versionLabel: 'Metadata version: v{v} / Last updated: {date}',
    },
    srcMethod: {
      census: 'Census',
      survey: 'Survey',
      surveyFrom2021: 'Survey-based from 2021',
    },
    yearSlider: {
      play: '▶',
      pause: '⏸',
    },
  },
};

/* ---------------- 都道府県名マップ ---------------- */
export const PREFECTURE_EN = {
  北海道: 'Hokkaido',
  青森: 'Aomori',
  岩手: 'Iwate',
  宮城: 'Miyagi',
  秋田: 'Akita',
  山形: 'Yamagata',
  福島: 'Fukushima',
  茨城: 'Ibaraki',
  栃木: 'Tochigi',
  群馬: 'Gunma',
  埼玉: 'Saitama',
  千葉: 'Chiba',
  東京: 'Tokyo',
  神奈川: 'Kanagawa',
  新潟: 'Niigata',
  富山: 'Toyama',
  石川: 'Ishikawa',
  福井: 'Fukui',
  山梨: 'Yamanashi',
  長野: 'Nagano',
  岐阜: 'Gifu',
  静岡: 'Shizuoka',
  愛知: 'Aichi',
  三重: 'Mie',
  滋賀: 'Shiga',
  京都: 'Kyoto',
  大阪: 'Osaka',
  兵庫: 'Hyogo',
  奈良: 'Nara',
  和歌山: 'Wakayama',
  鳥取: 'Tottori',
  島根: 'Shimane',
  岡山: 'Okayama',
  広島: 'Hiroshima',
  山口: 'Yamaguchi',
  徳島: 'Tokushima',
  香川: 'Kagawa',
  愛媛: 'Ehime',
  高知: 'Kochi',
  福岡: 'Fukuoka',
  佐賀: 'Saga',
  長崎: 'Nagasaki',
  熊本: 'Kumamoto',
  大分: 'Oita',
  宮崎: 'Miyazaki',
  鹿児島: 'Kagoshima',
  沖縄: 'Okinawa',
};

export const REGION_EN = {
  北海道: 'Hokkaido',
  東北: 'Tohoku',
  関東: 'Kanto',
  中部: 'Chubu',
  近畿: 'Kinki',
  中国: 'Chugoku',
  四国: 'Shikoku',
  '九州・沖縄': 'Kyushu & Okinawa',
};

export const SAKE_TYPE_EN = {
  清酒全体: 'All Sake',
  純米酒: 'Junmai',
  純米吟醸酒: 'Junmai Ginjo',
  吟醸酒: 'Ginjo',
  本醸造酒: 'Honjozo',
  一般酒全体: 'General (Futsu-shu)',
  '一般酒（糖類等不使用）': 'General (no sugar)',
  '一般酒（糖類等使用）': 'General (with sugar)',
};

export function prefName(pref, lang) {
  if (lang === 'en') return PREFECTURE_EN[pref] || pref;
  return pref;
}

export function regionName(region, lang) {
  if (lang === 'en') return REGION_EN[region] || region;
  return region;
}

export function sakeTypeName(type, lang) {
  if (lang === 'en') return SAKE_TYPE_EN[type] || type;
  return type;
}

/**
 * キー参照ヘルパー（ネスト対応）
 * getByPath(obj, 'race.title') → obj.race.title
 */
export function getByPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

/**
 * プレースホルダ置換 {name} → 値
 */
export function interpolate(str, params) {
  if (!str || typeof str !== 'string') return str;
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? params[k] : `{${k}}`));
}
