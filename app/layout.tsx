import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL("https://learn.visionitinstitute.com"),
  title: "Vision IT Computer Institute Learn Start",
  description: "Official Learning Management System for Vision IT Computer Institute students.",
  icons: {
    icon: [
      { url: "https://res.cloudinary.com/ddiooxxks/image/upload/f_auto,q_auto/logo_unnut8.png" },
      { url: "https://res.cloudinary.com/ddiooxxks/image/upload/f_auto,q_auto/logo_unnut8.png", sizes: "32x32", type: "image/png" },
      { url: "https://res.cloudinary.com/ddiooxxks/image/upload/f_auto,q_auto/logo_unnut8.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "https://res.cloudinary.com/ddiooxxks/image/upload/f_auto,q_auto/logo_unnut8.png",
    apple: [
      { url: "https://res.cloudinary.com/ddiooxxks/image/upload/f_auto,q_auto/logo_unnut8.png" },
      { url: "https://res.cloudinary.com/ddiooxxks/image/upload/f_auto,q_auto/logo_unnut8.png", sizes: "180x180", type: "image/png" },
    ],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
