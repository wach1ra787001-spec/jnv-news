import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JnV Weekly",
  description:
    "Free weekly newsletter from JnV Trading Journal. Better trading starts with better habits.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#f3f6fd] text-[#1a2b4c] antialiased">{children}</body>
    </html>
  );
}
