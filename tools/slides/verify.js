#!/usr/bin/env node
/**
 * 슬라이드 덱 검증 — 배포 전 반드시 실행.
 *
 *   node tools/slides/verify.js            # 전체 주차
 *   node tools/slides/verify.js 2          # 2주차만
 *
 * 검사 항목
 *   1. 레이아웃 넘침 (.stage 가 슬라이드 밖으로 밀리는지)
 *   2. 깨진 이미지 / 404
 *   3. 이미지 참조와 실제 파일의 정합성
 *
 * 사전 요건: npm i -D playwright-core  (Chrome 은 시스템 설치본 사용)
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const SLIDES = path.join(__dirname, '../../public/slides');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function refIntegrity() {
  const html = fs.readFileSync(path.join(SLIDES, 'index.html'), 'utf8');
  const refs = new Set([...html.matchAll(/src="img\/([^"]+)"/g)].map((m) => m[1]));
  const files = new Set(fs.readdirSync(path.join(SLIDES, 'img')));
  const missing = [...refs].filter((f) => !files.has(f));
  const orphan = [...files].filter((f) => !refs.has(f));
  console.log(`참조 ${refs.size} · 파일 ${files.size}`);
  if (missing.length) console.log('  ✗ 참조했는데 없는 파일:', missing);
  if (orphan.length) console.log('  ! 아무도 안 쓰는 파일:', orphan);
  if (!missing.length && !orphan.length) console.log('  ✓ 정합성 이상 없음');
  return missing.length === 0;
}

async function main() {
  const only = process.argv[2] ? Number(process.argv[2]) : null;
  const html = fs.readFileSync(path.join(SLIDES, 'index.html'), 'utf8');
  const counts = {};
  for (const m of html.matchAll(/data-week="(\d+)"/g)) {
    counts[m[1]] = (counts[m[1]] || 0) + 1;
  }

  const okRefs = refIntegrity();

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  const failed = [];
  page.on('response', (r) => { if (r.status() >= 400) failed.push(r.url().split('/').pop()); });

  let overflow = [], broken = 0, total = 0;
  for (const wk of Object.keys(counts).sort((a, b) => a - b)) {
    if (only !== null && Number(wk) !== only) continue;
    for (let i = 0; i < counts[wk]; i++) {
      await page.goto(`file://${SLIDES}/index.html?week=${wk}&p=${i}&clean=1`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(90);
      const r = await page.evaluate(() => {
        const s = document.querySelector('.slide.is-active');
        const st = s && s.querySelector('.stage');
        const imgs = s ? [...s.querySelectorAll('img')] : [];
        return {
          t: s && s.getAttribute('data-title'),
          o: st ? st.scrollHeight - st.clientHeight : 0,
          bad: imgs.filter((i) => !i.complete || i.naturalWidth === 0).length,
        };
      });
      total++; broken += r.bad;
      if (r.o > 4) overflow.push(`W${wk} ${r.t} (+${r.o}px)`);
    }
  }
  await browser.close();

  console.log(`\n슬라이드 ${total}장 검사`);
  console.log('  넘침    :', overflow.length ? overflow : '없음');
  console.log('  깨진이미지:', broken);
  console.log('  404     :', failed.length ? [...new Set(failed)] : '없음');

  const pass = okRefs && !overflow.length && !broken && !failed.length;
  console.log(pass ? '\n✓ 통과 — 배포 가능' : '\n✗ 실패 — 배포 전 수정 필요');
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
