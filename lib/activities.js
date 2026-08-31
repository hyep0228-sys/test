export const ACTIVITIES = [
  { key: "quiz", label: "QUIZ" },
];

export function getActivity(key) {
  return ACTIVITIES.find((a) => a.key === key);
}
