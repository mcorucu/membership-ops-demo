import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Membership Ops',
  description: 'A production-minded membership billing interview sample.',
  icons: { icon: '/favicon.ico' }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
