#!/usr/bin/env python3
"""
대한성서공회(bskorea.or.kr)에서 성경 구절 텍스트를 크롤링하는 스크립트.
bible_verses_tts 폴더의 파일명을 파싱해서 해당 구절을 가져옵니다.
"""
import json
import os
import re
import time
import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.bskorea.or.kr/bible/korbibReadpage.php"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

# 한글 성경 책 이름 → bskorea URL book code
BOOK_MAP = {
    "창세기": "gen",
    "출애굽기": "exo",
    "레위기": "lev",
    "민수기": "num",
    "신명기": "deu",
    "여호수아": "jos",
    "사사기": "jdg",
    "룻기": "rut",
    "사무엘상": "1sa",
    "사무엘하": "2sa",
    "열왕기상": "1ki",
    "열왕기하": "2ki",
    "역대상": "1ch",
    "역대하": "2ch",
    "에스라": "ezr",
    "느헤미야": "neh",
    "에스더": "est",
    "욥기": "job",
    "시편": "psa",
    "잠언": "pro",
    "전도서": "ecc",
    "아가": "sng",
    "이사야": "isa",
    "예레미야": "jer",
    "예레미야애가": "lam",
    "에스겔": "ezk",
    "다니엘": "dan",
    "호세아": "hos",
    "요엘": "jol",
    "아모스": "amo",
    "오바댜": "oba",
    "요나": "jon",
    "미가": "mic",
    "나훔": "nam",
    "하박국": "hab",
    "스바냐": "zep",
    "학개": "hag",
    "스가랴": "zec",
    "말라기": "mal",
    "마태복음": "mat",
    "마가복음": "mrk",
    "누가복음": "luk",
    "요한복음": "jhn",
    "사도행전": "act",
    "로마서": "rom",
    "고린도전서": "1co",
    "고린도후서": "2co",
    "갈라디아서": "gal",
    "에베소서": "eph",
    "빌립보서": "php",
    "골로새서": "col",
    "데살로니가전서": "1th",
    "데살로니가후서": "2th",
    "디모데전서": "1ti",
    "디모데후서": "2ti",
    "디도서": "tit",
    "빌레몬서": "phm",
    "히브리서": "heb",
    "야고보서": "jas",
    "베드로전서": "1pe",
    "베드로후서": "2pe",
    "요한일서": "1jn",
    "요한이서": "2jn",
    "요한삼서": "3jn",
    "유다서": "jud",
    "요한계시록": "rev",
}


def parse_filename(filename):
    """
    파일명을 파싱하여 성경 구절 정보를 반환.
    예: '01_로마서_10_9_10.mp3' → {'book': '로마서', 'chapter': 10, 'start_verse': 9, 'end_verse': 10}
        '06_시편_119_105.mp3' → {'book': '시편', 'chapter': 119, 'start_verse': 105, 'end_verse': 105}
        '15_로마서_11_36a.mp3' → {'book': '로마서', 'chapter': 11, 'start_verse': 36, 'end_verse': 36, 'suffix': 'a'}
    """
    name = os.path.splitext(filename)[0]  # 확장자 제거

    # 앞의 번호 제거: '01_로마서_10_9_10' → '로마서_10_9_10'
    name = re.sub(r"^\d+_", "", name)

    # 한글 책 이름과 숫자 부분 분리
    # 예레미야애가 같이 한글만으로 된 책 이름을 매칭
    match = re.match(r"^([가-힣]+)_(.+)$", name)
    if not match:
        return None

    book_name = match.group(1)
    rest = match.group(2)

    # 숫자 파트 파싱 (suffix 포함 가능: 36a, 3b 등)
    parts = rest.split("_")

    if len(parts) == 2:
        # chapter_verse (예: 119_105, 11_36a)
        chapter = int(parts[0])
        verse_str = parts[1]
        suffix_match = re.match(r"^(\d+)([a-z]?)$", verse_str)
        if suffix_match:
            start_verse = int(suffix_match.group(1))
            suffix = suffix_match.group(2) or None
        else:
            return None
        end_verse = start_verse
    elif len(parts) == 3:
        # chapter_start_end (예: 10_9_10, 1_1_2)
        chapter = int(parts[0])
        # start_verse 에도 suffix 가능
        sv_match = re.match(r"^(\d+)([a-z]?)$", parts[1])
        ev_match = re.match(r"^(\d+)([a-z]?)$", parts[2])
        if sv_match and ev_match:
            start_verse = int(sv_match.group(1))
            end_verse = int(ev_match.group(1))
            suffix = sv_match.group(2) or ev_match.group(2) or None
        else:
            return None
    else:
        return None

    return {
        "book": book_name,
        "chapter": chapter,
        "start_verse": start_verse,
        "end_verse": end_verse,
        "suffix": suffix if suffix else None,
    }


