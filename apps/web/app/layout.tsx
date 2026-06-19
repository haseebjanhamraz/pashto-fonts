import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Pashto Fonts — Discovery & Embed RTL Web Fonts",
    template: "%s | Pashto Fonts"
  },
  description: "Browse, type, preview and embed beautiful Pashto and Arabic-script RTL fonts for your website.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pashtofonts.com"),
  keywords: ["Pashto Fonts", "RTL Web Fonts", "Pashto Web Fonts", "Arabic Fonts", "Persian Fonts", "Urdu Fonts", "BBC Pashto Font", "Nastaliq", "Naskh", "Google Fonts Pashto"],
  openGraph: {
    title: "Pashto Fonts — Discovery & Embed RTL Web Fonts",
    description: "Browse, type, preview and embed beautiful Pashto and Arabic-script RTL fonts for your website.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://pashtofonts.com",
    siteName: "Pashto Fonts",
    locale: "ps",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pashto Fonts — Discovery & Embed RTL Web Fonts",
    description: "Browse, type, preview and embed beautiful Pashto and Arabic-script RTL fonts for your website.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
