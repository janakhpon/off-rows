'use client';

import { useTheme } from '@/app/contexts/ThemeContext';
import { cn, themeStyles } from '@/lib/utils';
import { ReactNode } from 'react';

interface ThemeAwareProps {
  children: ReactNode;
  variant?: 'card' | 'button' | 'input' | 'text' | 'background';
  className?: string;
}

export function ThemeAware({ children, variant = 'text', className }: ThemeAwareProps) {
  const { theme } = useTheme();
  const styles = themeStyles(theme);

  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return cn(styles.bg.card, styles.border.primary, styles.text.primary);
      case 'button':
        return styles.interactive.button.primary;
      case 'input':
        return cn(styles.interactive.input.base, styles.interactive.input.focus);
      case 'background':
        return styles.bg.primary;
      case 'text':
      default:
        return styles.text.primary;
    }
  };

  return (
    <div className={cn(getVariantClasses(), className)}>
      {children}
    </div>
  );
}

// Convenience components for common patterns
export function ThemeCard({ children, className }: { children: ReactNode; className?: string }) {
  return <ThemeAware variant="card" className={className}>{children}</ThemeAware>;
}

export function ThemeButton({ children, className }: { children: ReactNode; className?: string }) {
  return <ThemeAware variant="button" className={className}>{children}</ThemeAware>;
}

export function ThemeInput({ children, className }: { children: ReactNode; className?: string }) {
  return <ThemeAware variant="input" className={className}>{children}</ThemeAware>;
}

export function ThemeText({ children, className }: { children: ReactNode; className?: string }) {
  return <ThemeAware variant="text" className={className}>{children}</ThemeAware>;
} 