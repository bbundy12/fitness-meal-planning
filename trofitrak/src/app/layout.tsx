import type { Metadata } from "next";
import Link from "next/link";
import { DesktopNav, MobileNav } from "@/components/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrofiTrak",
  description: "Fitness meal planning (local mock UI)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <div className="bg-rose-600 w-8 h-8 rounded flex items-center justify-center">
                  <span className="text-white">T</span>
                </div>
                <h1 className="text-slate-900">TrofiTrak</h1>
              </Link>

              <DesktopNav />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          {children}
        </main>

        <MobileNav />
      </body>
    </html>
  );
}
