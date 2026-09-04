import Link from "next/link";
import BulkCreateForm from "./BulkCreateForm";
import Page from "@/components/Page";

export default function AdminStudentsPage() {
  return (
    <Page width="wide">
      <p className="mb-6">
        <Link href="/admin" className="text-sm text-accent underline">
          ← 관리자 홈
        </Link>
      </p>
      <h1 className="font-display text-2xl sm:text-3xl mb-2">학생 계정 일괄 생성</h1>
      <p className="text-mute text-sm mb-8">
        한 줄에 한 명씩, <b>이름,학번,생년월일뒤4자리</b> 형식으로 붙여넣어주세요.
        <br />
        예: 박지혜,20260001,0715
        <br />
        초기 비밀번호는 <b>학번+생년월일뒤4자리</b>로 자동 생성되고, 학생이 처음
        로그인하면 비밀번호를 새로 설정하도록 안내됩니다.
      </p>
      <BulkCreateForm />
    </Page>
  );
}
