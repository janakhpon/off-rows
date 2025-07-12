'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/app/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-2 rounded-lg transition-all duration-200 cursor-pointer focus-ring hover:scale-105',
        'text-gray-500 hover:text-blue-600 hover:bg-blue-50/80',
        'dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/20',
        'hover:shadow-sm',
      )}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode (Current: ${theme})`}
      type="button"
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 transition-all duration-200 hover:rotate-12" />
      ) : (
        <Sun className="h-4 w-4 transition-all duration-200 hover:rotate-12" />
      )}
    </button>
  );
}
