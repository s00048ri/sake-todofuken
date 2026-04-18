"""
清酒製造業の概況 PDFパーサー

都道府県別の製成数量（20度換算kL）と課税移出数量（実数kL）の推移データを抽出する。
各PDFには3〜5年分のデータが含まれ、年度は平成表記。
"""

import re
import sys
from pathlib import Path

import pandas as pd
import pdfplumber

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw" / "other" / "gaikyo"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

sys.path.insert(0, str(BASE_DIR))
from scripts.parse_excel import normalize_pref_name


def parse_number(s):
    if not s:
        return None
    s = s.strip().replace(",", "").replace("，", "").replace("kl", "").replace("KL", "").strip()
    if s in ("", "-", "×", "…"):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def heisei_to_ad(h):
    """平成の年号を西暦に変換。"""
    return 1988 + h


def extract_pref_names(cell):
    """セル内の都道府県名を改行区切りで抽出し正規化する。"""
    if not cell:
        return []
    names = cell.replace("\u3000", " ").split("\n")
    result = []
    for name in names:
        name = name.strip().replace(" ", "")
        if not name:
            continue
        pref = normalize_pref_name(name)
        if pref:
            result.append(pref)
    return result


def extract_values(cell):
    """セル内の数値を改行区切りで抽出する。"""
    if not cell:
        return []
    lines = cell.split("\n")
    result = []
    for line in lines:
        line = line.strip()
        if line.lower() in ("kl", ""):
            continue
        result.append(parse_number(line))
    return result


def parse_gaikyo_pdf(pdf_path):
    """1つの概況PDFから都道府県別製成数量データを抽出する。"""
    pdf = pdfplumber.open(str(pdf_path))
    all_records = []
    last_production_years = None
    last_production_cols = None

    for page in pdf.pages:
        tables = page.extract_tables()
        if not tables:
            continue

        for table in tables:
            if len(table) < 2:
                continue

            # 年度ヘッダを探す
            production_years = None
            production_cols = None
            data_start_row = 0

            for header_candidate_row in range(min(3, len(table))):
                header_row = table[header_candidate_row]
                if not header_row:
                    continue

                years = []
                prod_cols = []
                for col_idx, val in enumerate(header_row):
                    if val is None or col_idx < 2:
                        continue
                    try:
                        year_num = int(str(val).strip())
                        ad_year = heisei_to_ad(year_num)
                        if 1990 <= ad_year <= 2025:
                            years.append(ad_year)
                            prod_cols.append(col_idx)
                    except (ValueError, AttributeError):
                        continue

                if years:
                    unique_years = []
                    seen = set()
                    for y in years:
                        if y not in seen:
                            unique_years.append(y)
                            seen.add(y)
                    n_unique = len(unique_years)
                    production_years = unique_years
                    production_cols = prod_cols[:n_unique]
                    last_production_years = production_years
                    last_production_cols = production_cols
                    data_start_row = header_candidate_row + 1
                    break

            # ヘッダが見つからない場合は前のページのヘッダを再利用
            if not production_years and last_production_years:
                production_years = last_production_years
                production_cols = last_production_cols
                data_start_row = 0

            if not production_years:
                continue

            # データ行を処理
            for row in table[data_start_row:]:
                if not row or len(row) < 3:
                    continue

                # 都道府県名（col 0 or col 1）
                pref_names = extract_pref_names(row[1])
                if not pref_names and len(row) > 0:
                    pref_names = extract_pref_names(row[0])
                if not pref_names:
                    continue

                # 各年度の製成数量を抽出
                for yi, (year, col_idx) in enumerate(zip(production_years, production_cols)):
                    if col_idx >= len(row):
                        continue
                    values = extract_values(row[col_idx])

                    for pi, pref in enumerate(pref_names):
                        val = values[pi] if pi < len(values) else None
                        if val is not None:
                            all_records.append({
                                "year": year,
                                "prefecture": pref,
                                "production_quantity_kl": val,
                            })

    pdf.close()
    return all_records


def main():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    print("=== 清酒製造業の概況 PDFパース ===")

    all_records = []
    for pdf_path in sorted(RAW_DIR.glob("gaikyo_*.pdf")):
        print(f"  {pdf_path.name}", end="")
        records = parse_gaikyo_pdf(pdf_path)
        print(f" → {len(records)}レコード")
        all_records.extend(records)

    if not all_records:
        print("  データなし")
        return

    df = pd.DataFrame(all_records)

    # 重複除去（同じ年度×都道府県が複数PDFに含まれる場合、最初のものを採用）
    df = df.drop_duplicates(subset=["year", "prefecture"], keep="first")
    df = df.sort_values(["year", "prefecture"])

    out_path = PROCESSED_DIR / "production_by_pref_gaikyo.csv"
    df.to_csv(out_path, index=False, encoding="utf-8-sig")
    print(f"\n  → 保存: {out_path.name}")

    print(f"\n=== サマリー ===")
    print(f"年度: {sorted(df['year'].unique())}")
    print(f"都道府県数: {df['prefecture'].nunique()}")
    print(f"合計レコード数: {len(df)}")

    # 兵庫・新潟のスポットチェック
    print("\n--- 兵庫 製成数量(20度換算) ---")
    hyogo = df[df["prefecture"] == "兵庫"].sort_values("year")
    for _, row in hyogo.iterrows():
        print(f"  {int(row['year'])}: {row['production_quantity_kl']:.0f} kL")

    print("\n--- 新潟 製成数量(20度換算) ---")
    niigata = df[df["prefecture"] == "新潟"].sort_values("year")
    for _, row in niigata.iterrows():
        print(f"  {int(row['year'])}: {row['production_quantity_kl']:.0f} kL")


if __name__ == "__main__":
    main()
