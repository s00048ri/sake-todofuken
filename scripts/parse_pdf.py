"""
PDFパーサー

「清酒の製造状況等について」PDFから都道府県別×特定名称酒タイプ別の
製成数量（20度換算kL）を抽出する。

各PDFの参考7に以下のサブテーブルがある:
  イ: 清酒全体
  ロ: 純米酒
  ハ: 純米吟醸酒
  ニ: 吟醸酒
  ホ: 本醸造酒
  ヘ: 一般酒（糖類等不使用）
  ト: 一般酒（糖類等使用）
  チ: 一般酒全体
"""

import re
from pathlib import Path

import pandas as pd
import pdfplumber

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

# 抽出するタイプ（PDFのサブテーブル名との対応）
SAKE_TYPES = [
    "清酒全体",
    "純米酒",
    "純米吟醸酒",
    "吟醸酒",
    "本醸造酒",
    "一般酒全体",
]

# PDFページのヘッダテキストからタイプを判定
TYPE_PATTERNS = {
    "イ 清酒全体": "清酒全体",
    "イ　清酒全体": "清酒全体",
    "ロ 純米酒": "純米酒",
    "ロ　純米酒": "純米酒",
    "ハ 純米吟醸酒": "純米吟醸酒",
    "ハ　純米吟醸酒": "純米吟醸酒",
    "ニ 吟醸酒": "吟醸酒",
    "ニ　吟醸酒": "吟醸酒",
    "ホ 本醸造酒": "本醸造酒",
    "ホ　本醸造酒": "本醸造酒",
    "チ 一般酒全体": "一般酒全体",
    "チ　一般酒全体": "一般酒全体",
}


def parse_number(s):
    """カンマ付き数値文字列をfloatに変換。×や-はNone。"""
    if not s or s.strip() in ("", "×", "-", "X", "…"):
        return None
    s = s.strip().replace(",", "").replace("，", "")
    try:
        return float(s)
    except ValueError:
        return None


def normalize_pref_name_pdf(name):
    """PDFのテーブルから抽出した都道府県名を正規化する。"""
    if not name:
        return None
    # 改行で分割して最初の部分を使用（京都府\n伏見\nその他 → 京都府）
    name = name.split("\n")[0].strip()
    name = name.replace("\u3000", "").replace(" ", "")

    # 国税局・全国行は除外
    if "国税" in name or "全国" in name or name == "":
        return None

    # 特殊ケース
    if "宮崎" in name and "鹿児島" in name:
        return None  # 合算行は個別処理が必要

    # 都道府県名の正規化
    import sys
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from scripts.parse_excel import normalize_pref_name
    return normalize_pref_name(name)


def find_production_col(header_row):
    """ヘッダ行から製成数量（20度換算kL）の列インデックスを特定する。"""
    for i, cell in enumerate(header_row):
        if cell and "製成数量" in str(cell) and "20度" in str(cell):
            return i
    return None


def find_brewery_count_col(header_row):
    """ヘッダ行から製造場数の列インデックスを特定する。"""
    for i, cell in enumerate(header_row):
        if cell and "製造場数" in str(cell):
            return i
    return None


def extract_table_data(table, sake_type):
    """テーブルから都道府県別の製成数量と製造場数を抽出する。"""
    if not table or len(table) < 4:
        return []

    # ヘッダから列位置を特定
    prod_col = find_production_col(table[0])
    brewery_col = find_brewery_count_col(table[0])

    if prod_col is None:
        return []

    records = []
    for row in table[3:]:  # 3行目以降がデータ
        pref = normalize_pref_name_pdf(row[0])
        if not pref:
            continue

        production = parse_number(row[prod_col]) if prod_col < len(row) else None
        breweries = parse_number(row[brewery_col]) if brewery_col and brewery_col < len(row) else None

        records.append({
            "prefecture": pref,
            "sake_type": sake_type,
            "production_20deg_kl": production,
            "brewery_count": int(breweries) if breweries else None,
        })

    return records


