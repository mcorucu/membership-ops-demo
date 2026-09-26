import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Membership Ops',
  description: 'A production-minded membership billing interview sample.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
