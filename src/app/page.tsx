'use client';

import { useTheme } from './contexts/ThemeContext';
import ClientApp from './components/ClientApp';
import { cn } from '@/lib/utils';

export default function Home() {
  const { theme } = useTheme();
  
  return (
    <main
      className={cn(
        "h-screen",
        theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      )}
    >
      <ClientApp />
    </main>
  );
}
