import type { Metadata } from 'next';
import ClientProviders from '@/components/ClientProviders';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import { inter, firaCode } from '@/lib/fonts';

import './globals.css';
import 'react-data-grid/lib/styles.css';

export const metadata: Metadata = {
  title: 'Offrows - Modern Offline-First Spreadsheet & Database App',
  description: 'Create, manage, and collaborate on spreadsheets and databases offline. A powerful alternative to Airtable and Google Sheets with file uploads, real-time editing, and dark mode support.',
  keywords: ['spreadsheet', 'database', 'offline', 'airtable alternative', 'google sheets alternative', 'project management', 'data management'],
  authors: [{ name: 'Offrows Team' }],
  creator: 'Offrows',
  publisher: 'Offrows',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://off-rows.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://off-rows.vercel.app',
    siteName: 'Offrows',
    title: 'Offrows - Modern Offline-First Spreadsheet & Database App',
    description: 'Create, manage, and collaborate on spreadsheets and databases offline. A powerful alternative to Airtable and Google Sheets with file uploads, real-time editing, and dark mode support.',
    images: [
      {
        url: '/preview.png',
        width: 1200,
        height: 630,
        alt: 'Offrows - Modern Offline-First Spreadsheet Application',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@offrows',
    creator: '@offrows',
    title: 'Offrows - Modern Offline-First Spreadsheet & Database App',
    description: 'Create, manage, and collaborate on spreadsheets and databases offline. A powerful alternative to Airtable and Google Sheets.',
    images: ['/preview.png'],
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
  // verification: {
  //   google: 'your-google-verification-code',
  //   yandex: 'your-yandex-verification-code',
  //   yahoo: 'your-yahoo-verification-code',
  // },
  category: 'productivity',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Offrows',
  },
  applicationName: 'Offrows',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#1E3A8A' },
    ],
  },
  other: {
    'msapplication-TileColor': '#1E3A8A',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`scroll-smooth ${inter.variable} ${firaCode.variable}`}>
      <body className="min-h-screen font-sans antialiased bg-background" suppressHydrationWarning>
        <ServiceWorkerRegistration />
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
