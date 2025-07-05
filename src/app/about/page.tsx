import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About - Offrows',
  description: 'Learn more about Offrows, the modern offline-first spreadsheet and database application.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">About Offrows</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Modern Offline-First Spreadsheet & Database App
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Offline-First</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Work seamlessly without an internet connection. All your data is stored locally and syncs when you&apos;re back online.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Modern Interface</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Clean, intuitive design with dark mode support and responsive layout for all devices.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">File Support</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Upload and manage files, images, and documents directly in your spreadsheets and databases.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Real-time Editing</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Collaborate with your team in real-time with instant updates and conflict resolution.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm">
          <h2 className="text-3xl font-semibold mb-6 text-center">Why Choose Offrows?</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
              <div>
                <h3 className="font-semibold">Privacy First</h3>
                <p className="text-gray-600 dark:text-gray-400">Your data stays on your device. No cloud storage required.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
              <div>
                <h3 className="font-semibold">Always Available</h3>
                <p className="text-gray-600 dark:text-gray-400">Work anywhere, anytime, even without internet access.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
              <div>
                <h3 className="font-semibold">Powerful Features</h3>
                <p className="text-gray-600 dark:text-gray-400">Advanced filtering, sorting, and data manipulation capabilities.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
              <div>
                <h3 className="font-semibold">Open Source</h3>
                <p className="text-gray-600 dark:text-gray-400">Transparent, customizable, and community-driven development.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
} 