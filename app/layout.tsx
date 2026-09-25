import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import AlerteAttente from "./_components/AlerteAttente";
import Synchro from "./_components/Synchro";
import SuiviSumUp from "./_components/SuiviSumUp";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Commandes Bar",
  description: "Gestion des commandes événement",
  manifest: "/manifest.json",
  icons: {
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#131316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <Synchro />
        <AlerteAttente />
        <SuiviSumUp />
        {children}
      </body>
    </html>
  );
}
