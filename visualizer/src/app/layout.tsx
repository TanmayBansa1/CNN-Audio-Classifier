import "~/styles/globals.css";

import { type Metadata } from "next";
import { Playfair_Display, Crimson_Text, Inter } from "next/font/google";
import { Providers } from "~/lib/providers";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "SunoAI - Audio CNN Visualizer",
  description: "Professional audio classification and CNN visualization tool powered by SunoAI",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const crimson = Crimson_Text({
  subsets: ["latin"],
  variable: "--font-crimson",
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${crimson.variable} ${inter.variable}`}>
      <body className="font-inter antialiased bg-gradient-to-br from-rose-50 via-amber-50 to-orange-100">
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
