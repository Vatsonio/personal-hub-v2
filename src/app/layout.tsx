import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SettingsHydrator from "@/components/settings/SettingsHydrator";
import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "@/components/LocaleProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Personal Hub",
  description: "Твій персональний цифровий простір",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Personal Hub",
    statusBarStyle: "black-translucent"
  },
  other: {
    "mobile-web-app-capable": "yes"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#030712"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-gray-950 text-white`}>
        <SessionProvider>
          <LocaleProvider>
            <SettingsHydrator />
            {children}
          </LocaleProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
