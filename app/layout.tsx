import type { Metadata } from 'next';
import './globals.css';
import { ChurchProvider } from '../lib/context/ChurchContext';
import { AuthGuard } from '../components/auth/AuthGuard';
import { AppLayout } from '../components/layout/AppLayout';

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
          <AuthGuard>
            <AppLayout>
              {children}
            </AppLayout>
          </AuthGuard>
        </ChurchProvider>
      </body>
    </html>
  );
}
