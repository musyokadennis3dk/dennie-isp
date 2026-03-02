import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Azani ISP Information System",
  description: "Azani Internet Service Provider Information Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
      >
        <nav className="bg-blue-900 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center font-bold text-blue-900 text-sm">
                  A
                </div>
                <span className="font-bold text-lg tracking-wide">AZANI ISP</span>
              </Link>
              <div className="hidden md:flex items-center gap-1 text-sm">
                <Link
                  href="/institutions"
                  className="px-3 py-2 rounded hover:bg-blue-800 transition-colors"
                >
                  Institutions
                </Link>
                <Link
                  href="/register"
                  className="px-3 py-2 rounded hover:bg-blue-800 transition-colors"
                >
                  Register
                </Link>
                <Link
                  href="/payments"
                  className="px-3 py-2 rounded hover:bg-blue-800 transition-colors"
                >
                  Payments
                </Link>
                <Link
                  href="/infrastructure"
                  className="px-3 py-2 rounded hover:bg-blue-800 transition-colors"
                >
                  Infrastructure
                </Link>
                <Link
                  href="/billing"
                  className="px-3 py-2 rounded hover:bg-blue-800 transition-colors"
                >
                  Billing
                </Link>
                <Link
                  href="/reports"
                  className="px-3 py-2 rounded hover:bg-blue-800 transition-colors"
                >
                  Reports
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        <footer className="bg-blue-900 text-blue-200 text-center py-4 text-sm mt-12">
          © {new Date().getFullYear()} Azani Internet Service Provider — Information Management System
        </footer>
      </body>
    </html>
  );
}
