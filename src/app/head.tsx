export default function Head() {
  return (
    <>
      <title>Offrows - Modern Offline-First Spreadsheet & Database App</title>
      <meta name="description" content="Create, manage, and collaborate on spreadsheets and databases offline. A powerful alternative to Airtable and Google Sheets with file uploads, real-time editing, and dark mode support." />
      <meta name="keywords" content="spreadsheet, database, offline, airtable alternative, google sheets alternative, project management, data management" />
      <meta name="author" content="Offrows Team" />
      <meta name="robots" content="index, follow" />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:url" content="https://off-rows.vercel.app" />
      <meta property="og:site_name" content="Offrows" />
      <meta property="og:title" content="Offrows - Modern Offline-First Spreadsheet & Database App" />
      <meta property="og:description" content="Create, manage, and collaborate on spreadsheets and databases offline. A powerful alternative to Airtable and Google Sheets with file uploads, real-time editing, and dark mode support." />
      <meta property="og:image" content="https://off-rows.vercel.app/preview.png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="Offrows - Modern Offline-First Spreadsheet Application" />
      <meta property="og:image:type" content="image/png" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@offrows" />
      <meta name="twitter:creator" content="@offrows" />
      <meta name="twitter:title" content="Offrows - Modern Offline-First Spreadsheet & Database App" />
      <meta name="twitter:description" content="Create, manage, and collaborate on spreadsheets and databases offline. A powerful alternative to Airtable and Google Sheets." />
      <meta name="twitter:image" content="https://off-rows.vercel.app/preview.png" />
      <meta name="twitter:image:alt" content="Offrows - Modern Offline-First Spreadsheet Application" />
      
      {/* PWA Meta Tags */}
      <meta name="application-name" content="Offrows" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Offrows" />
      <meta name="format-detection" content="telephone=no" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      <meta name="msapplication-TileColor" content="#1E3A8A" />
      <meta name="msapplication-tap-highlight" content="no" />
      
      {/* Theme Colors */}
      <meta name="theme-color" content="#1E3A8A" media="(prefers-color-scheme: light)" />
      <meta name="theme-color" content="#1F2937" media="(prefers-color-scheme: dark)" />
      <meta name="color-scheme" content="light dark" />
      
      {/* Viewport */}
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      
      {/* Icons */}
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#1E3A8A" />
      <link rel="shortcut icon" href="/favicon.ico" />
      
      {/* Canonical */}
      <link rel="canonical" href="https://off-rows.vercel.app" />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      
      {/* Preconnect */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </>
  );
} 