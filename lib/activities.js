export const ACTIVITIES = [
  { key: "quiz", label: "QUIZ", description: "오늘 배운 것을 확인" },
];

export function getActivity(key) {
  return ACTIVITIES.find((a) => a.key === key);
}
