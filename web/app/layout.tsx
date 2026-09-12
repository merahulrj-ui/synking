import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#07050d',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://synkin.in'),
  title: 'Synkin — Real-Time Dating App | Meet Verified Singles Nearby & Instant Sparks',
  description:
    "Stop collecting pen-pals. Meet walking-distance verified singles with Synkin's 360° Spark Radar, private 3-min video vibe checks, verified daylight cafe dates & zero number sharing in India.",
  keywords: [
    'dating app',
    'dating app india',
    'meet singles nearby',
    'instant dating app',
    'spontaneous dates',
    'radar dating',
    'best dating app 2026',
    'safe dating app',
    'verified singles',
    'online dating',
    'synkin',
    'dating in delhi',
    'singles in bangalore',
    'mumbai dating app',
  ],
  authors: [{ name: 'Synkin Inc.' }],
  creator: 'Synkin Inc.',
  publisher: 'Synkin Inc.',
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
  alternates: {
    canonical: 'https://synkin.in/',
  },
  openGraph: {
    type: 'website',
    url: 'https://synkin.in/',
    siteName: 'Synkin',
    title: 'Synkin — Stop Collecting Pen-Pals. Catch A Real Spark Tonight.',
    description:
      'Discover verified singles within walking distance. 360° Spark Radar, 3-min private video vibe check & daylight date spots.',
    locale: 'en_IN',
    images: [
      {
        url: 'https://synkin.in/images/og_banner.png',
        width: 1200,
        height: 630,
        alt: 'Synkin Real-Time Dating App Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Synkin — Real-Time Dating & Spontaneous Sparks',
    description:
      'Discover verified singles within walking distance. 360° Spark Radar, 3-min private vibe checks & daylight date spots.',
    images: ['https://synkin.in/images/og_banner.png'],
  },
  icons: {
    icon: '/images/logo_emblem.png',
    apple: '/images/logo_emblem.png',
  },
};

const jsonLdData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Synkin',
    url: 'https://synkin.in',
    description:
      'Real-time dating app for spontaneous attraction, 360° spark radar, and verified daylight cafe dates.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://synkin.in/app?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Synkin Inc.',
    url: 'https://synkin.in',
    logo: 'https://synkin.in/images/logo_emblem.png',
    sameAs: [
      'https://twitter.com/SynkinDating',
      'https://instagram.com/SynkinApp',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Synkin Dating',
    operatingSystem: 'Android, Web',
    applicationCategory: 'SocialNetworkingApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1240',
      bestRating: '5',
      worstRating: '1',
    },
    downloadUrl: 'https://synkin.in/download/apk',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Is Synkin free to use for dating in India?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Synkin is free to join, discover singles on the 360° Spark Radar, initiate mutual matches, and conduct 3-minute video vibe checks without paywalls.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the 360° Spark Radar find singles near me?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The 360° Spark Radar uses real-time proximity scanning to discover verified singles within walking distance (500 meters to 5 kilometers), eliminating long-distance matches and ghosting.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I use Synkin directly in my browser without downloading an app?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Synkin features a full-featured progressive Web App accessible directly on any desktop or mobile browser at synkin.in/app, alongside an installable Android APK.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the 3-Minute Video Vibe Check protect against catfishing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Before meeting in person or exchanging numbers, matched singles can launch a timed 3-minute private encrypted video check to verify authentic chemistry and confirm true identity safely.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does Synkin protect female safety and privacy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Synkin enforces zero personal phone number sharing, end-to-end encrypted in-app audio/video calling, mandatory selfie liveness verification, and 1-tap live date itinerary sharing with trusted contacts.',
        },
      },
    ],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {jsonLdData.map((schema, idx) => (
          <script
            key={idx}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </head>
      <body className="min-h-screen bg-[#07050d] text-slate-100 antialiased selection:bg-[#FD3A73] selection:text-white">
        {children}
      </body>
    </html>
  );
}
