import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Couples Connect — find couple friends in your city",
  description: "Meet other couples nearby who love the same food, music and weekend plans.",
};

export const viewport: Viewport = { themeColor: "#fbf6ee", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
