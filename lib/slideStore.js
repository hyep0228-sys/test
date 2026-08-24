import fs from "node:fs";
import path from "node:path";

let cachedHtml = null;

function readDeckHtml() {
  if (cachedHtml) return cachedHtml;
  const filePath = path.join(process.cwd(), "public", "slides", "index.html");
  cachedHtml = fs.readFileSync(filePath, "utf8");
  return cachedHtml;
}

const SECTION_RE = /<section class="slide"([^>]*)>([\s\S]*?)<\/section>/g;

function parseAttrs(attrString) {
  const attrs = {};
  const re = /(\S+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(attrString))) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

function allSlides() {
  const html = readDeckHtml();
  const out = [];
  let m;
  SECTION_RE.lastIndex = 0;
  while ((m = SECTION_RE.exec(html))) {
    const attrs = parseAttrs(m[1]);
    out.push({
      week: Number(attrs["data-week"]),
      title: attrs["data-title"] ?? "",
      dates: attrs["data-dates"] ?? "",
      era: attrs["data-era"] ?? "",
      body: m[2],
    });
  }
  return out;
}

function stageInnerHtml(sectionBody) {
  // The editable region is the .stage div; .motif is decorative and untouched.
  const stageMatch = sectionBody.match(
    /<div class="(stage[^"]*)">([\s\S]*)<\/div>\s*<\/section>?\s*$/
  );
  if (stageMatch) return { className: stageMatch[1], inner: stageMatch[2] };
  // Fallback: looser match in case trailing whitespace/section differs.
  const loose = sectionBody.match(/<div class="(stage[^"]*)">([\s\S]*)/);
  if (loose) {
    let inner = loose[2];
    inner = inner.replace(/<\/div>\s*$/, "");
    return { className: loose[1], inner };
  }
  return { className: "stage", inner: sectionBody };
}

// Replace embedded base64 images with short placeholder tokens so the
// professor edits plain text instead of a wall of image data.
function toEditable(html) {
  let i = 0;
  const editable = html.replace(
    /(<img[^>]*\bsrc=")data:[^"]*(")/g,
    (_match, pre, post) => {
      i += 1;
      return `${pre}{{IMG_${i}}}${post}`;
    }
  );
  return editable;
}

// Splice the real base64 image data (from the ORIGINAL baseline slide, never
// from a prior override) back into edited HTML wherever {{IMG_n}} appears.
function restoreImages(editedHtml, baselineHtml) {
  const sources = [];
  const re = /<img[^>]*\bsrc="(data:[^"]*)"/g;
  let m;
  while ((m = re.exec(baselineHtml))) sources.push(m[1]);
  return editedHtml.replace(/\{\{IMG_(\d+)\}\}/g, (_match, n) => {
    const idx = Number(n) - 1;
    return sources[idx] ?? "";
  });
}

export function listSlidesForWeek(weekId) {
  return allSlides()
    .filter((s) => s.week === weekId)
    .map((s, i) => ({
      index: i + 1,
      title: s.title,
      dates: s.dates,
    }));
}

export function getBaselineStage(weekId, slideIndex) {
  const slides = allSlides().filter((s) => s.week === weekId);
  const slide = slides[slideIndex - 1];
  if (!slide) return null;
  const { inner } = stageInnerHtml(slide.body);
  return { title: slide.title, dates: slide.dates, html: inner };
}

export function getEditableStage(weekId, slideIndex, overrideHtml) {
  const baseline = getBaselineStage(weekId, slideIndex);
  if (!baseline) return null;
  const source = overrideHtml ?? baseline.html;
  return {
    title: baseline.title,
    dates: baseline.dates,
    editableHtml: toEditable(source),
  };
}

export function resolveOverrideToStore(weekId, slideIndex, editedHtml) {
  const baseline = getBaselineStage(weekId, slideIndex);
  if (!baseline) throw new Error("존재하지 않는 슬라이드입니다.");
  return restoreImages(editedHtml, baseline.html);
}
