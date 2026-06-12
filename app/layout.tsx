import type { Metadata } from 'next';
import { CurrencyProvider } from './context/CurrencyContext';
import SessionProvider from './components/SessionProvider';
import HeaderNav from './components/HeaderNav';
import AuthNav from './components/AuthNav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Delicias da Julieta - Escalador de Ingredientes',
  description: 'Ajusta las cantidades de tus recetas de repostería automáticamente',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-orange-50 min-h-screen">
        <SessionProvider>
          <CurrencyProvider>
            <header className="bg-pink-500 text-white py-4 shadow-md">
              <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">🧁 Delicias da Julieta</h1>
                    <p className="text-pink-100 text-sm mt-1">
                      Escala tus recetas favoritas fácilmente
                    </p>
                  </div>
                  <AuthNav />
                </div>
                <HeaderNav />
              </div>
            </header>
            {children}
            <footer className="text-center py-4 text-gray-500 text-sm">
              Hecho con ❤️ para la mejor repostera
            </footer>
          </CurrencyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}