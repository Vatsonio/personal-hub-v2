import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SettingsHydrator from "@/components/settings/SettingsHydrator";
import { SessionProvider } from "next-auth/react";
import { LocaleProvider } from "@/components/LocaleProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Personal Hub",
  description: "Твій персональний цифровий простір"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
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
