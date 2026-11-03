import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "紫微斗数 · AI 排盘",
  description: "开源紫微斗数排盘引擎 + AI 深度解读",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=Noto+Sans+SC:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased text-ink-900">{children}</body>
    </html>
  );
}
