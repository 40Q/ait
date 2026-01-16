import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { QueryProvider } from "@/lib/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIT Electronics Recycling",
  description: "Certified data destruction and electronics recycling services",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ fontFamily: "'Glacial Indifference', sans-serif" }}>
        <NextTopLoader color="#33cc66" showSpinner={false} />
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
