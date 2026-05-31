'use client';

import { useCurrency } from '../context/CurrencyContext';
import { useRouter } from 'next/navigation';

export default function ConfigPage() {
  const { currency, setCurrency, symbol } = useCurrency();
  const router = useRouter();

  return (
    <main className="max-w-md mx-auto p-4 mt-6 bg-white rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold mb-4">⚙️ Configuración</h1>
      <label className="block font-medium mb-2">Moneda principal:</label>
      <select
        value={currency}
        onChange={(e) => {
          setCurrency(e.target.value as any);
          router.refresh();
        }}
        className="border-2 border-gray-200 rounded px-3 py-2 w-full"
      >
        <option value="USD">Dólar estadounidense ($)</option>
        <option value="PEN">Sol peruano (S/)</option>
        <option value="BRL">Real brasileño (R$)</option>
      </select>
      <p className="text-sm text-gray-500 mt-4">
        Todos los precios se mostrarán en esta moneda.
      </p>
    </main>
  );
}