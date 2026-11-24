import type { Metadata, Viewport } from 'next';
import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'AMBÚILA DATA – Portal Municipal de Dados e Inteligência Territorial',
  description:
    'Plataforma oficial de dados abertos e inteligência territorial da Administração Municipal de Ambuíla, Província do Uíge, Angola.',
};

export const viewport: Viewport = { themeColor: '#0F3D26', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-AO">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Source+Serif+4:ital,wght@1,400;1,600&display=swap"
          rel="stylesheet"
        />
        <noscript><style>{'.reveal{opacity:1!important;transform:none!important}'}</style></noscript>
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
