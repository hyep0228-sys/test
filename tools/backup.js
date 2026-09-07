#!/usr/bin/env node
/**
 * Supabase 데이터 백업 — 전 테이블 + 인증 계정을 JSON 으로 내려받는다.
 *
 *   node tools/backup.js              # ~/design-history-backup/<날짜>/ 에 저장
 *   node tools/backup.js /경로        # 위치 지정
 *
 * 왜 이 방식인가: `supabase db dump` 는 Docker 가 있어야 하고, pg_dump 도 이 기기에
 * 깔려 있지 않다. 스키마는 `supabase/migrations/` 가 이미 git 에 있으니 여기서는
 * **데이터만** 받아도 복구에 충분하다.
 *
 * 비밀키는 이 파일에 없다 — `.env.local` 에서 읽는다.
 * **받은 파일에는 학생 이름·학번이 들어 있다. 레포(공개)에 넣지 말 것.**
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

const TABLES = [
  "profiles", "weeks", "app_settings", "completions",
  "quiz_questions", "quiz_answers",
  "lecture_notes", "lecture_questions",
  "discussion_posts", "slide_overrides",
  "balance_questions", "balance_answers", "balance_reflections",
];

function loadEnv() {
  const file = path.join(__dirname, "..", ".env.local");
  const env = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return env;
}

(async () => {
  const env = loadEnv();
  const URL = env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL || !KEY) {
    console.error("`.env.local` 에 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
    process.exit(1);
  }
  const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const base = path.resolve(
    process.argv[2] || path.join(os.homedir(), "design-history-backup", stamp)
  );

  // 이 레포는 공개다. 학생 이름·학번이 든 파일이 레포 안에 떨어지면
  // 다음 커밋에 딸려 올라갈 수 있으므로 아예 막는다.
  const repo = path.resolve(__dirname, "..");
  if (base === repo || base.startsWith(repo + path.sep)) {
    console.error(
      `레포 안(${repo})에는 백업할 수 없습니다 — 이 레포는 공개이고 백업에는 학생 개인정보가 들어갑니다.\n` +
      `다른 경로를 지정하거나 인자 없이 실행하세요(기본: ~/design-history-backup/).`
    );
    process.exit(1);
  }

  fs.mkdirSync(base, { recursive: true });

  const summary = [];

  for (const t of TABLES) {
    const res = await fetch(`${URL}/rest/v1/${t}?select=*`, { headers: H });
    if (!res.ok) {
      summary.push(`  ${t.padEnd(20)} — 건너뜀 (${res.status})`);
      continue;
    }
    const rows = await res.json();
    fs.writeFileSync(path.join(base, `${t}.json`), JSON.stringify(rows, null, 1));
    summary.push(`  ${t.padEnd(20)} ${String(rows.length).padStart(5)}행`);
  }

  // 로그인 계정은 auth 스키마라 REST 로 못 읽는다 — Admin API 로 따로 받는다.
  // 비밀번호 해시는 내려오지 않으므로, 이것만으로 로그인을 복원할 수는 없다.
  const users = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${URL}/auth/v1/admin/users?page=${page}&per_page=200`, { headers: H });
    if (!res.ok) break;
    const body = await res.json();
    const batch = body.users ?? [];
    users.push(...batch.map((u) => ({
      id: u.id, email: u.email, created_at: u.created_at,
      user_metadata: u.user_metadata, last_sign_in_at: u.last_sign_in_at,
    })));
    if (batch.length < 200) break;
  }
  fs.writeFileSync(path.join(base, "auth_users.json"), JSON.stringify(users, null, 1));
  summary.push(`  ${"auth_users".padEnd(20)} ${String(users.length).padStart(5)}명 (비밀번호 해시는 제외)`);

  console.log(`백업 위치: ${base}\n`);
  console.log(summary.join("\n"));
})();
