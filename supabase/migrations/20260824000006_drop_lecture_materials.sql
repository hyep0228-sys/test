-- =========================================================
-- 수업자료를 이미지 업로드 방식에서 슬라이드 덱 iframe 방식으로 전환
-- (/public/slides/index.html, LectureMaterialButton.jsx가 직접 서빙)
-- 더 이상 주차별 이미지 URL을 저장할 필요가 없어 테이블을 제거한다.
-- =========================================================

drop table if exists public.lecture_materials;
