import type { Metadata } from 'next';
import Link from 'next/link';
import { CurrencyProvider } from './context/CurrencyContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Delicias da Julieta - Escalador de Ingredientes',
  description: 'Ajusta las cantidades de tus recetas de repostería automáticamente',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-orange-50 min-h-screen">
        <CurrencyProvider>
          <header className="bg-pink-500 text-white py-4 shadow-md">
            <div className="max-w-4xl mx-auto px-4">
              <h1 className="text-2xl font-bold text-center">🧁 Delicias da Julieta</h1>
              <p className="text-center text-pink-100 text-sm mt-1">
                Escala tus recetas favoritas fácilmente
              </p>
              <nav className="flex justify-center gap-6 mt-3 text-sm font-medium">
                <Link href="/" className="hover:text-yellow-200 transition-colors">🍰 Recetas</Link>
                <Link href="/productos" className="hover:text-yellow-200 transition-colors">📦 Productos</Link>
                {/* <Link href="/escanear" className="hover:text-yellow-200 transition-colors">📸 Escanear</Link> */}
                <Link href="/configuracion" className="hover:text-yellow-200 transition-colors">⚙️ Moneda</Link>
              </nav>
            </div>
          </header>
          {children}
          <footer className="text-center py-4 text-gray-500 text-sm">
            Hecho con ❤️ para la mejor repostera
          </footer>
        </CurrencyProvider>
      </body>
    </html>
  );
}