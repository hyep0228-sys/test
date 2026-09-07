const STUDENT_EMAIL_DOMAIN = "student.designhistory.app";

// 계정을 만들 때와 교수자가 초기화할 때 쓰는 첫 비밀번호.
// Supabase 가 6자 미만을 거부하므로 0 을 네 개가 아니라 여섯 개 쓴다.
// 학생은 첫 로그인에서 반드시 새 비밀번호를 정하게 된다(onboarded=false).
export const INITIAL_PASSWORD = "000000";

export function studentNoToEmail(studentNo) {
  return `${studentNo}@${STUDENT_EMAIL_DOMAIN}`;
}

export function emailToStudentNo(email) {
  return email.replace(`@${STUDENT_EMAIL_DOMAIN}`, "");
}

/** 이름 대조용. 띄어쓰기와 대소문자 차이로 로그인이 막히지 않게 한다. */
export function normalizeName(name) {
  return (name ?? "").replace(/\s+/g, "").toLowerCase();
}
