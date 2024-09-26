import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from '../components/Navbar'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Joe's Life",
  description: "Generated by Joe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="w-full mx-auto justify-evenly min-h-screen bg-slate-100 dark:bg-gradient-to-br dark:from-slate-200 dark:via-slate-100 dark:to-slate-100 max-w-[1400px] drop-shadow-md">
          <Navbar/>
          {children}
        </div>
      </body>
    </html>
  );
}
