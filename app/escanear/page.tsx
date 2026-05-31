'use client';

import { useState } from 'react';
import Tesseract from 'tesseract.js';
import { useRouter } from 'next/navigation';

export default function ScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [store, setStore] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const router = useRouter();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const runOCR = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const { data: { text: extracted } } = await Tesseract.recognize(image, 'spa', {
        logger: m => console.log(m),
      });
      setText(extracted);
      // Intentar encontrar un precio en el texto (regex simple)
      const priceMatch = extracted.match(/\d+[.,]\d{2}/);
      if (priceMatch) setPrice(priceMatch[0].replace(',', '.'));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleCreateProduct = async () => {
    if (!productName || !price) return alert('Falta nombre o precio');
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: productName,
        unit: 'unidad', // se puede ajustar manual
        current_price: parseFloat(price),
        store,
      }),
    });
    router.push('/productos');
  };

  return (
    <main className="max-w-lg mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">📸 Escanear Ticket</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-4" />
      {image && (
        <div className="mb-4">
          <img src={image} alt="ticket" className="max-h-64 rounded border" />
          <button onClick={runOCR} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded mt-2">
            {loading ? 'Procesando...' : 'Extraer texto'}
          </button>
        </div>
      )}
      {text && (
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h2 className="font-semibold">Texto extraído:</h2>
          <pre className="text-xs whitespace-pre-wrap">{text}</pre>
        </div>
      )}
      <div className="bg-white rounded shadow p-4 space-y-3">
        <h2 className="font-semibold">Agregar producto manualmente</h2>
        <input type="text" placeholder="Nombre del producto" value={productName} onChange={e => setProductName(e.target.value)} className="border rounded px-3 py-2 w-full" />
        <div className="flex gap-2">
          <input type="number" step="any" placeholder="Precio" value={price} onChange={e => setPrice(e.target.value)} className="border rounded px-3 py-2 flex-1" />
          <input type="text" placeholder="Tienda" value={store} onChange={e => setStore(e.target.value)} className="border rounded px-3 py-2 flex-1" />
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded px-3 py-2 w-full" />
        <button onClick={handleCreateProduct} className="bg-pink-500 text-white px-4 py-2 rounded w-full">Guardar Producto</button>
      </div>
    </main>
  );
}