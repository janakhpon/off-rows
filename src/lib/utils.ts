import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function themeStyles(theme: 'light' | 'dark') {
  return {
    // Background colors
    bg: {
      primary: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
      secondary: theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50',
      tertiary: theme === 'dark' ? 'bg-gray-600' : 'bg-gray-100',
      card: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
      modal: theme === 'dark' ? 'bg-gray-900' : 'bg-white',
      sidebar: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
      header: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
      toolbar: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
      dropdown: theme === 'dark' ? 'bg-gray-700' : 'bg-white',
      input: theme === 'dark' ? 'bg-gray-700' : 'bg-white',
      hover: theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50',
      hoverLight: theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-100',
    },
    // Text colors
    text: {
      primary: theme === 'dark' ? 'text-gray-100' : 'text-gray-900',
      secondary: theme === 'dark' ? 'text-gray-300' : 'text-gray-700',
      tertiary: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
      muted: theme === 'dark' ? 'text-gray-500' : 'text-gray-400',
      placeholder: theme === 'dark' ? 'text-gray-500' : 'text-gray-400',
      link: theme === 'dark' ? 'text-blue-400' : 'text-blue-600',
      success: theme === 'dark' ? 'text-green-400' : 'text-green-600',
      warning: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
      error: theme === 'dark' ? 'text-red-400' : 'text-red-600',
    },
    // Border colors
    border: {
      primary: theme === 'dark' ? 'border-gray-600' : 'border-gray-200',
      secondary: theme === 'dark' ? 'border-gray-700' : 'border-gray-300',
      focus: theme === 'dark' ? 'border-blue-400' : 'border-blue-500',
    },
    // Interactive states
    interactive: {
      button: {
        primary:
          theme === 'dark'
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white',
        secondary:
          theme === 'dark'
            ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        danger:
          theme === 'dark'
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-red-600 hover:bg-red-700 text-white',
      },
      input: {
        base:
          theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500'
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
        focus:
          theme === 'dark'
            ? 'focus:border-blue-400 focus:ring-blue-400'
            : 'focus:border-blue-500 focus:ring-blue-500',
      },
      dropdown: {
        base:
          theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-gray-100'
            : 'bg-white border-gray-300 text-gray-900',
        item:
          theme === 'dark' ? 'hover:bg-gray-600 text-gray-100' : 'hover:bg-gray-50 text-gray-700',
      },
    },
    // Form elements
    form: {
      checkbox: {
        base:
          theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-blue-400'
            : 'bg-white border-gray-300 text-blue-600',
        checked: theme === 'dark' ? 'bg-blue-600 border-blue-600' : 'bg-blue-600 border-blue-600',
      },
      radio: {
        base:
          theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-blue-400'
            : 'bg-white border-gray-300 text-blue-600',
        checked: theme === 'dark' ? 'bg-blue-600 border-blue-600' : 'bg-blue-600 border-blue-600',
      },
      select: {
        base:
          theme === 'dark'
            ? 'bg-gray-700 border-gray-600 text-gray-100'
            : 'bg-white border-gray-300 text-gray-900',
        option: theme === 'dark' ? 'bg-gray-700 text-gray-100' : 'bg-white text-gray-900',
      },
    },
    // Status indicators
    status: {
      success:
        theme === 'dark'
          ? 'bg-green-900 text-green-400 border-green-700'
          : 'bg-green-100 text-green-800 border-green-200',
      warning:
        theme === 'dark'
          ? 'bg-yellow-900 text-yellow-400 border-yellow-700'
          : 'bg-yellow-100 text-yellow-800 border-yellow-200',
      error:
        theme === 'dark'
          ? 'bg-red-900 text-red-400 border-red-700'
          : 'bg-red-100 text-red-800 border-red-200',
      info:
        theme === 'dark'
          ? 'bg-blue-900 text-blue-400 border-blue-700'
          : 'bg-blue-100 text-blue-800 border-blue-200',
    },
  };
}

// Checkbox utility for consistent styling
export function getCheckboxClasses() {
  return {
    base: 'w-4 h-4 cursor-pointer',
    light:
      'bg-white border-gray-300 hover:border-blue-500 checked:bg-blue-500 checked:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    dark: 'bg-gray-700 border-gray-500 hover:border-blue-500 checked:bg-blue-500 checked:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  };
}

// Convenience function for common patterns
export function themeClass(theme: 'light' | 'dark', pattern: string) {
  const styles = themeStyles(theme);

  switch (pattern) {
    case 'card':
      return cn(styles.bg.card, styles.border.primary, styles.text.primary);
    case 'button-primary':
      return styles.interactive.button.primary;
    case 'button-secondary':
      return styles.interactive.button.secondary;
    case 'input':
      return cn(styles.interactive.input.base, styles.interactive.input.focus);
    case 'dropdown':
      return cn(styles.interactive.dropdown.base, styles.interactive.input.focus);
    case 'text-primary':
      return styles.text.primary;
    case 'text-secondary':
      return styles.text.secondary;
    case 'text-muted':
      return styles.text.muted;
    case 'bg-primary':
      return styles.bg.primary;
    case 'bg-secondary':
      return styles.bg.secondary;
    case 'border-primary':
      return styles.border.primary;
    case 'hover':
      return styles.bg.hover;
    case 'checkbox':
      const checkboxClasses = getCheckboxClasses();
      return cn(
        checkboxClasses.base,
        theme === 'dark' ? checkboxClasses.dark : checkboxClasses.light,
      );
    default:
      return '';
  }
}
