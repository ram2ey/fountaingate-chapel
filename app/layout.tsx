import type { Metadata } from 'next';
import './globals.css';
import { ChurchProvider } from '../lib/context/ChurchContext';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';

export const metadata: Metadata = {
  title: 'Fountain Gate Chapel - Mobile Management System',
  description: 'Mobile-first Church Management System for Fountain Gate Chapel featuring Pastoral Care, Member Directory, Sermon Hub, WhatsApp/SMS Communication, and Financial Ledger.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-indigo-600 selection:text-white">
        <ChurchProvider>
          <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
              <Header />
              <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        </ChurchProvider>
      </body>
    </html>
  );
}
