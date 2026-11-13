import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = { title: "Celestia — Western & Vedic Chart Calculator" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="font-sans antialiased min-h-screen">{children}</body>
    </html>
  );
}
