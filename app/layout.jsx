import { Instrument_Serif } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata = {
  title: "디자인사 아카이브",
  description: "15주 디자인사 참여형 학습 앱",
};

// viewportFit:"cover" 는 노치/홈인디케이터가 있는 기기에서 화면을 끝까지 쓰되,
// globals.css 의 safe-area 패딩으로 내용이 가려지지 않게 하려는 것.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#EFEEEA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className={instrumentSerif.variable}>
      <head>
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"
        />
      </head>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
