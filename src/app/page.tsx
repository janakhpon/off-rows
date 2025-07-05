import { StaticLoader, ClientApp } from '@/components';

// Static loading component for SSG
function LoadingApp() {
  return (
    <div className="flex justify-center items-center h-screen text-gray-900 bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <div className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full border-b-2 border-blue-600 animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading Offrows...</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="h-screen text-gray-900 bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      <StaticLoader fallback={<LoadingApp />}>
        <ClientApp />
      </StaticLoader>
    </main>
  );
}
