const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto('file:///Users/jeehyepark/design-history-app/public/slides/index.html?p=0', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  for (let i = 1; i < 17; i++) await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(350);
  await page.screenshot({ path: '/private/tmp/claude-501/-Users-jeehyepark/a7dd1c9d-2133-47bd-8afb-21c990967016/scratchpad/p17-final.png' });
  await b.close();
})();
