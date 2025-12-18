import type { Metadata } from "next";
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
        {children}
      </body>
    </html>
  );
}