def fetch_verses(book_code, chapter, start_verse, end_verse):
    """bskorea에서 해당 장을 가져와 지정 절 텍스트를 추출."""
    params = {
        "version": "GAE",
        "book": book_code,
        "chap": str(chapter),
        "sec": str(start_verse),
        "cVersion": "",
        "fontSize": "15px",
        "fontWeight": "normal",
    }

    resp = requests.get(BASE_URL, params=params, headers=HEADERS, timeout=15)
    resp.encoding = "utf-8"

    if resp.status_code != 200:
        print(f"  HTTP Error: {resp.status_code}")
        return None

    soup = BeautifulSoup(resp.text, "html.parser")
    td = soup.find(id="tdBible1")
    if not td:
        print("  #tdBible1 not found")
        return None

    # 각 절은 <span> > <span class="number">N</span> + 텍스트
    # <span class="number">를 포함하는 부모 <span>을 찾아 절 번호로 필터링
    # 시편 등은 <f> 태그 안에 감싸져 있으므로 recursive=True 사용
    verses = {}
    for num_span in td.find_all("span", class_="number"):
        span = num_span.parent
        if not span or span.name != "span":
            continue
        num_text = num_span.get_text(strip=True)
        try:
            verse_num = int(num_text)
        except ValueError:
            continue

        if start_verse <= verse_num <= end_verse:
            # 주석 div 제거
            for div in span.find_all("div", class_="D2"):
                div.decompose()
            # 주석 참조(ㄱ, ㄴ 등) 제거
            for a in span.find_all("a", class_="comment"):
                a.decompose()
            # 각주 번호 제거 (1), 2) 등)
            for font in span.find_all("font", size="2"):
                if font.get_text(strip=True) in ["ㄱ)", "ㄴ)", "ㄷ)", "ㄹ)", "ㅁ)", "ㅂ)", "ㅅ)", "ㅇ)", "ㅈ)", "ㅊ)", "ㅋ)", "ㅌ)", "ㅍ)", "ㅎ)"]:
                    font.decompose()
            # 절 번호 span 제거
            num_span.decompose()
            # 텍스트 추출
            text = span.get_text(separator=" ", strip=True)
            # 연속 공백 정리
            text = re.sub(r"\s+", " ", text).strip()
            verses[verse_num] = text

    # 요청한 절들을 순서대로 합치기
    result_parts = []
    for v in range(start_verse, end_verse + 1):
        if v in verses:
            result_parts.append(verses[v])

    return " ".join(result_parts) if result_parts else None


def main():
    tts_dir = "/home/ronen/Project/BibleRun-Web/bible_verses_tts"
    output_file = "/home/ronen/Project/BibleRun-Web/bible_verses.json"

    # mp3 파일 목록
    files = sorted([f for f in os.listdir(tts_dir) if f.endswith(".mp3")])

    results = []
    for filename in files:
        info = parse_filename(filename)
        if not info:
            print(f"SKIP (parse error): {filename}")
            continue

        book_code = BOOK_MAP.get(info["book"])
        if not book_code:
            print(f"SKIP (unknown book): {filename} → {info['book']}")
            continue

        ref = f"{info['book']} {info['chapter']}:{info['start_verse']}"
        if info["end_verse"] != info["start_verse"]:
            ref += f"-{info['end_verse']}"
        if info.get("suffix"):
            ref += info["suffix"]

        print(f"[{filename}] → {ref} (book={book_code}, chap={info['chapter']}, sec={info['start_verse']}-{info['end_verse']})")

        text = fetch_verses(book_code, info["chapter"], info["start_verse"], info["end_verse"])

        if text:
            print(f"  OK: {text[:80]}...")
        else:
            print(f"  FAIL: no text extracted")

        entry = {
            "id": int(re.match(r"^(\d+)", filename).group(1)),
            "filename": filename.replace(".mp3", ""),
            "book": info["book"],
            "chapter": info["chapter"],
            "start_verse": info["start_verse"],
            "end_verse": info["end_verse"],
            "reference": ref,
            "text": text or "",
        }
        results.append(entry)

        # 서버 부하 방지 (1초 대기)
        time.sleep(1)

    # JSON 저장
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\nDone! {len(results)} verses saved to {output_file}")
    success = sum(1 for r in results if r["text"])
    print(f"Success: {success}/{len(results)}")


if __name__ == "__main__":
    main()
