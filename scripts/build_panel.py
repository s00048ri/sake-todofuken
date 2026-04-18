"""
パネルデータ統合スクリプト

複数ソースのデータを統合し、出典情報を明記した最終パネルデータを生成する。

## データソース（5種）

1. 販売（消費）数量: 国税庁時系列Excel 13.xlsx (1963-2023)
2. 製成数量 (旧): 国税庁「清酒製造業の概況」表17 (1997-2017)
3. 製成数量 (新): e-Stat 国税庁統計年報 表0802 (2007-2023)
4. 特定名称酒別: 国税庁「清酒の製造状況等について」参考7/参考2 (2020-2024BY)
5. 課税移出・輸出: 国税庁「酒類製造業及び酒類卸売業の概況」表20,25,27 (2019-2024)
"""

import json
from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
FINAL_DIR = BASE_DIR / "data" / "final"

PREFECTURES = [
    "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島",
    "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川",
    "新潟", "富山", "石川", "福井", "山梨", "長野",
    "岐阜", "静岡", "愛知", "三重",
    "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山",
    "鳥取", "島根", "岡山", "広島", "山口",
    "徳島", "香川", "愛媛", "高知",
    "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄",
]

REGIONS = {
    "北海道": "北海道",
    "青森": "東北", "岩手": "東北", "宮城": "東北",
    "秋田": "東北", "山形": "東北", "福島": "東北",
    "茨城": "関東", "栃木": "関東", "群馬": "関東",
    "埼玉": "関東", "千葉": "関東", "東京": "関東", "神奈川": "関東",
    "新潟": "中部", "富山": "中部", "石川": "中部", "福井": "中部",
    "山梨": "中部", "長野": "中部",
    "岐阜": "中部", "静岡": "中部", "愛知": "中部", "三重": "中部",
    "滋賀": "近畿", "京都": "近畿", "大阪": "近畿",
    "兵庫": "近畿", "奈良": "近畿", "和歌山": "近畿",
    "鳥取": "中国", "島根": "中国", "岡山": "中国",
    "広島": "中国", "山口": "中国",
    "徳島": "四国", "香川": "四国", "愛媛": "四国", "高知": "四国",
    "福岡": "九州・沖縄", "佐賀": "九州・沖縄", "長崎": "九州・沖縄",
    "熊本": "九州・沖縄", "大分": "九州・沖縄", "宮崎": "九州・沖縄",
    "鹿児島": "九州・沖縄", "沖縄": "九州・沖縄",
}


def add_ordering(df):
    """都道府県の北→南の順序を適用。"""
    df = df.copy()
    df["pref_order"] = df["prefecture"].map({p: i for i, p in enumerate(PREFECTURES)})
    df["region"] = df["prefecture"].map(REGIONS)
    return df


def build_main_panel():
    """メインパネルデータ: 販売数量 + 製成数量（複数ソース）+ 出典フラグ。"""
    print("=== メインパネルデータ構築 ===")

    # 販売（消費）数量 — 時系列Excel 13.xlsx
    df_sales = pd.read_csv(PROCESSED_DIR / "sales_by_pref.csv")
    df_sales = df_sales.drop_duplicates(subset=["year", "prefecture"], keep="first")
    df_sales["sales_source"] = "jikeiretsu_13"
    print(f"  販売数量: {len(df_sales)}レコード ({df_sales['year'].min()}-{df_sales['year'].max()}年)")

    # 製成数量(e-Stat)
    df_estat = pd.read_csv(PROCESSED_DIR / "production_by_pref_estat.csv")
    df_estat["production_source"] = "estat_nenpo"
    print(f"  製成数量(e-Stat): {len(df_estat)}件 ({df_estat['year'].min()}-{df_estat['year'].max()}年)")

    # 製成数量(旧概況)
    gaikyo_path = PROCESSED_DIR / "production_by_pref_gaikyo.csv"
    if gaikyo_path.exists():
        df_gaikyo = pd.read_csv(gaikyo_path)
        df_gaikyo["production_source"] = "gaikyo_old"
        print(f"  製成数量(旧概況): {len(df_gaikyo)}件 ({df_gaikyo['year'].min()}-{df_gaikyo['year'].max()}年)")
        # e-Stat優先で統合（重複時はe-Stat採用）
        df_prod = pd.concat([df_estat, df_gaikyo], ignore_index=True)
        df_prod = df_prod.drop_duplicates(subset=["year", "prefecture"], keep="first")
    else:
        df_prod = df_estat

    print(f"  製成数量(統合): {len(df_prod)}件 ({df_prod['year'].min():.0f}-{df_prod['year'].max():.0f}年)")

    # 統合
    df = df_sales.merge(df_prod, on=["year", "prefecture"], how="outer")

    df = add_ordering(df)
    df = df.sort_values(["year", "pref_order"]).drop(columns=["pref_order"])

    print(f"  統合後: {len(df)}レコード, {df['prefecture'].nunique()}都道府県")
    return df


