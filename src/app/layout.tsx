import type { Metadata } from "next";
import Link from "next/link";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conduit Monitor",
  description: "Monitoring dashboard for Psiphon Conduit servers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen bg-background">
            <header className="border-b">
              <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                <h1 className="text-xl font-semibold">Conduit Monitor</h1>
                <nav className="flex gap-4">
                  <Link href="/" className="text-sm hover:underline">
                    Dashboard
                  </Link>
                  <Link href="/servers" className="text-sm hover:underline">
                    Servers
                  </Link>
                </nav>
              </div>
            </header>
            <main className="container mx-auto px-4 py-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
