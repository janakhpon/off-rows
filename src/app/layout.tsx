import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { TableProvider } from './contexts/TableContext';

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
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'productivity',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#1E3A8A" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1F2937" media="(prefers-color-scheme: dark)" />
        <meta name="color-scheme" content="light dark" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Offrows" />
        <meta name="application-name" content="Offrows" />
        <meta name="msapplication-TileColor" content="#1E3A8A" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#1E3A8A" />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <TableProvider>
            {children}
          </TableProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
