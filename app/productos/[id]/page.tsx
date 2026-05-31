'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function EditProduct() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState('g');
  const [price, setPrice] = useState('');
  const [store, setStore] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setName(data.name);
          setBrand(data.brand || '');
          setUnit(data.unit);
          setPrice(data.current_price?.toString() || '');
          setStore(data.store || '');
          setHistory(data.price_history || []);
        }
      })
      .catch(() => setError('Error al cargar'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, brand, unit, current_price: parseFloat(price), store }),
    });
    if (res.ok) {
      router.push('/productos');
    } else {
      const data = await res.json();
      setError(data.error || 'Error');
    }
    setSaving(false);
  };

  if (loading) return <main className="p-4 text-center">⏳ Cargando...</main>;
  if (error && !name) return <main className="p-4 text-red-500">{error} <Link href="/productos">Volver</Link></main>;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link href="/productos" className="text-pink-500 underline mb-4 inline-block">← Catálogo</Link>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Editar Producto</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* mismos campos que en crear */}
          {/* ... (copiar campos del form de crear) ... */}
          <button type="submit" disabled={saving} className="bg-pink-500 text-white px-4 py-2 rounded w-full">
            {saving ? 'Actualizando...' : 'Actualizar Producto'}
          </button>
        </form>
      </div>

      {/* Historial de precios */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-3">📜 Historial de Precios</h2>
        {history.length === 0 ? (
          <p className="text-gray-500">No hay cambios registrados</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th>Fecha</th>
                <th>Precio</th>
                <th>Tienda</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry: any) => (
                <tr key={entry.id} className="border-b">
                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="font-bold">${entry.price.toFixed(2)}</td>
                  <td>{entry.store || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}