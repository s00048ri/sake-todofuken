# 日本酒の地理学 — 都道府県別清酒生産量 長期パネルデータ

日本の清酒（日本酒）の都道府県別生産量の長期時系列パネルデータを構築し、インタラクティブに可視化するプロジェクトです。

**🌐 可視化サイト: [https://s00048ri.github.io/sake-todofuken/](https://s00048ri.github.io/sake-todofuken/)**

## 概要

既存の公開データセットでは都道府県別×年度別の清酒生産量パネルが存在しませんでした。本プロジェクトでは、5つの公的統計資料を統合し、以下のデータセットを構築しています:

- **販売（消費）数量**: 1963-2023年、46都道府県、61年分
- **製成数量（生産地ベース）**: 1997-2023年、47都道府県、27年分
- **特定名称酒タイプ別製成数量**: 2020-2024酒造年度、44都道府県、5年分
- **課税移出数量（移出先別内訳）**: 2019-2024年、47都道府県、6年分
- **輸出売上数量・金額**: 2019-2024年、47都道府県、6年分

## 検証したい仮説

1. **兵庫の一貫した首位**: 灘五郷を中心に、江戸時代の「下り酒」以来の圧倒的な生産基盤は維持されているか
2. **1980-90年代の新潟の台頭**: 淡麗辛口ブーム（越乃寒梅・八海山・久保田）との連動
3. **近年の東北の質的台頭**: 山形（十四代）、秋田（新政）、福島（飛露喜）などの品質路線を特定名称酒比率で検証

## 可視化機能

- **バーチャートレース** — 都道府県別ランキングの年度ごとのアニメーション
- **日本地図バブル** — 地理的な生産集中度の可視化
- **インタラクティブ探索** — 都道府県比較、シェア推移、特定名称酒構成比
- **出荷・輸出** — 課税移出数量・輸出売上の都道府県別ランキング
- **出典ページ** — 全データソースの詳細情報

## データソース

| 出典 | 指標 | 期間 |
|------|------|-----|
| 国税庁統計年報 時系列Excel | 販売（消費）数量 | 1963-2023 |
| 国税庁統計年報 表0802（e-Stat） | 製成数量 | 2007-2023 |
| 清酒製造業の概況 | 製成数量 | 1997-2017 |
| 酒類製造業及び酒類卸売業の概況 | 課税移出・輸出 | 2019-2024 |
| 清酒の製造状況等について | 特定名称酒タイプ別 | 2020-2024BY |

詳細は [`SOURCES.md`](./SOURCES.md) または [メタデータ](./data/final/metadata.json) を参照してください。

## プロジェクト構造

```
sake-todofuken/
├── CLAUDE.md              # プロジェクト設計書
├── SOURCES.md             # 詳細な出典一覧
├── README.md              # このファイル
├── data/
│   ├── raw/               # 元ファイル（公的機関のExcel/PDF）
│   │   ├── nenpo/         # 国税庁統計年報
│   │   ├── seizojokyo/    # 清酒の製造状況等について
│   │   └── other/
│   │       ├── gaikyo/    # 清酒製造業の概況（旧）
│   │       └── gaikyo_new/# 酒類製造業及び酒類卸売業の概況（新）
│   ├── processed/         # 中間パース結果
│   └── final/             # 統合パネルデータ（CSV + metadata.json）
├── scripts/
│   ├── download.py        # データダウンロード
│   ├── parse_excel.py     # Excel パーサー
│   ├── parse_pdf.py       # 清酒製造状況PDFパーサー
│   ├── parse_gaikyo.py    # 旧概況PDFパーサー
│   ├── parse_gaikyo_new.py# 新概況PDFパーサー
│   ├── build_panel.py     # 統合パネル構築
│   └── csv_to_json.py     # Web向けJSON変換
└── web/                   # React + Vite 可視化フロントエンド
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   └── data/          # ビルド時バンドルJSON
    └── public/            # 日本地図TopoJSON等
```

## 開発

### データパイプラインの実行

```bash
# ダウンロード（既存ファイルはスキップ）
python3 scripts/download.py

# 各パーサーを実行
PYTHONPATH=. python3 scripts/parse_excel.py
PYTHONPATH=. python3 scripts/parse_pdf.py
PYTHONPATH=. python3 scripts/parse_gaikyo.py
PYTHONPATH=. python3 scripts/parse_gaikyo_new.py

# パネル統合
PYTHONPATH=. python3 scripts/build_panel.py

# Web用JSON生成
python3 scripts/csv_to_json.py
```

### Webフロントエンドの実行

```bash
cd web
npm install
npm run dev       # 開発サーバー
npm run build     # 本番ビルド
```

## 技術スタック

- **データ処理**: Python 3, pandas, openpyxl, pdfplumber, xlrd
- **フロントエンド**: React 19, Vite, D3.js, Recharts, Tailwind CSS 4
- **地図**: TopoJSON (dataofjapan/land)
- **デプロイ**: GitHub Actions + GitHub Pages

## ライセンス

- **データ本体**: 各公的機関の利用規約に従う
  - [国税庁ウェブサイト利用規約](https://www.nta.go.jp/webtaiou/faq/policy/riyo.htm)
  - [e-Stat 利用規約](https://www.e-stat.go.jp/help/e-stat-terms)
- **本プロジェクトのコード・集計・可視化**: MIT License（[`LICENSE`](./LICENSE)）

## 引用

本プロジェクトを引用する場合は以下の形式を推奨します:

> 本データは以下の公的統計を統合・加工したものです:
> - 国税庁統計年報 時系列データ (1963-2023)
> - 国税庁統計年報 表0802 (e-Stat経由, 2007-2023)
> - 国税庁「清酒製造業の概況」(1997-2017)
> - 国税庁「酒類製造業及び酒類卸売業の概況」(2019-2024)
> - 国税庁「清酒の製造状況等について」(2020BY-2024BY)

## 謝辞

- 国税庁が長年にわたり公開している統計資料に基づいています。
- 日本地図TopoJSONは [dataofjapan/land](https://github.com/dataofjapan/land) を利用しています。
