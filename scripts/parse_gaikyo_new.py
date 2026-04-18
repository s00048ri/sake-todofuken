"""
新概況（酒類製造業及び酒類卸売業の概況）PDFパーサー

令和2年調査（2019年データ）〜令和7年アンケート（2024年データ）の都道府県別データを抽出する:
- 都道府県別の事業者数・国内売上数量・輸出売上数量（表20 or 表22）
- 都道府県別の課税移出数量（自県・自局・他局別内訳）（表25 or 表27）

注意:
- 令和4年調査以降はアンケート集計（悉皆調査ではない）
- 旧概況・統計年報との直接比較には注意が必要
"""

import logging
import re
import sys
import warnings
from pathlib import Path

import pandas as pd
import pdfplumber

# pdfminerの警告を抑制
logging.getLogger("pdfminer").setLevel(logging.ERROR)
warnings.filterwarnings("ignore")

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw" / "other" / "gaikyo_new"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

sys.path.insert(0, str(BASE_DIR))
from scripts.parse_excel import normalize_pref_name

# 令和年号 → 調査対象年（西暦）
# 令和N年の調査は、令和(N-1)年暦年のデータを集計
REIWA_TO_DATA_YEAR = {
    2: 2019,  # 令和2年調査分 → 2019年データ
    3: 2020,
    4: 2021,
    5: 2022,
    6: 2023,
    7: 2024,
}

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


def parse_number(s):
    """カンマ付き数値文字列をfloatに変換。×やXや-はNone。パーセント記号は除去。"""
    if not s:
        return None
    s = str(s).strip().replace(",", "").replace("，", "").rstrip("%").rstrip("％")
    if s in ("", "-", "×", "X", "x", "…", "－"):
        return None
    try:
        return float(s)
    except ValueError:
        return None


# 税務署局名リスト（先頭に現れうる）
TAX_BUREAUS = ["札幌", "仙台", "関東信越", "東京", "金沢", "名古屋", "大阪", "広島", "高松", "福岡", "熊本", "沖縄"]


def extract_pref_from_line(line):
    """行から都道府県名と後続の数値部分を抽出する。

    パターン:
    - '札 幌 北 海 道 14 3,143 ...'       (局名+県名+数値)
    - '青 森 13 3,446 ...'                (県名のみ+数値)
    - '大 阪 兵 庫 55 20,792 ...'         (局名「大阪」+県名「兵庫」+数値)
    - '大 阪 15 635 ...'                  (県名「大阪」+数値 — 局名なし or 局名が省略)

    方針:
    - 行全体からスペースを除去
    - 先頭から局名（必要なら）をスキップ
    - 次に都道府県名を特定
    - その後が数値で始まる場合のみ有効とみなす
    - 都道府県名候補が複数ある場合（大阪府/大阪国税局）は、後ろに数値が続くものを選ぶ
    """
    s = line.strip()
    if not s:
        return None, None

    # 全スペース除去版と元文字列のマッピングを作成
    no_space_chars = []
    orig_positions = []
    for i, ch in enumerate(s):
        if not re.match(r"[\s\u3000]", ch):
            no_space_chars.append(ch)
            orig_positions.append(i)
    no_space = "".join(no_space_chars)

    # 先頭の局名をスキップした位置を求める
    # 行頭または局名の直後から都道府県名を探す
    start_offsets = [0]
    for bureau in sorted(TAX_BUREAUS, key=len, reverse=True):
        if no_space.startswith(bureau):
            start_offsets.append(len(bureau))

    # 各都道府県を、開始位置（スキップあり・なし）両方で試す
    # 「数値が続く」制約で正しい都道府県を特定
    best_match = None
    best_start = None

    for start in start_offsets:
        for pref in PREFECTURES:
            for ending in ["県", "府", "都", ""]:
                target = pref + ending
                if no_space[start:start + len(target)] == target:
                    # 都道府県名の終端位置を元文字列にマップ
                    end_no_space = start + len(target)
                    if end_no_space > len(orig_positions):
                        continue
                    if end_no_space == len(orig_positions):
                        end_orig = len(s)
                    else:
                        end_orig = orig_positions[end_no_space]
                    rest = s[end_orig:].strip()
                    # 後続が数値で始まることを要求
                    if re.match(r"[\d,\-\.×Xx－]", rest):
                        # より後ろ（数値直前）の都道府県を優先（局名込みの方が正確）
                        if best_start is None or start > best_start:
                            best_match = (pref, rest)
                            best_start = start

    if best_match:
        return best_match
    return None, None


