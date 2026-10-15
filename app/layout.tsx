import type { Metadata } from "next";
import { Caprasimo, Figtree } from "next/font/google";
import { AuthGate } from "@/components/auth/AuthGate";
import "./globals.css";

// The Organic restyle's two faces: Caprasimo for headings, verse references, hall titles and
// stat numbers (it ships a single weight), Figtree for body text, controls and verse text.
const caprasimo = Caprasimo({
  variable: "--font-caprasimo",
  subsets: ["latin"],
  weight: "400",
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Verses — Bible Verse Memorization",
  description: "Memorize Scripture through short, gamified daily drills.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${caprasimo.variable} ${figtree.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col overflow-x-clip">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
