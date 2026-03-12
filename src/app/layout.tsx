import type { Metadata } from "next";
import { Inter, Noto_Sans_JP, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/components/Providers";
import { getThemeInitializationScript } from "@/lib/account-preferences";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rust Dojo — Rust を基礎から実務・競プロまで",
    template: "%s | Rust Dojo",
  },
  description:
    "プログラミング基礎から Rust 言語習得、実務的コーディング、AtCoder 競技プログラミングまでを一気通貫で学べる日本向けハンズオン学習プラットフォーム。",
  keywords: [
    "Rust",
    "プログラミング",
    "学習",
    "AtCoder",
    "競技プログラミング",
    "Rust入門",
    "所有権",
    "借用",
  ],
  openGraph: {
    title: "Rust Dojo",
    description:
      "Rust を基礎から実務・競プロまで学べるハンズオン学習プラットフォーム",
    locale: "ja_JP",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning data-theme="dark">
      <body
        className={`${inter.variable} ${notoSansJP.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Script id="theme-init" strategy="beforeInteractive">
          {getThemeInitializationScript()}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