def extract_numbers(rest):
    """残り文字列から空白区切りの数値を抽出する。"""
    # '14 3,143 4,165 181 261 5.4 5.9' などをパース
    tokens = rest.split()
    return [parse_number(t) for t in tokens]


def parse_prefecture_table(text, expected_num_cols, table_label=""):
    """テキストから都道府県×数値の行をパースする。

    Args:
        text: PDFから抽出したテキスト
        expected_num_cols: 期待する数値列数（都道府県名以降）
        table_label: ログ用のテーブル名

    Returns:
        list of dicts: [{"prefecture": "北海道", "values": [...]}]
    """
    records = []
    found_prefs = set()

    lines = text.split("\n")
    for line in lines:
        pref, rest = extract_pref_from_line(line)
        if not pref or pref in found_prefs:
            continue

        values = extract_numbers(rest)
        if len(values) < 2:
            continue

        # 期待列数にトリム
        values = values[:expected_num_cols]

        records.append({
            "prefecture": pref,
            "values": values,
        })
        found_prefs.add(pref)

    return records


def parse_table_20_22(pdf_path, page_idx):
    """表20/22: 都道府県別の回答者数及び取引状況をパース。

    列: 事業者数, 国内売上数量(kL), 国内売上金額(百万円), 輸出売上数量(kL), 輸出売上金額(百万円), 輸出割合数量(%), 輸出割合金額(%)
    """
    pdf = pdfplumber.open(str(pdf_path))
    page = pdf.pages[page_idx]
    text = page.extract_text()
    pdf.close()

    if not text:
        return []

    # 7列期待
    records = parse_prefecture_table(text, 7, "表20/22")
    result = []
    for r in records:
        vals = r["values"] + [None] * (7 - len(r["values"]))
        result.append({
            "prefecture": r["prefecture"],
            "business_count": int(vals[0]) if vals[0] is not None else None,
            "domestic_volume_kl": vals[1],
            "domestic_amount_mil": vals[2],
            "export_volume_kl": vals[3],
            "export_amount_mil": vals[4],
            "export_ratio_volume_pct": vals[5],
            "export_ratio_amount_pct": vals[6],
        })
    return result


def parse_table_25_27(pdf_path, page_idx):
    """表25/27: 都道府県別の清酒の課税移出数量をパース。

    列: 回答者数, 自県(kL), 自局(kL), 他局(kL), 合計(kL), 自県%, 自局%, 他局%
    """
    pdf = pdfplumber.open(str(pdf_path))
    page = pdf.pages[page_idx]
    text = page.extract_text()
    pdf.close()

    if not text:
        return []

    # 8列期待
    records = parse_prefecture_table(text, 8, "表25/27")
    result = []
    for r in records:
        vals = r["values"] + [None] * (8 - len(r["values"]))
        result.append({
            "prefecture": r["prefecture"],
            "respondent_count": int(vals[0]) if vals[0] is not None else None,
            "self_pref_kl": vals[1],
            "self_bureau_kl": vals[2],
            "other_bureau_kl": vals[3],
            "total_kl": vals[4],
            "self_pref_pct": vals[5],
            "self_bureau_pct": vals[6],
            "other_bureau_pct": vals[7],
        })
    return result


