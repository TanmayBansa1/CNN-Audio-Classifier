import "~/styles/globals.css";

import { type Metadata } from "next";
import { Playfair_Display, Crimson_Text, Inter } from "next/font/google";
import { Providers } from "~/lib/providers";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: {
    default: "SunoAI - Advanced Audio Classification & CNN Visualization Platform",
    template: "%s | SunoAI Audio AI"
  },
  description: "Transform audio analysis with SunoAI's cutting-edge neural network visualization platform. Upload audio files for real-time AI classification, explore CNN feature maps, and understand deep learning models through interactive visualizations.",
  keywords: [
    "audio classification",
    "CNN visualization", 
    "neural network",
    "machine learning",
    "AI audio analysis",
    "deep learning",
    "feature maps",
    "spectrogram analysis",
    "audio AI",
    "sound classification",
    "PyTorch visualization",
    "audio deep learning",
    "convolutional neural network",
    "audio processing",
    "ML visualization"
  ],
  authors: [{ name: "SunoAI Team" }],
  creator: "SunoAI",
  publisher: "SunoAI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://sunoai.tanmay.space'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'SunoAI - Advanced Audio Classification & CNN Visualization Platform',
    description: 'Transform audio analysis with SunoAI\'s cutting-edge neural network visualization platform. Upload audio files for real-time AI classification and explore CNN feature maps.',
    siteName: 'SunoAI Audio Visualizer',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'SunoAI Audio Classification and CNN Visualization Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SunoAI - Advanced Audio Classification & CNN Visualization',
    description: 'Transform audio analysis with cutting-edge neural network visualization. Upload audio files for real-time AI classification.',
    images: ['/logo.png'],
    creator: '@sunoai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'technology',
  classification: 'AI/Machine Learning Tools',
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
    { rel: "icon", type: "image/png", sizes: "16x16", url: "/favicon-16x16.png" },
  ],
  manifest: "/site.webmanifest",
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <meta name="theme-color" content="#f97316" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SunoAI" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "SunoAI Audio Visualizer",
              "description": "Advanced audio classification and CNN visualization platform for machine learning researchers and developers",
              "url": "https://sunoai.tanmay.space",
              "applicationCategory": "DeveloperApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "creator": {
                "@type": "Organization",
                "name": "SunoAI"
              },
              "featureList": [
                "Real-time audio classification",
                "CNN feature map visualization", 
                "Spectrogram analysis",
                "Interactive neural network exploration",
                "Audio waveform visualization"
              ]
            })
          }}
        />
      </head>
      <body className="font-inter antialiased bg-gradient-to-br from-rose-50 via-amber-50 to-orange-100">
        <Providers>
          {children}
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
