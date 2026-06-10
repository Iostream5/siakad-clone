import type { Metadata } from "next";
import { IBM_Plex_Mono, Nunito_Sans } from "next/font/google";
import { Suspense } from "react";

import { ToastSearchParamBridge } from "@/components/ui/toast-search-param-bridge";
import { ToastProvider } from "@/components/ui/toast-provider";

import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIAKAD STAI",
  description: "Sistem Informasi Akademik universitas berbasis Next.js dan Supabase.",
  icons: {
    icon: "/logostai.png",
    shortcut: "/logostai.png",
    apple: "/logostai.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${nunitoSans.variable} ${plexMono.variable}`}>
      <body suppressHydrationWarning>
        <ToastProvider>
          <Suspense fallback={null}>
            <ToastSearchParamBridge />
          </Suspense>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