def parse_seizojokyo_2020_format(pdf_path, year):
    """2020年形式のPDFをパースする。

    2020年版は参考7（タイプ別×都道府県別）がなく、
    参考2に3列構成の簡易テーブル（清酒全体/特定名称酒/吟醸系/純米系）がある。
    """
    pdf = pdfplumber.open(str(pdf_path))
    all_records = []

    for page_idx in range(len(pdf.pages)):
        page = pdf.pages[page_idx]
        text = page.extract_text()
        if not text or "都道府県別清酒製造数量" not in text:
            continue

        tables = page.extract_tables()
        if not tables:
            continue

        t = tables[0]
        # 3列構成: col 0-4, col 5-9, col 10-14
        # 各ブロック: [都道府県, 清酒全体, 特定名称酒, 吟醸系, 純米系]
        for row in t[1:]:  # ヘッダスキップ
            for block_start in (0, 5, 10):
                if block_start >= len(row) or not row[block_start]:
                    continue
                pref = normalize_pref_name_pdf(row[block_start])
                if not pref:
                    continue

                total = parse_number(row[block_start + 1]) if block_start + 1 < len(row) else None

                all_records.append({
                    "prefecture": pref,
                    "sake_type": "清酒全体",
                    "production_20deg_kl": total,
                    "brewery_count": None,
                    "year": year,
                })

        break  # 1ページだけ

    pdf.close()
    return all_records


def parse_seizojokyo_pdf(pdf_path, year):
    """1つのPDFから全タイプの都道府県別データを抽出する。"""
    print(f"  パース中: {pdf_path.name} ({year}酒造年度)")

    pdf = pdfplumber.open(str(pdf_path))
    all_records = []

    # まず参考7のタイプ別データを探す（2021年以降の形式）
    found_type_data = False
    for page_idx in range(len(pdf.pages)):
        page = pdf.pages[page_idx]
        text = page.extract_text()
        if not text:
            continue

        # テキストからタイプを判定
        detected_type = None
        for pattern, type_name in TYPE_PATTERNS.items():
            if pattern in text:
                detected_type = type_name
                break

        if not detected_type or detected_type not in SAKE_TYPES:
            continue

        found_type_data = True
        tables = page.extract_tables()
        for table in tables:
            records = extract_table_data(table, detected_type)
            for r in records:
                r["year"] = year
            all_records.extend(records)

    pdf.close()

    # 参考7が見つからなかった場合は2020年形式を試す
    if not found_type_data:
        all_records = parse_seizojokyo_2020_format(pdf_path, year)

    # 都道府県数をタイプ別に報告
    df = pd.DataFrame(all_records)
    if len(df) > 0:
        type_counts = df.groupby("sake_type")["prefecture"].nunique()
        for t, c in type_counts.items():
            print(f"    {t}: {c}都道府県")

    return all_records


def parse_all_seizojokyo():
    """全年度のPDFをパースして統合する。"""
    print("=== 清酒製造状況 PDFパース ===")

    seizojokyo_dir = RAW_DIR / "seizojokyo"
    all_records = []

    for pdf_path in sorted(seizojokyo_dir.glob("seizojokyo_*.pdf")):
        match = re.search(r"seizojokyo_(\d{4})", pdf_path.name)
        if not match:
            continue
        year = int(match.group(1))

        records = parse_seizojokyo_pdf(pdf_path, year)
        all_records.extend(records)

    df = pd.DataFrame(all_records)
    print(f"\n  合計: {len(df)}レコード")
    return df


def main():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    df = parse_all_seizojokyo()

    if len(df) > 0:
        out_path = PROCESSED_DIR / "production_by_type_pref.csv"
        df.to_csv(out_path, index=False, encoding="utf-8-sig")
        print(f"  → 保存: {out_path.name}")

        # サマリー
        print(f"\n=== サマリー ===")
        print(f"年度: {sorted(df['year'].unique())}")
        print(f"タイプ: {sorted(df['sake_type'].unique())}")
        print(f"都道府県数: {df['prefecture'].nunique()}")

        # スポットチェック
        print("\n--- スポットチェック (2023酒造年度, 清酒全体) ---")
        subset = df[(df["year"] == 2023) & (df["sake_type"] == "清酒全体")]
        top = subset.nlargest(10, "production_20deg_kl")
        for _, row in top.iterrows():
            print(f"  {row['prefecture']}: {row['production_20deg_kl']:.0f} kL "
                  f"({row['brewery_count']}蔵)")

        # 特定名称酒比率のスポットチェック
        print("\n--- 特定名称酒比率 (2023酒造年度) ---")
        for pref in ["兵庫", "新潟", "秋田", "山形"]:
            total = df[(df["year"] == 2023) & (df["sake_type"] == "清酒全体") &
                      (df["prefecture"] == pref)]["production_20deg_kl"].values
            general = df[(df["year"] == 2023) & (df["sake_type"] == "一般酒全体") &
                        (df["prefecture"] == pref)]["production_20deg_kl"].values
            if len(total) > 0 and len(general) > 0 and total[0] and general[0]:
                tokumeisho_ratio = 1 - general[0] / total[0]
                print(f"  {pref}: 特定名称酒比率 {tokumeisho_ratio:.1%}")


if __name__ == "__main__":
    main()
