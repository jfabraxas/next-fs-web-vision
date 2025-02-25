import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Theme } from '@radix-ui/themes';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from '@/components/ErrorFallback';
import { Navigation } from '@/components/ui/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next.js PWA',
  description: 'A modern Progressive Web Application built with Next.js',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Theme appearance="light" accentColor="blue" radius="medium">
            <Navigation />
            <main className="pl-16">{children}</main>
            <Toaster />
          </Theme>
        </ErrorBoundary>
      </body>
    </html>
  );
}
