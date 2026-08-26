#!/usr/bin/env node
/**
 * 슬라이드 덱 검증 — 배포 전 반드시 실행.
 *
 *   node tools/slides/verify.js            # 전체
 *   node tools/slides/verify.js 2          # 2주차만
 *
 * 검사 항목
 *   1. 레이아웃 넘침 — stage 가 슬라이드 안쪽 영역을 넘는지
 *   2. 과도한 자동축소 — 안 잘리려고 너무 많이 줄어든 슬라이드(내용 과다 신호)
 *   3. 깨진 이미지 / 404
 *   4. 이미지 참조와 실제 파일의 정합성
 *
 * 넘침을 재는 법(중요): .slide 는 overflow:hidden 이라 넘쳐도 스크롤이 안 생긴다.
 * 예전 판은 stage 의 scrollHeight-clientHeight 를 봤는데, stage 는 높이 제약이 없어
 * 항상 0 이 나왔다 — 10장이 잘리는 동안 "넘침 없음"으로 통과했다.
 * 그래서 stage 의 실제 렌더 높이를 슬라이드 안쪽 영역(패딩 제외)과 직접 비교한다.
 *
 * 사전 요건: npm i -D playwright-core  (Chrome 은 시스템 설치본 사용)
 */
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const SLIDES = path.join(__dirname, '../../public/slides');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// 프로젝터(16:9)와 노트북(16:10) 둘 다. clean=1 은 허브 앱이 iframe 으로 띄우는 모드로,
// 상·하단 크롬이 없어 영역이 더 넓다 — 좁은 쪽만 통과시키면 양쪽 다 안전하다.
const VIEWS = [
  { name: '1600×900 (프로젝터)', width: 1600, height: 900 },
  { name: '1280×800 (노트북)', width: 1280, height: 800 },
];

const MIN_SCALE_WARN = 0.85;   // 이보다 더 줄었으면 내용을 덜어내는 게 맞다

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

const measure = () => {
  const s = document.querySelector('.slide.is-active');
  if (!s) return null;
  const st = s.querySelector('.stage');
  const cs = getComputedStyle(s);
  const availH = s.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const r = st.getBoundingClientRect();                     // 축소가 반영된 실제 렌더 크기
  const m = /scale\(([\d.]+)\)/.exec(st.style.transform || '');
  const imgs = [...s.querySelectorAll('img')];
  return {
    wk: s.getAttribute('data-week'),
    t: s.getAttribute('data-title'),
    over: Math.round(r.height - availH),
    scale: m ? Number(m[1]) : 1,
    bad: imgs.filter((i) => !i.complete || i.naturalWidth === 0).length,
  };
};

async function main() {
  const only = process.argv[2] ? Number(process.argv[2]) : null;
  const okRefs = refIntegrity();

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const failed = [];
  let overflow = [], squeezed = [], broken = 0, total = 0;

  for (const view of VIEWS) {
    const page = await browser.newPage({ viewport: { width: view.width, height: view.height } });
    page.on('response', (r) => { if (r.status() >= 400) failed.push(r.url().split('/').pop()); });
    // 첫 장부터: 저장된 위치를 무시하려고 ?p=0 으로 연다.
    await page.goto(`file://${SLIDES}/index.html?p=0`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const count = await page.evaluate(() => document.querySelectorAll('.slide').length);

    for (let i = 0; i < count; i++) {
      if (i > 0) await page.keyboard.press('ArrowRight');   // go() → render() → fitActive()
      // 지연 로딩(loading="lazy") 사진이 도착하기 전에 재면 "깨진 이미지"로 잘못 잡히고
      // 높이도 실제와 달라진다. 이 장의 이미지가 다 뜬 뒤에 잰다.
      await page.waitForFunction(
        () => [...document.querySelectorAll('.slide.is-active img')].every((i) => i.complete),
        null, { timeout: 5000 },
      ).catch(() => {});
      await page.waitForTimeout(60);
      const r = await page.evaluate(measure);
      if (!r) continue;
      if (only !== null && Number(r.wk) !== only) continue;
      total++; broken += r.bad;
      const at = `p${i + 1} W${r.wk} ${r.t}`;
      if (r.over > 4) overflow.push(`${at} — 축소 후에도 +${r.over}px [${view.name}]`);
      else if (r.scale < MIN_SCALE_WARN) squeezed.push(`${at} — ${Math.round(r.scale * 100)}% 로 축소 [${view.name}]`);
    }
    await page.close();
  }
  await browser.close();

  console.log(`\n슬라이드 ${total}장 검사 (뷰포트 ${VIEWS.length}종)`);
  console.log('  넘침     :', overflow.length ? overflow : '없음');
  console.log('  과도축소  :', squeezed.length ? squeezed : '없음');
  console.log('  깨진이미지:', broken);
  console.log('  404      :', failed.length ? [...new Set(failed)] : '없음');

  const pass = okRefs && !overflow.length && !broken && !failed.length;
  console.log(pass ? '\n✓ 통과 — 배포 가능' : '\n✗ 실패 — 배포 전 수정 필요');
  if (squeezed.length) console.log('  (과도축소는 배포를 막지 않는다. 다만 그 장은 내용을 덜어내는 게 맞다.)');
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
