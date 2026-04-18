"""CSV→JSON変換スクリプト: web/src/data/ にバーチャートレース用JSONを生成する"""

import json
from pathlib import Path

import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
FINAL_DIR = BASE_DIR / "data" / "final"
DATA_OUT = BASE_DIR / "web" / "src" / "data"

REGION_COLORS = {
    "北海道": "#3b82f6",
    "東北": "#f97316",
    "関東": "#22c55e",
    "中部": "#ef4444",
    "近畿": "#a855f7",
    "中国": "#a16207",
    "四国": "#ec4899",
    "九州・沖縄": "#6b7280",
}

PREFECTURES_ORDER = [
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


def build_sales_json():
    """販売数量パネルデータをバーチャートレース最適化JSONに変換。"""
    df = pd.read_csv(FINAL_DIR / "production_by_pref.csv")

    years = sorted(df["year"].unique())
    sales_by_year = {}
    production_by_year = {}

    for year in years:
        yr = df[df["year"] == year]

        # 販売数量
        sales_rows = yr[yr["sales_quantity_kl"].notna()].copy()
        sales_rows = sales_rows.sort_values("sales_quantity_kl", ascending=False)
        sales_by_year[str(int(year))] = [
            {"pref": row["prefecture"], "value": row["sales_quantity_kl"]}
            for _, row in sales_rows.iterrows()
        ]

        # 製成数量
        prod_rows = yr[yr["production_quantity_kl"].notna()].copy()
        if len(prod_rows) > 0:
            prod_rows = prod_rows.sort_values("production_quantity_kl", ascending=False)
            production_by_year[str(int(year))] = [
                {"pref": row["prefecture"], "value": row["production_quantity_kl"]}
                for _, row in prod_rows.iterrows()
            ]

    result = {
        "years": [int(y) for y in years],
        "prefectures": PREFECTURES_ORDER,
        "regions": REGIONS,
        "regionColors": REGION_COLORS,
        "salesByYear": sales_by_year,
        "productionByYear": production_by_year,
    }

    out_path = DATA_OUT / "salesByPref.json"
    out_path.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    print(f"  → {out_path.name} ({len(years)}年, {len(sales_by_year)}年販売, {len(production_by_year)}年製成)")


def build_type_json():
    """特定名称酒タイプ別データをJSON変換。"""
    df = pd.read_csv(FINAL_DIR / "production_by_pref_type.csv")

    result = {}
    for year in sorted(df["year"].unique()):
        yr = df[df["year"] == year]
        year_data = {}
        for sake_type in yr["sake_type"].unique():
            type_rows = yr[yr["sake_type"] == sake_type].sort_values("production_20deg_kl", ascending=False)
            year_data[sake_type] = [
                {
                    "pref": row["prefecture"],
                    "value": row["production_20deg_kl"] if pd.notna(row["production_20deg_kl"]) else None,
                    "breweries": int(row["brewery_count"]) if pd.notna(row.get("brewery_count")) else None,
                }
                for _, row in type_rows.iterrows()
            ]
        result[str(int(year))] = year_data

    out_path = DATA_OUT / "productionByType.json"
    out_path.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    print(f"  → {out_path.name} ({len(result)}年)")


def build_ratio_json():
    """特定名称酒比率をJSON変換。"""
    df = pd.read_csv(FINAL_DIR / "tokumei_ratio_by_pref.csv")

    result = {}
    for year in sorted(df["year"].unique()):
        yr = df[df["year"] == year].sort_values("tokumei_ratio", ascending=False)
        result[str(int(year))] = [
            {"pref": row["prefecture"], "ratio": round(row["tokumei_ratio"], 4)}
            for _, row in yr.iterrows()
        ]

    out_path = DATA_OUT / "tokumeiRatio.json"
    out_path.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    print(f"  → {out_path.name} ({len(result)}年)")


def build_shipment_json():
    """新概況の課税移出数量と輸出データをJSON変換。"""
    ship_path = FINAL_DIR / "shipment_by_pref.csv"
    biz_path = FINAL_DIR / "business_export_by_pref.csv"

    if not ship_path.exists():
        print("  → shipment_by_pref.csv なし (スキップ)")
        return

    df_ship = pd.read_csv(ship_path)
    df_biz = pd.read_csv(biz_path) if biz_path.exists() else None

    result = {}
    for year in sorted(df_ship["year"].unique()):
        year_str = str(int(year))
        ship_rows = df_ship[df_ship["year"] == year].sort_values("total_kl", ascending=False)
        shipments = [
            {
                "pref": row["prefecture"],
                "total": row["total_kl"] if pd.notna(row["total_kl"]) else None,
                "selfPref": row["self_pref_kl"] if pd.notna(row["self_pref_kl"]) else None,
                "selfBureau": row["self_bureau_kl"] if pd.notna(row["self_bureau_kl"]) else None,
                "otherBureau": row["other_bureau_kl"] if pd.notna(row["other_bureau_kl"]) else None,
                "selfPrefPct": row["self_pref_pct"] if pd.notna(row["self_pref_pct"]) else None,
            }
            for _, row in ship_rows.iterrows()
        ]

        exports = []
        if df_biz is not None:
            biz_rows = df_biz[df_biz["year"] == year].sort_values("export_volume_kl", ascending=False)
            exports = [
                {
                    "pref": row["prefecture"],
                    "businessCount": int(row["business_count"]) if pd.notna(row["business_count"]) else None,
                    "domesticVolume": row["domestic_volume_kl"] if pd.notna(row["domestic_volume_kl"]) else None,
                    "exportVolume": row["export_volume_kl"] if pd.notna(row["export_volume_kl"]) else None,
                    "exportAmount": row["export_amount_mil"] if pd.notna(row["export_amount_mil"]) else None,
                    "exportRatio": row["export_ratio_volume_pct"] if pd.notna(row["export_ratio_volume_pct"]) else None,
                }
                for _, row in biz_rows.iterrows()
            ]

        # 調査方法フラグ
        is_survey = int(year) >= 2021
        result[year_str] = {
            "shipments": shipments,
            "exports": exports,
            "isSurvey": is_survey,  # 令和4年以降はアンケート集計
        }

    out_path = DATA_OUT / "shipment.json"
    out_path.write_text(json.dumps(result, ensure_ascii=False), encoding="utf-8")
    print(f"  → {out_path.name} ({len(result)}年)")


def build_metadata_json():
    """メタデータを Web から参照可能な形でコピー。"""
    src = FINAL_DIR / "metadata.json"
    if not src.exists():
        return
    dst = DATA_OUT / "metadata.json"
    dst.write_text(src.read_text(encoding="utf-8"), encoding="utf-8")
    print(f"  → {dst.name}")


def main():
    DATA_OUT.mkdir(parents=True, exist_ok=True)
    print("=== CSV→JSON変換 ===")
    build_sales_json()
    build_type_json()
    build_ratio_json()
    build_shipment_json()
    build_metadata_json()
    print("完了")


if __name__ == "__main__":
    main()
