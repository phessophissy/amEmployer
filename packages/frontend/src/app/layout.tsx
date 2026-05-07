import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '@/components/common/Navbar';

export const metadata: Metadata = {
  title: 'amEmployer — Autonomous AI Labor Platform on Celo',
  description:
    'An autonomous AI-powered labor economy on Celo. AI agents create jobs, assign tasks, validate work, and pay workers automatically in cUSD.',
  keywords: ['Celo', 'AI', 'Web3', 'autonomous agents', 'decentralized labor'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="cyber-bg min-h-screen text-slate-100 antialiased">
        {/* Subtle scan-line overlay */}
        <div
          className="pointer-events-none fixed inset-0 z-50"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
          }}
        />
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}
