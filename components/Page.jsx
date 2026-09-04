/**
 * 페이지 본문 컨테이너.
 *
 * 예전에는 `app/(main)/layout.jsx` 가 모든 화면을 `max-w-md`(448px) 로 묶어서
 * 데스크톱에서 좁은 기둥 하나만 남았다. 이제 폭은 페이지가 성격에 맞게 고른다.
 *
 *   prose  읽기 중심 — 홈·주차·퀴즈
 *   wide   목록/표 — 아카이브·관리자
 *   form   로그인·온보딩처럼 입력만 있는 화면
 *
 * 좌우·위아래 여백은 여기서 한 번만 정의한다. 화면마다 다르게 주지 말 것.
 *
 * center: 사이드바 없는 짧은 화면(로그인·온보딩)을 세로 가운데로.
 * min-h-dvh 는 최소 높이라, 내용이 화면보다 길면 상자가 늘어나 중앙정렬이
 * 저절로 풀린다 — 위쪽이 잘려 스크롤로 못 닿는 문제가 안 생긴다.
 */
const WIDTHS = {
  prose: "max-w-2xl",
  wide: "max-w-4xl",
  form: "max-w-md",
};

export default function Page({
  width = "prose",
  center = false,
  className = "",
  children,
}) {
  return (
    <main
      className={`mx-auto w-full ${WIDTHS[width] ?? WIDTHS.prose} px-5 sm:px-8 py-10 sm:py-14 lg:py-16 ${
        center ? "min-h-dvh flex flex-col justify-center" : ""
      } ${className}`}
    >
      {children}
    </main>
  );
}
