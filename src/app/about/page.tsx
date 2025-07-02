'use client';

import { useTheme } from '../contexts/ThemeContext';
import { cn } from '@/lib/utils';

export default function About() {
  const { theme } = useTheme();

  return (
    <main
      className={cn(
        "flex flex-col justify-center items-center px-4 h-screen",
        theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
      )}
    >
      <h1 className="mb-4 text-4xl font-bold">About Off-Rows</h1>
      <p className="max-w-2xl text-lg text-center">
        Off-Rows is an <span className="font-semibold">open-source, offline-first data platform</span> designed to empower rural areas or regions with limited internet connectivity. Our mission is to enable seamless data collection for health, relief efforts, and other critical matters, even when internet access is unavailable. All data is stored locally and synchronized when a connection is available, ensuring no information is lost and communities can operate efficiently in challenging environments.
      </p>
      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">This project is community-driven and welcomes contributions.</p>
    </main>
  );
} 