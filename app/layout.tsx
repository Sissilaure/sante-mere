import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kénéya – Suivi Nourrisson & Calendrier Vaccinal Burkina Faso',
  description:
    'Numérisation intelligente des carnets de santé, suivi de croissance, calendrier vaccinal PEV du Burkina Faso et assistant pédiatrique IA.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}