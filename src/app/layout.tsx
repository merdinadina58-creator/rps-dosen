import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RPS Dosen - Sistem Manajemen Rencana Pembelajaran Semester",
  description: "Sistem manajemen RPS (Rencana Pembelajaran Semester) untuk dosen perguruan tinggi Indonesia. Buat, kelola, dan export RPS dengan AI assistant.",
  keywords: ["RPS", "Rencana Pembelajaran Semester", "Dosen", "Perguruan Tinggi", "CPMK", "MBKM", "KKNI"],
  authors: [{ name: "RPS Dosen Management System" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
