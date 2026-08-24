const STUDENT_EMAIL_DOMAIN = "student.designhistory.app";

export function studentNoToEmail(studentNo) {
  return `${studentNo}@${STUDENT_EMAIL_DOMAIN}`;
}

export function emailToStudentNo(email) {
  return email.replace(`@${STUDENT_EMAIL_DOMAIN}`, "");
}
