import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/common/Navbar';
import { WalletProvider } from '@/components/common/WalletProvider';
import { MobileNav } from '@/components/common/MobileNav';

export const metadata: Metadata = {
  title: 'amEmployer — Autonomous AI Labor Platform on Celo',
  description: 'Deploy AI agents, post tasks, and pay instantly with cUSD on Celo.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'amEmployer' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="cyber-bg min-h-screen text-slate-100 antialiased">
        <WalletProvider>
          <Navbar />
          <MobileNav />
          <main className="pt-14 pb-16 lg:pb-0">{children}</main>
        </WalletProvider>
      </body>
    </html>
  );
}