def build_type_panel():
    """特定名称酒タイプ別パネルデータ。"""
    print("\n=== 特定名称酒タイプ別パネルデータ構築 ===")

    type_path = PROCESSED_DIR / "production_by_type_pref.csv"
    if not type_path.exists():
        return pd.DataFrame(), pd.DataFrame()

    df = pd.read_csv(type_path)
    df["source"] = "seizojokyo"
    df = add_ordering(df)
    df = df.sort_values(["year", "sake_type", "pref_order"]).drop(columns=["pref_order"])

    # 特定名称酒比率
    total = df[df["sake_type"] == "清酒全体"][["year", "prefecture", "production_20deg_kl"]].copy()
    total = total.rename(columns={"production_20deg_kl": "total_production"})
    general = df[df["sake_type"] == "一般酒全体"][["year", "prefecture", "production_20deg_kl"]].copy()
    general = general.rename(columns={"production_20deg_kl": "general_production"})

    ratio_df = total.merge(general, on=["year", "prefecture"], how="inner")
    ratio_df["tokumei_ratio"] = (
        (ratio_df["total_production"] - ratio_df["general_production"])
        / ratio_df["total_production"]
    ).clip(0, 1)
    ratio_df["source"] = "seizojokyo"

    print(f"  タイプ別: {len(df)}件, {df['sake_type'].nunique()}タイプ, {df['year'].nunique()}年度")
    return df, ratio_df


def build_shipment_panel():
    """新概況からの課税移出数量・輸出パネル。"""
    print("\n=== 新概況データ統合 ===")

    ship_path = PROCESSED_DIR / "shipment_by_pref.csv"
    biz_path = PROCESSED_DIR / "business_export_by_pref.csv"

    df_ship = pd.DataFrame()
    df_biz = pd.DataFrame()

    if ship_path.exists():
        df_ship = pd.read_csv(ship_path)
        df_ship = add_ordering(df_ship)
        df_ship = df_ship.sort_values(["year", "pref_order"]).drop(columns=["pref_order"])
        print(f"  課税移出数量: {len(df_ship)}件 ({df_ship['year'].min()}-{df_ship['year'].max()}年)")

    if biz_path.exists():
        df_biz = pd.read_csv(biz_path)
        df_biz = add_ordering(df_biz)
        df_biz = df_biz.sort_values(["year", "pref_order"]).drop(columns=["pref_order"])
        print(f"  事業者数・輸出: {len(df_biz)}件 ({df_biz['year'].min()}-{df_biz['year'].max()}年)")

    return df_ship, df_biz


