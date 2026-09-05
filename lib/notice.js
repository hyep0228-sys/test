// 공지는 한 칸짜리다. 별도 테이블 없이 기존 key/value 테이블(app_settings)에 얹었다 —
// 이미 "로그인하면 읽기, 교수자만 쓰기" RLS 가 걸려 있어 그대로 맞는다.
//
// 이 상수를 액션 파일에 두면 안 된다. "use server" 파일은 async 함수만 export 할 수 있어
// 빌드가 깨진다.
export const NOTICE_KEY = "notice";
export const NOTICE_MAX_LENGTH = 1000;
