'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '../../context/CurrencyContext';

export default function EditProduct() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { symbol } = useCurrency();

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState('g');
  const [packageQty, setPackageQty] = useState('');
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
          setName(data.name || '');
          setBrand(data.brand || '');
          setUnit(data.unit || 'g');
          setPackageQty(data.package_quantity?.toString() || '1');
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
    if (!name || !price || !packageQty) {
      setError('Nombre, precio y cantidad del paquete son obligatorios');
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        brand,
        unit,
        package_quantity: parseFloat(packageQty),
        current_price: parseFloat(price),
        store,
      }),
    });
    if (res.ok) {
      router.push('/productos');
    } else {
      const data = await res.json();
      setError(data.error || 'Error al actualizar');
    }
    setSaving(false);
  };

  if (loading) return <main className="p-4 text-center">⏳ Cargando...</main>;
  if (error && !name) return <main className="p-4 text-red-500">{error} <Link href="/productos">Volver</Link></main>;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link href="/productos" className="text-pink-500 underline mb-4 inline-block">← Volver</Link>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Editar Producto</h1>
        {error && <div className="bg-red-50 text-red-600 p-2 rounded mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Nombre *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="border rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label className="block font-medium">Marca</label>
            <input type="text" value={brand} onChange={e => setBrand(e.target.value)} className="border rounded px-3 py-2 w-full" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-medium">Cantidad del paquete *</label>
              <input type="number" step="any" value={packageQty} onChange={e => setPackageQty(e.target.value)} required className="border rounded px-3 py-2 w-full" />
            </div>
            <div className="w-1/3">
              <label className="block font-medium">Unidad</label>
              <select value={unit} onChange={e => setUnit(e.target.value)} className="border rounded px-3 py-2 w-full">
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="unidad">unidad</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-medium">Precio del paquete ({symbol}) *</label>
            <input type="number" step="any" value={price} onChange={e => setPrice(e.target.value)} required className="border rounded px-3 py-2 w-full" />
          </div>
          <div>
            <label className="block font-medium">Tienda</label>
            <input type="text" value={store} onChange={e => setStore(e.target.value)} className="border rounded px-3 py-2 w-full" />
          </div>
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
                <th className="py-1">Fecha</th>
                <th>Precio</th>
                <th>Tienda</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry: any) => (
                <tr key={entry.id} className="border-b">
                  <td className="py-1">{new Date(entry.date).toLocaleDateString()}</td>
                  <td>{symbol} {entry.price.toFixed(2)}</td>
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