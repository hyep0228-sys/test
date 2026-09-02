-- =========================================================
-- 주차별 키워드 라벨
-- =========================================================

alter table public.weeks add column keywords text[];

update public.weeks set keywords = case id
  when 1  then array['디자인의 정의', '연대표', '평가방법', '오리엔테이션']
  when 2  then array['장인정신', '길드', '표준화', '취향']
  when 3  then array['분업', '증기기관', '특허', '공장제']
  when 4  then array['대박람회', '부품호환성', '디자인개혁', '대량생산']
  when 5  then array['수공예', '러스킨', '사회개혁', '패턴디자인']
  when 6  then array['곡선', '자포니즘', '총체예술', '장식']
  when 7  then array['독일공작연맹', '표준화', '기업디자인', '형태와기능']
  when 9  then array['조립라인', '계획적진부화', '대량소비', '산업디자이너']
  when 10 then array['기능주의', '바우하우스', '국제주의양식', '형태는기능을따른다']
  when 11 then array['유선형', '기하학', '사치와장식', '대중문화']
  when 12 then array['굿디자인', '시스템디자인', '대량생산가구', '디자인이데올로기']
  when 13 then array['국가주도진흥', '상업미술', '압축성장', '한글타이포']
  when 14 then array['UX디자인', '생성형AI', '저작권', '디자인씽킹']
  else null
end;
