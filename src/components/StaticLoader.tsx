import { Suspense } from 'react';

interface StaticLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

// Default static loading component
function DefaultStaticLoader() {
  return (
    <div className="min-h-screen font-sans antialiased bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

export default function StaticLoader({ children, fallback }: StaticLoaderProps) {
  return <Suspense fallback={fallback || <DefaultStaticLoader />}>{children}</Suspense>;
}
