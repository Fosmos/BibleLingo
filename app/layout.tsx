import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import { AuthGate } from "@/components/auth/AuthGate";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// The Bible verse text's own reading font — a plain, quiet old-style text serif (the same
// "workhorse" genre as Untitled Serif, YouVersion's own reading typeface, which is a paid Klim
// Type Foundry release with no free/Google Fonts license this app can pull from) rather than
// Playfair Display's high-contrast DISPLAY serif, which the app's headings/titles keep using —
// see tailwind.config.ts's own `reading` font family and ChapterPageContent.tsx's own use of it.
const sourceSerif4 = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Verses — Bible Verse Memorization",
  description: "Memorize Scripture through short, gamified daily drills.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${plusJakartaSans.variable} ${sourceSerif4.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
