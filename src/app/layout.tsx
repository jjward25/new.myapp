import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from '../components/navbar'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My App",
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
        <div className="w-full mx-auto justify-evenly min-h-screen bg-gradient-to-br from-black via-slate-800 to-neutral-800">
          <Navbar/>
          {children}
        </div>
      </body>
    </html>
  );
}
