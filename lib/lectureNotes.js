/**
 * 수업 중 메모의 글자 수 상한. 한 주차 필기로는 닿지 않는 길이이고,
 * 문서를 통째로 붙여넣는 사고만 막는다.
 *
 * 상수를 "use server" 액션 파일에 두면 async 함수만 export 할 수 있어
 * 빌드가 깨진다. 그래서 여기 둔다.
 */
export const NOTE_MAX_LENGTH = 20000;
