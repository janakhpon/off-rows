import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { TableProvider } from './contexts/TableContext';

export const metadata: Metadata = {
  title: 'Offrows - Offline Spreadsheet',
  description: 'A modern, offline-first spreadsheet application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ThemeProvider>
          <TableProvider>
            {children}
          </TableProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