def create_metadata():
    """データ辞書を作成する。全出典を明記。"""
    return {
        "project": "清酒都道府県別生産量 長期パネルデータ",
        "version": "0.2.0",
        "last_updated": "2026-04-18",
        "description": "日本の清酒（日本酒）の都道府県別生産量・販売量・特定名称酒別データの長期パネル",
        "license": "データ本体は各公的機関の利用規約に従う。本プロジェクトの集計・加工部分はパブリックドメイン（CC0）を目指す。",

        "sources": {
            "jikeiretsu_13": {
                "name": "国税庁統計年報 時系列データ 13.xlsx",
                "official_title": "酒類の課税状況 (13) 販売（消費）数量・都道府県別",
                "publisher": "国税庁",
                "url": "https://www.nta.go.jp/publication/statistics/kokuzeicho/jikeiretsu/xls/13.xlsx",
                "top_page": "https://www.nta.go.jp/publication/statistics/kokuzeicho/jikeiretsu/01.htm",
                "format": "Excel (.xlsx)",
                "coverage": "1963（昭和38）～2023（令和5）年度, 61年分",
                "metric": "販売（消費）数量（kL）— 消費地ベース",
                "notes": "北海道=札幌局計で代替、沖縄は一部年度欠損。1963年以降は悉皆集計。",
            },
            "estat_nenpo": {
                "name": "国税庁統計年報 表0802 (e-Stat掲載)",
                "official_title": "2 製成数量・販売（消費）数量 シート「3(3)都道府県別の製成数量」",
                "publisher": "国税庁 / 政府統計e-Stat",
                "url": "https://www.e-stat.go.jp/stat-search/files?toukei=00351010&tstat=000001043366",
                "format": "Excel (.xls/.xlsx)",
                "coverage": "2007（平成19）～2023（令和5）年度, 17年分",
                "metric": "製成数量（kL）— 生産地ベース（清酒列を抽出）",
                "notes": "2007-2010年は .xls 形式、2011年以降は .xlsx 形式。47都道府県網羅。統計年報の公開は確定に約2-3年かかる。",
            },
            "gaikyo_old": {
                "name": "国税庁「清酒製造業の概況」表17",
                "official_title": "製成数量・課税移出数量の推移 （都道府県別）",
                "publisher": "国税庁",
                "url": "https://www.nta.go.jp/taxes/sake/shiori-gaikyo/seishu/02.htm",
                "format": "PDF",
                "coverage": "1997（平成9）～2017（平成29）年度, 21年分",
                "metric": "製成数量 20度換算（kL）",
                "notes": "2018年度版（平成30年度）で打ち切り。各PDFは3-5年分の推移を掲載。悉皆調査。",
            },
            "gaikyo_new": {
                "name": "国税庁「酒類製造業及び酒類卸売業の概況」清酒製造業 表20/22/25/27",
                "official_title": "都道府県別の回答者数及び取引状況 / 都道府県別の清酒の課税移出数量",
                "publisher": "国税庁",
                "url": "https://www.nta.go.jp/taxes/sake/shiori-gaikyo/seizo_oroshiuri/",
                "format": "PDF",
                "coverage": "2019（令和元年データ）～2024（令和6年データ）, 6年分",
                "metric": "課税移出数量（kL）, 輸出数量（kL）, 輸出金額（百万円）等",
                "notes": "重要: 令和4年調査分（2021年データ）以降は【アンケート集計】に変更され悉皆調査ではない。旧概況・統計年報との直接比較には注意。年度により回答者数が変動し、値も変動しうる（例: 京都2021年は回答者数減の影響で値が低く出ている可能性）。",
            },
            "seizojokyo": {
                "name": "国税庁「清酒の製造状況等について」参考7/参考2",
                "official_title": "都道府県別 清酒製造状況（清酒全体・純米酒・純米吟醸酒・吟醸酒・本醸造酒・一般酒）",
                "publisher": "国税庁",
                "url": "https://www.nta.go.jp/taxes/sake/shiori-gaikyo/seizojokyo/07.htm",
                "format": "PDF",
                "coverage": "令和2酒造年度（2020BY）～令和6酒造年度（2024BY）, 5酒造年度分",
                "metric": "製成数量 20度換算（kL）, 製造場数, 精米歩合, 平均成分",
                "notes": "酒造年度は7月1日～翌年6月30日。特定名称酒（純米・純米吟醸・吟醸・本醸造・一般）のタイプ別クロス集計。2020BYのみ簡易版（参考2のみ）で他は詳細（参考7）。",
            },
        },

        "files": {
            "production_by_pref.csv": {
                "description": "都道府県×年度のメインパネル: 販売数量 + 製成数量 + 出典フラグ",
                "columns": {
                    "year": "西暦年度",
                    "prefecture": "都道府県名（北海道=札幌局計を含む）",
                    "sales_quantity_kl": "販売（消費）数量（kL）",
                    "sales_source": "販売数量の出典キー",
                    "production_quantity_kl": "製成数量（kL）",
                    "production_source": "製成数量の出典キー（estat_nenpo優先、gaikyo_oldで補完）",
                    "region": "地域ブロック",
                },
                "row_count_hint": "約2800件",
            },
            "production_by_pref_type.csv": {
                "description": "都道府県×酒造年度×特定名称酒タイプのパネル",
                "columns": {
                    "year": "酒造年度（開始年の西暦）",
                    "prefecture": "都道府県名",
                    "sake_type": "清酒全体/純米酒/純米吟醸酒/吟醸酒/本醸造酒/一般酒全体",
                    "production_20deg_kl": "製成数量 20度換算（kL）",
                    "brewery_count": "製造場数（参考7の場合のみ）",
                    "source": "出典キー = seizojokyo",
                    "region": "地域ブロック",
                },
            },
            "tokumei_ratio_by_pref.csv": {
                "description": "都道府県×酒造年度の特定名称酒比率（1 - 一般酒/清酒全体）",
                "columns": {
                    "year": "酒造年度（開始年の西暦）",
                    "prefecture": "都道府県名",
                    "total_production": "清酒全体の製成数量（20度換算kL）",
                    "general_production": "一般酒の製成数量（20度換算kL）",
                    "tokumei_ratio": "特定名称酒比率（0-1）",
                    "source": "出典キー = seizojokyo",
                },
            },
            "shipment_by_pref.csv": {
                "description": "都道府県×年度の課税移出数量（移出先別内訳付き）",
                "columns": {
                    "year": "西暦年度",
                    "prefecture": "都道府県名",
                    "respondent_count": "回答者数",
                    "self_pref_kl": "自県内への移出（kL）",
                    "self_bureau_kl": "自局（同一国税局管内他県）への移出（kL）",
                    "other_bureau_kl": "他局（他国税局管内）への移出（kL）",
                    "total_kl": "合計課税移出数量（kL）",
                    "self_pref_pct": "自県比率（%）",
                    "self_bureau_pct": "自局比率（%）",
                    "other_bureau_pct": "他局比率（%）",
                    "source": "出典（例: 新概況 r05 = 令和5年アンケート = 2022年データ）",
                    "region": "地域ブロック",
                },
                "caveat": "令和4年調査（2021年データ）以降はアンケート回答の集計であり、悉皆調査ではない",
            },
            "business_export_by_pref.csv": {
                "description": "都道府県×年度の事業者数・国内売上・輸出売上",
                "columns": {
                    "year": "西暦年度",
                    "prefecture": "都道府県名",
                    "business_count": "事業者数（回答者数）",
                    "domestic_volume_kl": "国内売上数量（kL）",
                    "domestic_amount_mil": "国内売上金額（百万円）",
                    "export_volume_kl": "輸出売上数量（kL）",
                    "export_amount_mil": "輸出売上金額（百万円）",
                    "export_ratio_volume_pct": "輸出割合（数量ベース, %）",
                    "export_ratio_amount_pct": "輸出割合（金額ベース, %）",
                    "source": "出典（例: 新概況 r05）",
                    "region": "地域ブロック",
                },
                "caveat": "令和4年調査以降はアンケート集計。全事業者の合計ではない。",
            },
        },

        "key_definitions": {
            "製成数量": "製造場で製成された数量。生産地ベースの指標。",
            "販売（消費）数量": "各都道府県の販売業者から消費者への販売量。消費地ベース。",
            "課税移出数量": "製造場から移出され課税対象となった数量。出荷ベース。",
            "20度換算": "アルコール分20度に換算した数量（特定名称酒データの統一単位）。",
            "酒造年度 (BY)": "7月1日～翌年6月30日（例: 令和6BY = 2024-07-01～2025-06-30）。",
            "年度（税務年度）": "4月1日～翌年3月31日（e-Stat統計年報が採用）。",
        },

        "important_notes": [
            "清酒製造数量の歴史的ピークは昭和48年（1973年）の約177万kL。",
            "特定名称酒制度は昭和63年（1988年）の清酒の製法品質表示基準告示で確立。",
            "令和4年（2021年）以降の「酒類製造業及び酒類卸売業の概況」はアンケート集計で、悉皆調査との断層がある。",
            "製成数量（生産地ベース）と販売数量（消費地ベース）は異なる指標で、目的に応じて使い分ける必要がある。",
            "1997年以前の都道府県別製成数量はウェブ上の公的データにはなく、国立国会図書館の国税庁統計年報紙版から取得する必要がある。",
        ],
    }


