'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/app/contexts/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/20 rounded-lg transition-colors duration-200 cursor-pointer focus-ring"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode (Current: ${theme})`}
      type="button"
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
