import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const pacifico = Inter({
  weight: "400",
  subsets: ["latin"],
  variable: "--Inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Talk To Your GitHub",
  description: "An AI-powered web app to talk to your GitHub repositories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={`${pacifico.variable} h-full antialiased`}>
      <body className='min-h-full flex flex-col font-sans'>{children}</body>
    </html>
  );
}
