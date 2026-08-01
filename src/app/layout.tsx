import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Attendance Master | Premium HR OS',
  description: 'Premium workforce dashboard for attendance, payroll, and team operations.',
  keywords: ['attendance', 'hr os', 'workforce', 'payroll', 'dashboard', 'employee management'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div id="__next">{children}</div>
      </body>
    </html>
  );
}
