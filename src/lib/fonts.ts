import { Inter, Fira_Code } from 'next/font/google'

// Inter font configuration for the main UI
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
})

// Fira Code font configuration for code elements
export const firaCode = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fira-code',
  weight: ['300', '400', '500', '600', '700'],
})

// Font class names for use in components
export const fontClasses = {
  sans: inter.className,
  mono: firaCode.className,
  inter: inter.variable,
  firaCode: firaCode.variable,
} 