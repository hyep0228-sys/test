export const ACTIVITIES = [
  { key: "quiz", label: "QUIZ", description: "오늘 배운 것을 확인" },
  { key: "balance", label: "BALANCE", description: "나의 디자인 취향" },
  { key: "think", label: "THINK", description: "나의 생각" },
  { key: "make", label: "MAKE", description: "오늘의 디자인" },
];

export function getActivity(key) {
  return ACTIVITIES.find((a) => a.key === key);
}
