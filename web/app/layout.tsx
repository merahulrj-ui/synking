import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Synkin — Real-Time Dating, Instant Sparks & Verified Dates',
  description: 'Connect with singles nearby through real-time radar, private 3-min video vibe checks, and verified safe date spots.',
  keywords: ['dating app', 'synkin', 'radar dating', 'verified dates', 'instant sparks'],
  authors: [{ name: 'Synkin Team' }],
  themeColor: '#090a10',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090a10] text-slate-100 antialiased selection:bg-pink-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