def main():
    FINAL_DIR.mkdir(parents=True, exist_ok=True)

    # メインパネル
    df_main = build_main_panel()
    df_main.to_csv(FINAL_DIR / "production_by_pref.csv", index=False, encoding="utf-8-sig")
    print(f"  → production_by_pref.csv")

    # 特定名称酒タイプ別
    df_type, df_ratio = build_type_panel()
    if len(df_type) > 0:
        df_type.to_csv(FINAL_DIR / "production_by_pref_type.csv", index=False, encoding="utf-8-sig")
        df_ratio.to_csv(FINAL_DIR / "tokumei_ratio_by_pref.csv", index=False, encoding="utf-8-sig")
        print(f"  → production_by_pref_type.csv")
        print(f"  → tokumei_ratio_by_pref.csv")

    # 新概況（課税移出・輸出）
    df_ship, df_biz = build_shipment_panel()
    if len(df_ship) > 0:
        df_ship.to_csv(FINAL_DIR / "shipment_by_pref.csv", index=False, encoding="utf-8-sig")
        print(f"  → shipment_by_pref.csv")
    if len(df_biz) > 0:
        df_biz.to_csv(FINAL_DIR / "business_export_by_pref.csv", index=False, encoding="utf-8-sig")
        print(f"  → business_export_by_pref.csv")

    # メタデータ
    metadata = create_metadata()
    (FINAL_DIR / "metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"  → metadata.json")

    # サマリー
    print("\n" + "=" * 60)
    print("データ構築完了")
    print("=" * 60)
    print(f"販売数量: {df_main['year'].min()}-{df_main['year'].max()}年, "
          f"{df_main[df_main['sales_quantity_kl'].notna()]['prefecture'].nunique()}都道府県")
    prod_valid = df_main[df_main['production_quantity_kl'].notna()]
    print(f"製成数量: {prod_valid['year'].min():.0f}-{prod_valid['year'].max():.0f}年, "
          f"{prod_valid['prefecture'].nunique()}都道府県")
    if len(df_ship) > 0:
        print(f"課税移出: {df_ship['year'].min()}-{df_ship['year'].max()}年 (新概況 — アンケート集計含む)")
    if len(df_biz) > 0:
        print(f"輸出: {df_biz['year'].min()}-{df_biz['year'].max()}年")


if __name__ == "__main__":
    main()
