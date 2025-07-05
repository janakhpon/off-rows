'use client';

import { useEffect, useState, Suspense } from 'react';
import { ThemeProvider } from '@/app/contexts/ThemeContext';
import { TableProvider } from '@/app/contexts/TableContext';
import { ErrorBoundary, OfflineIndicator } from '@/components';

interface ClientProvidersProps {
  children: React.ReactNode;
}

// Static loading component
function StaticLoading() {
  return (
    <div className="min-h-screen font-sans antialiased bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Initializing...</p>
      </div>
    </div>
  );
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR and initial hydration, render a static loading state
  // to prevent hydration mismatch and ensure SSG compatibility
  if (!mounted) {
    return <StaticLoading />;
  }

  // After mounting, render with full client-side providers
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TableProvider>
          <OfflineIndicator />
          <Suspense fallback={<StaticLoading />}>{children}</Suspense>
        </TableProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
