import type { Metadata } from 'next';
import './globals.css';
import { ChurchProvider } from '../lib/context/ChurchContext';
import { AppLayout } from '../components/layout/AppLayout';
import { currentSession } from '../lib/server/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Fountain Gate Chapel - Mobile Management System',
  description: 'Mobile-first Church Management System for Fountain Gate Chapel featuring Pastoral Care, Member Directory, Sermon Hub, WhatsApp/SMS Communication, and Financial Ledger.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user=null;
  try { user=await currentSession(); } catch { /* Missing services deny protected content. */ }
  const pathname=(await headers()).get('x-fgc-path');
  if(!user&&!['/login','/guest-intake','/kiosk'].includes(pathname||''))redirect('/login');
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased selection:bg-indigo-600 selection:text-white">
        <ChurchProvider initialUser={user}>
            <AppLayout>
              {children}
            </AppLayout>
        </ChurchProvider>
      </body>
    </html>
  );
}
