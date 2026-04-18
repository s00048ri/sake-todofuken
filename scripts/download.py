"""
データダウンロードスクリプト

3つのデータソースからファイルを取得する:
1. 国税庁時系列Excel (13.xlsx) — 都道府県別販売数量パネル (1963-2023)
2. e-Stat統計年報 表0802 — 都道府県別製成数量 (年度別Excel)
3. 清酒の製造状況等について — 特定名称酒タイプ別×都道府県別 (PDF)
"""

import re
import time
from pathlib import Path

import requests

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (research project; sake production data collection)"
}


def download_file(url: str, dest: Path, skip_if_exists: bool = True) -> bool:
    """ファイルをダウンロードする。既存ファイルがあればスキップ。"""
    if skip_if_exists and dest.exists() and dest.stat().st_size > 1000:
        print(f"  スキップ（既存）: {dest.name}")
        return True

    print(f"  ダウンロード中: {url}")
    try:
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()

        # HTMLが返ってきた場合はPDFではないので失敗扱い
        content_type = resp.headers.get("Content-Type", "")
        if "text/html" in content_type and dest.suffix in (".pdf", ".xlsx", ".xls"):
            print(f"  ⚠ HTMLが返却された（ファイル不存在の可能性）: {dest.name}")
            return False

        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(resp.content)
        print(f"  ✓ 保存: {dest.name} ({len(resp.content):,} bytes)")
        return True
    except requests.RequestException as e:
        print(f"  ✗ エラー: {e}")
        return False


def download_jikeiretsu():
    """1. 国税庁時系列Excelファイル (都道府県別販売数量 1963-2023)"""
    print("\n=== 国税庁時系列Excel (13.xlsx) ===")
    url = "https://www.nta.go.jp/publication/statistics/kokuzeicho/jikeiretsu/xls/13.xlsx"
    dest = RAW_DIR / "nenpo" / "jikeiretsu_13.xlsx"
    download_file(url, dest)


def scrape_estat_file_ids():
    """e-Statのファイル一覧からstatInfIdを収集する。"""
    print("\n=== e-Stat statInfId 収集 ===")

    base_url = (
        "https://www.e-stat.go.jp/stat-search/files"
        "?page=1&toukei=00351010&tstat=000001043366"
        "&cycle=8&tclass1=000001043367&tclass2=000001043376"
        "&year={year_code}&layout=datalist&tclass3val=0"
    )

    file_ids = {}

    # 2007年度 ~ 2023年度
    for year in range(2007, 2024):
        year_code = f"{year}1"  # 例: 20231
        url = base_url.format(year_code=year_code)

        try:
            resp = requests.get(url, headers=HEADERS, timeout=30)
            resp.raise_for_status()
            html = resp.text

            # statInfIdを含むダウンロードリンクを探す
            # パターン: statInfId=000040289616
            matches = re.findall(r'statInfId=(\d+)', html)
            if matches:
                # 表0802（製成数量・販売数量）のIDを特定
                # 通常、各年度に4つのstatInfId（表0800-0803）がある
                # ファイル名やコンテキストから0802を特定する必要がある
                unique_ids = list(dict.fromkeys(matches))
                print(f"  {year}年度: {len(unique_ids)}件のID発見 → {unique_ids}")
                file_ids[year] = unique_ids
            else:
                print(f"  {year}年度: IDなし")

        except requests.RequestException as e:
            print(f"  {year}年度: エラー {e}")

        time.sleep(1)  # レート制限

    return file_ids


def download_estat_production(file_ids=None):
    """2. e-Stat統計年報 表0802 のExcelファイルをダウンロード。

    file_idsが指定されない場合、既知のIDを使用。
    """
    print("\n=== e-Stat 統計年報 表0802 (製成数量) ===")

    # 偵察で判明した既知のstatInfId（表0802のExcel）
    # これらはe-Statのファイル一覧ページからスクレイピングで取得済み
    known_ids = {
        2007: "000019296055",
        2008: "000009773894",
        2009: "000012665989",
        2010: "000014432622",
        2011: "000021995833",
        2012: "000025831780",
        2013: "000031322746",
        2014: "000031520532",
        2015: "000031591953",
        2016: "000031732868",
        2017: "000031923486",
        2018: "000031966434",
        2019: "000032101785",
        2020: "000032206755",
        2021: "000040061089",
        2022: "000040192441",
        2023: "000040289616",
    }

    for year, stat_inf_id in sorted(known_ids.items()):
        url = f"https://www.e-stat.go.jp/stat-search/file-download?statInfId={stat_inf_id}&fileKind=0"
        dest = RAW_DIR / "nenpo" / f"estat_{year}_0802.xlsx"
        download_file(url, dest)
        time.sleep(1)


def download_seizojokyo():
    """3. 清酒の製造状況等について (PDF)"""
    print("\n=== 清酒の製造状況等について (PDF) ===")

    base_url = "https://www.nta.go.jp/taxes/sake/shiori-gaikyo/seizojokyo/{year}/pdf/001.pdf"

    # 現在取得可能: 2020-2024
    for year in range(2020, 2025):
        url = base_url.format(year=year)
        dest = RAW_DIR / "seizojokyo" / f"seizojokyo_{year}.pdf"
        download_file(url, dest)
        time.sleep(1)


def download_shiori():
    """4. 酒のしおり (Excel) — 都道府県別販売数量等の補完データ"""
    print("\n=== 酒のしおり ===")
    print("  （未実装: インデックスページの構造確認後に実装予定）")


def main():
    print("=" * 60)
    print("清酒都道府県別データ ダウンロードスクリプト")
    print("=" * 60)

    # 1. 時系列Excel
    download_jikeiretsu()

    # 2. e-Stat製成数量（既知IDのみ）
    download_estat_production()

    # 3. 清酒製造状況PDF
    download_seizojokyo()

    # 4. 酒のしおり（未実装）
    download_shiori()

    print("\n" + "=" * 60)
    print("ダウンロード完了")
    print("=" * 60)


if __name__ == "__main__":
    main()