# 各PDFで表20/22と表25/27が何ページ目にあるか
# 偵察結果: r02/r03 は表22がp2, 表27がp6
#          r04以降は表20がp1, 表25(r04)または表27(r05-r07)がp4 or p5
PDF_TABLE_LOCATIONS = {
    "r02": {"businesses": 1, "shipment": 5},  # 0-indexed
    "r03": {"businesses": 1, "shipment": 5},
    "r04": {"businesses": 0, "shipment": 3},
    "r05": {"businesses": 0, "shipment": 4},
    "r06": {"businesses": 0, "shipment": 4},
    "r07": {"businesses": 0, "shipment": 4},
}


def parse_all():
    """全年度をパースしてCSV出力。"""
    print("=== 新概況（酒類製造業及び酒類卸売業の概況）パース ===")

    all_businesses = []
    all_shipments = []

    for pdf_path in sorted(RAW_DIR.glob("r*_seishu.pdf")):
        # r07 などのキーを抽出
        match = re.match(r"(r\d+)_seishu", pdf_path.stem)
        if not match:
            continue
        key = match.group(1)
        reiwa_num = int(key[1:])
        data_year = REIWA_TO_DATA_YEAR.get(reiwa_num)
        if data_year is None:
            continue

        loc = PDF_TABLE_LOCATIONS.get(key)
        if not loc:
            print(f"  ⚠ {key}: ページ位置不明")
            continue

        print(f"  {key} ({data_year}年データ): ", end="")

        # 表20/22: 事業者数・取引状況
        biz_records = parse_table_20_22(pdf_path, loc["businesses"])
        for r in biz_records:
            r["year"] = data_year
            r["source"] = f"新概況 {key}"
        all_businesses.extend(biz_records)

        # 表25/27: 課税移出数量
        ship_records = parse_table_25_27(pdf_path, loc["shipment"])
        for r in ship_records:
            r["year"] = data_year
            r["source"] = f"新概況 {key}"
        all_shipments.extend(ship_records)

        print(f"事業者{len(biz_records)}件, 移出{len(ship_records)}件")

    # 保存
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    if all_businesses:
        df_biz = pd.DataFrame(all_businesses)
        df_biz = df_biz[[
            "year", "prefecture", "business_count",
            "domestic_volume_kl", "domestic_amount_mil",
            "export_volume_kl", "export_amount_mil",
            "export_ratio_volume_pct", "export_ratio_amount_pct",
            "source",
        ]]
        path = PROCESSED_DIR / "business_export_by_pref.csv"
        df_biz.to_csv(path, index=False, encoding="utf-8-sig")
        print(f"\n  → {path.name} ({len(df_biz)}件)")

    if all_shipments:
        df_ship = pd.DataFrame(all_shipments)
        df_ship = df_ship[[
            "year", "prefecture", "respondent_count",
            "self_pref_kl", "self_bureau_kl", "other_bureau_kl", "total_kl",
            "self_pref_pct", "self_bureau_pct", "other_bureau_pct",
            "source",
        ]]
        path = PROCESSED_DIR / "shipment_by_pref.csv"
        df_ship.to_csv(path, index=False, encoding="utf-8-sig")
        print(f"  → {path.name} ({len(df_ship)}件)")

    # サマリー
    if all_shipments:
        print("\n=== サマリー ===")
        df = pd.DataFrame(all_shipments)
        print(f"年度: {sorted(df['year'].unique())}")
        print(f"都道府県数: {df['prefecture'].nunique()}")

        # 兵庫・新潟の推移
        for pref in ["兵庫", "京都", "新潟", "秋田"]:
            subset = df[df["prefecture"] == pref].sort_values("year")
            if len(subset) > 0:
                print(f"\n{pref} 課税移出数量合計:")
                for _, row in subset.iterrows():
                    t = row["total_kl"]
                    sp = row["self_pref_pct"]
                    t_str = f"{t:>8,.0f} kL" if t is not None else "N/A"
                    sp_str = f"自県{sp:>4.1f}%" if sp is not None else "N/A"
                    print(f"  {int(row['year'])}: {t_str}  {sp_str}")


if __name__ == "__main__":
    parse_all()
