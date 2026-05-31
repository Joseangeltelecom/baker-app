'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '../context/CurrencyContext';

export default function EscanearPage() {
  const { symbol } = useCurrency();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    brand: '',
    price: '',
    package_quantity: '',
    unit: 'g',
    store: '',
  });

  // Manejar selección de imagen (galería o cámara)
  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]; // quitar el prefijo data:image/...
      setImage(reader.result as string);
      analyzeImage(base64);
    };
    reader.readAsDataURL(file);
  };

const analyzeImage = async (base64Data: string) => {
  setAnalyzing(true);
  setError('');
  try {
    const res = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data }),
    });
    const data = await res.json();
    if (data.error) {
      // Mostrar mensaje detallado
      setError(`Error: ${data.error}${data.details ? ' (ver consola)' : ''}`);
      console.log('Detalles del error:', data.details || data.raw_text || data);
    } else {
      setForm({
        name: data.name || '',
        brand: data.brand || '',
        price: data.price ? data.price.toString() : '',
        package_quantity: data.package_quantity ? data.package_quantity.toString() : '',
        unit: data.unit || 'g',
        store: data.store || '',
      });
    }
  } catch (err) {
    setError('Error de conexión al analizar');
  } finally {
    setAnalyzing(false);
  }
};

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      setError('Nombre y precio son obligatorios');
      return;
    }
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        brand: form.brand,
        unit: form.unit,
        package_quantity: form.package_quantity ? parseFloat(form.package_quantity) : 1,
        current_price: parseFloat(form.price),
        store: form.store,
      }),
    });
    if (res.ok) {
      router.push('/productos');
    } else {
      const err = await res.json();
      setError(err.error || 'Error al guardar');
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link href="/productos" className="text-pink-500 underline mb-4 inline-block">← Volver a productos</Link>

      <div className="bg-white rounded-lg shadow-lg p-6 border border-pink-100">
        <h1 className="text-2xl font-bold mb-4">📸 Escanear Producto</h1>

        {/* Opciones de imagen */}
        {!image && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 bg-pink-500 text-white px-4 py-3 rounded-lg hover:bg-pink-600 transition-colors flex items-center justify-center gap-2"
            >
              📷 Tomar foto
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={cameraInputRef}
                onChange={handleImageSelected}
                className="hidden"
              />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
            >
              🖼️ Subir imagen
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageSelected}
                className="hidden"
              />
            </button>
          </div>
        )}

        {/* Imagen y análisis */}
        {image && (
          <div className="mb-6">
            <img
              src={image}
              alt="Producto escaneado"
              className="w-full max-h-64 object-contain rounded border mx-auto"
            />
            {analyzing && (
              <div className="text-center mt-4">
                <div className="animate-spin text-4xl">⏳</div>
                <p className="text-sm text-gray-500">Analizando imagen...</p>
              </div>
            )}
            <button
              onClick={() => {
                setImage(null);
                setForm({ name: '', brand: '', price: '', package_quantity: '', unit: 'g', store: '' });
                setError('');
              }}
              className="mt-2 text-sm text-gray-500 underline"
            >
              Cambiar imagen
            </button>
          </div>
        )}

        {/* Formulario con datos extraídos */}
        {!analyzing && (form.name || form.price) && (
          <form onSubmit={handleSave} className="space-y-4">
            <h2 className="text-lg font-semibold">Verificar datos extraídos</h2>
            {error && <div className="bg-red-50 text-red-600 p-2 rounded">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium">Nombre</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                  className="border rounded px-3 py-2 w-full" />
              </div>
              <div>
                <label className="block font-medium">Marca</label>
                <input type="text" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}
                  className="border rounded px-3 py-2 w-full" />
              </div>
              <div>
                <label className="block font-medium">Precio ({symbol})</label>
                <input type="number" step="any" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required
                  className="border rounded px-3 py-2 w-full" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block font-medium">Cant. paquete</label>
                  <input type="number" step="any" value={form.package_quantity} onChange={e => setForm({ ...form, package_quantity: e.target.value })}
                    className="border rounded px-3 py-2 w-full" />
                </div>
                <div className="w-1/3">
                  <label className="block font-medium">Unidad</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="border rounded px-2 py-2 w-full">
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
                <input type="text" value={form.store} onChange={e => setForm({ ...form, store: e.target.value })}
                  className="border rounded px-3 py-2 w-full" />
              </div>
            </div>

            <button type="submit" className="bg-pink-500 text-white px-6 py-2 rounded w-full sm:w-auto">
              Guardar Producto
            </button>
          </form>
        )}
      </div>
    </main>
  );
}