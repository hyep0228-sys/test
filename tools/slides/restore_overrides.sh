#!/bin/zsh
# slide_overrides 복원. 백업 JSON 을 그대로 다시 넣는다.
#   사용: tools/slides/restore_overrides.sh tools/slides/backup/slide_overrides-YYYYMMDD-HHMMSS.json
# 2026-09-06 에 2주차 두 건을 지웠다. 둘 다 파일과 내용이 같아 화면 변화는 없었다.
# 오버라이드는 (주차, 주차 안 순번) 으로 걸려서 슬라이드를 넣고 빼면 밀린다 —
# 되살릴 때는 지금 순번이 맞는지 반드시 확인할 것.
set -e
F=${1:?백업 JSON 경로를 달라}
cd "$(dirname "$0")/../.."
set -a; . ./.env.local; set +a
python3 - "$F" <<'PY' > /tmp/_ovr_payload.json
import json,io,sys
rows=json.load(io.open(sys.argv[1],encoding="utf-8"))
keep=[{k:r[k] for k in ("week_id","slide_index","content_html")} for r in rows]
json.dump(keep,sys.stdout,ensure_ascii=False)
PY
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/slide_overrides" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation,resolution=merge-duplicates" \
  --data-binary @/tmp/_ovr_payload.json \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print('복원:',[(r['week_id'],r['slide_index']) for r in d])"
rm -f /tmp/_ovr_payload.json
