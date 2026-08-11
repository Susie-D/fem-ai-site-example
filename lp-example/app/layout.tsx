import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Fern & Clay | Plant shop & greenhouse in Stoke Newington",
  description: "Houseplants, practical plant-care advice, small workshops and local delivery from a working greenhouse in Stoke Newington, London.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Fern & Clay",
    description: "Plants, practical advice & a working greenhouse in Stoke Newington",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Fern & Clay greenhouse" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
