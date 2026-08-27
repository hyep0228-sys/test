#!/usr/bin/env python3
"""커먼즈 이미지 수집 → 라이선스 검증 → WebP 변환 → 출처 기록.

    python3 tools/slides/fetchimg.py <slug> "File:커먼즈파일명.jpg" [가로폭] [주차]

public/slides/img/<slug>.webp 를 만들고 tools/slides/img_credits.tsv 에 한 줄 붙인다.
자유 라이선스(PD/CC0/CC BY/CC BY-SA)가 아니면 받지 않고 중단한다.

의존성 없음. 예전 판은 Pillow 를 썼는데 시스템 파이썬이 외부 패키지 설치를
막아(PEP 668) 세션이 바뀌면 안 돌았다. macOS 기본 sips 와 brew 의 cwebp 만 쓴다.
"""
import json, os, re, subprocess, sys, tempfile, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '../..'))
IMGDIR = os.path.join(REPO, 'public/slides/img')
CREDITS = os.path.join(HERE, 'img_credits.tsv')
UA = 'design-history-course/1.0 (수업자료; 비영리 교육용)'

OK_LICENSE = ('public domain', 'cc0', 'cc by', 'cc by-sa', 'free art license')


def api(title):
    q = urllib.parse.quote(title)
    url = ('https://commons.wikimedia.org/w/api.php?action=query&titles=' + q +
           '&prop=imageinfo&iiprop=url|size|extmetadata&format=json')
    raw = subprocess.run(['curl', '-s', '-H', 'User-Agent: ' + UA, url],
                         capture_output=True, text=True).stdout
    page = next(iter(json.loads(raw)['query']['pages'].values()))
    ii = (page.get('imageinfo') or [{}])[0]
    if not ii.get('url'):
        raise SystemExit(f'찾을 수 없음: {title}')
    md = ii.get('extmetadata', {})
    def get(k):
        return re.sub(r'<[^>]+>', '', md.get(k, {}).get('value', '')).strip()
    return ii['url'].split('?')[0], get('LicenseShortName'), get('Artist')


def dims(path):
    out = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', path],
                         capture_output=True, text=True).stdout
    w = re.search(r'pixelWidth:\s*(\d+)', out)
    h = re.search(r'pixelHeight:\s*(\d+)', out)
    return int(w.group(1)), int(h.group(1))


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)
    slug, title = sys.argv[1], sys.argv[2]
    target_w = int(sys.argv[3]) if len(sys.argv) > 3 else 1200
    week = sys.argv[4] if len(sys.argv) > 4 else ''

    url, lic, artist = api(title)
    if not any(t in lic.lower() for t in OK_LICENSE):
        raise SystemExit(f'라이선스 부적합 ({lic}): {title}')

    ext = os.path.splitext(url)[1] or '.jpg'
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tf:
        src = tf.name
    subprocess.run(['curl', '-sL', '-H', 'User-Agent: ' + UA, '-o', src, url], check=True)

    w, h = dims(src)
    if w > target_w:                      # -Z 는 긴 변 기준이라 가로가 긴 쪽만 맞춘다
        subprocess.run(['sips', '--resampleWidth', str(target_w), src],
                       capture_output=True, check=True)
        w, h = dims(src)

    os.makedirs(IMGDIR, exist_ok=True)
    out = os.path.join(IMGDIR, slug + '.webp')
    subprocess.run(['cwebp', '-quiet', '-q', '80', '-m', '6', src, '-o', out], check=True)
    os.unlink(src)
    kb = os.path.getsize(out) / 1024

    with open(CREDITS, 'a') as f:
        f.write(f'{slug}.webp\t{week}\t{w}x{h}\t{kb:.0f}KB\t{lic}\t{artist[:60]}\t{title}\n')
    warn = '  ← 170KB 초과, 폭을 줄일 것' if kb > 170 else ''
    print(f'{slug}.webp  {w}x{h}  {kb:.0f}KB  [{lic}]  {artist[:40]}{warn}')


if __name__ == '__main__':
    main()
