import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Lyrics Studio',
  description: 'Lyrics Video Editor + Renderer + MP4 Exporter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className={`${inter.variable} dark`}>
      <body className="bg-base-950 text-neutral-100 antialiased">{children}</body>
    </html>
  );
}
