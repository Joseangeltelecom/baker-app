'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  brand: string | null;
  unit: string;
  current_price: number;
  store: string | null;
  price_count: number;
}

export default function ProductosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`¿Eliminar "${name}"?`)) {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📦 Catálogo de Productos</h1>
        <Link href="/productos/crear" className="bg-pink-500 text-white px-4 py-2 rounded-lg">
          + Nuevo Producto
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8">⏳ Cargando...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600">No hay productos definidos</p>
          <Link href="/productos/crear" className="text-pink-500 underline">Crear el primero</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((prod) => (
            <div key={prod.id} className="bg-white rounded-lg shadow p-4 border border-gray-100">
              <h3 className="font-semibold text-lg">{prod.name}</h3>
              {prod.brand && <p className="text-sm text-gray-500">Marca: {prod.brand}</p>}
              <p className="text-xl font-bold text-pink-600">${prod.current_price?.toFixed(2)} / {prod.unit}</p>
              {prod.store && <p className="text-xs text-gray-400">🏪 {prod.store}</p>}
              <p className="text-xs text-gray-400">📋 {prod.price_count} precios en historial</p>
              <div className="flex gap-2 mt-3">
                <Link href={`/productos/${prod.id}`} className="text-blue-500 text-sm underline">Editar</Link>
                <button onClick={() => handleDelete(prod.id, prod.name)} className="text-red-500 text-sm">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}