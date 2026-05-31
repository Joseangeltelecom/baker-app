'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateProduct() {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState('g');
  const [price, setPrice] = useState('');
  const [store, setStore] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) {
      setError('Nombre y precio son obligatorios');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, brand, unit, current_price: parseFloat(price), store }),
    });
    if (res.ok) {
      router.push('/productos');
    } else {
      const data = await res.json();
      setError(data.error || 'Error al guardar');
    }
    setSaving(false);
  };

  return (
    <main className="max-w-lg mx-auto p-4">
      <Link href="/productos" className="text-pink-500 underline mb-4 inline-block">← Volver</Link>
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Nuevo Producto</h1>
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
              <label className="block font-medium">Precio *</label>
              <input type="number" step="any" value={price} onChange={e => setPrice(e.target.value)} required className="border rounded px-3 py-2 w-full" />
            </div>
            <div className="w-1/3">
              <label className="block font-medium">Unidad *</label>
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
            <label className="block font-medium">Tienda</label>
            <input type="text" value={store} onChange={e => setStore(e.target.value)} className="border rounded px-3 py-2 w-full" />
          </div>
          <button type="submit" disabled={saving} className="bg-pink-500 text-white px-4 py-2 rounded w-full">
            {saving ? 'Guardando...' : 'Crear Producto'}
          </button>
        </form>
      </div>
    </main>
  );
}