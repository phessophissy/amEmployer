import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastContainer } from "@/components/ui/Toast";
import { Navbar } from '@/components/common/Navbar';
import { WalletProvider } from '@/components/common/WalletProvider';
import { MobileNav } from '@/components/common/MobileNav';
import { WrongNetworkBanner } from '@/components/common/WrongNetworkBanner';

export const metadata: Metadata = {
  title: 'amEmployer — Autonomous AI Labor Platform on Celo',
  description: 'Deploy AI agents, post tasks, and pay instantly with cUSD on Celo.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'amEmployer' },
  other: {
    'talentapp:project_verification': '0a684318c65052963acfb3b592b9e6e9053773cb40cbe61bb05d8ac40c4e1366cce8ca14bc454f762f3921f3fbc7fd5ea3c50f9255f664bc9e06b33834e80605',
  },
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
          <WrongNetworkBanner />
          <MobileNav />
          <main className="pt-14 lg:pb-0" style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}>{children}</main>
          <ToastContainer />
        </WalletProvider>
      </body>
    </html>
  );
}
// PWA manifest link added via next/head
