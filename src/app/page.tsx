'use client';

import { useTheme } from './contexts/ThemeContext';
import ClientApp from './components/ClientApp';

export default function Home() {
  const { theme } = useTheme();
  
  return (
    <main 
      className="h-screen"
      style={{
        backgroundColor: theme === 'dark' ? '#0f172a' : '#f9fafb',
        color: theme === 'dark' ? '#f9fafc' : '#111827'
      }}
    >
      <ClientApp />
    </main>
  );
}
