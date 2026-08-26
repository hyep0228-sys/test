#!/usr/bin/env python3
"""Fetch Wikimedia Commons images, verify license, convert to web-weight WebP.

Usage:
    python3 fetchimg.py <slug> <Commons File title> [width]

Writes to hub-repo/public/slides/img/<slug>.webp and appends a row to
img_manifest.tsv (slug, width, kb, license, credit, source title).
Skips (and reports) any file whose license is not free.
"""
import json, os, subprocess, sys, urllib.parse, io
from PIL import Image

REPO = '/private/tmp/claude-501/-Users-jeehyepark/9d1597f8-a9ae-45e3-af0a-d720da441a60/scratchpad/hub-repo'
IMGDIR = os.path.join(REPO, 'public/slides/img')
MANIFEST = '/private/tmp/claude-501/-Users-jeehyepark/9d1597f8-a9ae-45e3-af0a-d720da441a60/scratchpad/img_manifest.tsv'

OK_LICENSE = ('public domain', 'cc0', 'cc by', 'cc by-sa', 'free art license')


def api(title):
    q = urllib.parse.quote(title)
    url = ('https://commons.wikimedia.org/w/api.php?action=query&titles=' + q +
           '&prop=imageinfo&iiprop=url|size|extmetadata&format=json')
    raw = subprocess.run(['curl', '-s', '-H', 'User-Agent: design-history-course/1.0', url],
                         capture_output=True, text=True).stdout
    d = json.loads(raw)
    page = next(iter(d['query']['pages'].values()))
    ii = page.get('imageinfo', [{}])[0]
    if not ii.get('url'):
        raise SystemExit(f'NOT FOUND: {title}')
    md = ii.get('extmetadata', {})
    def get(k):
        v = md.get(k, {}).get('value', '')
        import re
        return re.sub(r'<[^>]+>', '', v).strip()
    return ii['url'].split('?')[0], get('LicenseShortName'), get('Artist'), ii['width'], ii['height']


def main():
    slug, title = sys.argv[1], sys.argv[2]
    target_w = int(sys.argv[3]) if len(sys.argv) > 3 else 1400

    url, lic, artist, w, hgt = api(title)
    if not any(t in lic.lower() for t in OK_LICENSE):
        raise SystemExit(f'LICENSE NOT FREE ({lic}): {title}')

    raw = subprocess.run(['curl', '-sL', '-H', 'User-Agent: design-history-course/1.0', url],
                         capture_output=True).stdout
    im = Image.open(io.BytesIO(raw)).convert('RGB')
    if im.size[0] > target_w:
        im = im.resize((target_w, round(im.size[1] * target_w / im.size[0])), Image.LANCZOS)
    os.makedirs(IMGDIR, exist_ok=True)
    out = os.path.join(IMGDIR, slug + '.webp')
    im.save(out, 'WEBP', quality=80, method=6)
    kb = os.path.getsize(out) / 1024

    with open(MANIFEST, 'a') as f:
        f.write(f'{slug}\t{im.size[0]}x{im.size[1]}\t{kb:.0f}KB\t{lic}\t{artist[:60]}\t{title}\n')
    print(f'{slug}.webp  {im.size[0]}x{im.size[1]}  {kb:.0f}KB  [{lic}]  {artist[:40]}')


if __name__ == '__main__':
    main()
