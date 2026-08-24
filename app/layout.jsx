import "./globals.css";

export const metadata = {
  title: "디자인사 아카이브",
  description: "15주 디자인사 참여형 학습 앱",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <div className="mx-auto max-w-md min-h-screen">{children}</div>
      </body>
    </html>
  );
}
