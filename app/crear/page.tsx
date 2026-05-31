'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '../context/CurrencyContext';

interface IngredientRow {
  name: string;
  quantity: string;
  unit: string;
  productId?: number | null;
}

export default function CreateRecipe() {
  const { symbol } = useCurrency();
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { name: '', quantity: '', unit: 'g', productId: null },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [catalog, setCatalog] = useState<any[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setCatalog(data);
        setCatalogLoaded(true);
      })
      .catch(console.error);
  }, []);

  const addRow = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: 'g', productId: null }]);
  };

  const updateRow = (index: number, field: keyof IngredientRow, value: string | number | null) => {
    const updated = [...ingredients];
    (updated[index] as any)[field] = value;
    setIngredients(updated);
  };

  const removeRow = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const id = productId ? parseInt(productId) : null;
    const updated = [...ingredients];
    updated[index].productId = id;
    if (id) {
      const product = catalog.find(p => p.id === id);
      if (product) {
        updated[index].name = product.name;
        updated[index].unit = product.unit;
      }
    }
    setIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('El nombre de la receta es obligatorio'); return; }
    const validIngredients = ingredients.filter(ing => ing.name.trim() !== '');
    if (validIngredients.length === 0) { setError('Debes agregar al menos un ingrediente'); return; }
    for (const ing of validIngredients) {
      if (!ing.quantity || parseFloat(ing.quantity) <= 0) {
        setError(`La cantidad de "${ing.name}" debe ser un número mayor a 0`); return;
      }
    }
    setSaving(true);
    try {
      const parsedIngredients = validIngredients.map(ing => ({
        name: ing.name.trim(),
        quantity: parseFloat(ing.quantity),
        unit: ing.unit,
        product_id: ing.productId ?? null,
      }));
      const res = await fetch('/api/recetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), ingredients: parsedIngredients }),
      });
      if (res.ok) {
        router.push('/'); router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al guardar la receta');
      }
    } catch (error) { setError('Error de conexión al guardar'); }
    finally { setSaving(false); }
  };

  // Obtener marca de un producto por su id
  const getProductBrand = (productId: number | null | undefined) => {
    if (!productId) return null;
    const product = catalog.find(p => p.id === productId);
    return product?.brand || null;
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link href="/" className="text-pink-500 hover:text-pink-700 underline mb-4 inline-flex items-center gap-1">
        ← Volver a recetas
      </Link>
      <div className="bg-white rounded-lg shadow-lg p-6 border border-pink-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Crear Nueva Receta</h1>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">Nombre de la receta *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Tarta de manzana" required
              className="border-2 border-gray-200 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-pink-500 transition-colors" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-700">Ingredientes</h2>
              <button type="button" onClick={addRow} className="text-pink-500 hover:text-pink-700 text-sm font-medium">
                + Agregar ingrediente
              </button>
            </div>

            <div className="space-y-3">
              {ingredients.map((ing, idx) => {
                const brand = getProductBrand(ing.productId);
                return (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                    {/* Dropdown del catálogo */}
                    <select
                      value={ing.productId ?? ''}
                      onChange={e => handleProductSelect(idx, e.target.value)}
                      className="border-2 border-gray-200 rounded px-3 py-2 w-full text-sm bg-white focus:outline-none focus:border-pink-500"
                      disabled={!catalogLoaded}
                    >
                      <option value="">-- Elegir del catálogo (opcional) --</option>
                      {catalog.map(prod => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} {prod.brand ? `(${prod.brand})` : ''} – {symbol}{prod.current_price} / {prod.package_quantity} {prod.unit}
                        </option>
                      ))}
                    </select>

                    {/* Campos de ingrediente (responsive) */}
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_130px_auto] gap-2 items-start">
                      {/* Nombre y marca */}
                      <div className="col-span-1 sm:col-span-1">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Nombre del ingrediente"
                            value={ing.name}
                            onChange={e => updateRow(idx, 'name', e.target.value)}
                            required
                            className="border-2 border-gray-200 rounded px-3 py-2 w-full focus:outline-none focus:border-pink-500"
                          />
                          {brand && (
                            <span className="absolute -bottom-5 left-0 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                              {brand}
                            </span>
                          )}
                        </div>
                        {/* Espacio extra en móvil si hay marca */}
                        {brand && <div className="h-5 sm:h-0"></div>}
                      </div>

                      {/* Cantidad */}
                      <div className="w-full">
                        <input
                          type="number" step="any" placeholder="Cantidad"
                          value={ing.quantity} onChange={e => updateRow(idx, 'quantity', e.target.value)} required
                          className="border-2 border-gray-200 rounded px-3 py-2 w-full focus:outline-none focus:border-pink-500" />
                      </div>

                      {/* Unidad */}
                      <select
                        value={ing.unit} onChange={e => updateRow(idx, 'unit', e.target.value)}
                        className="border-2 border-gray-200 rounded px-2 py-2 w-full text-sm bg-white focus:outline-none focus:border-pink-500"
                      >
                        <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option>
                        <option value="l">l</option><option value="unidades">unidades</option>
                        <option value="cucharadas">cucharadas</option>
                        <option value="cucharaditas">cucharaditas</option>
                        <option value="tazas">tazas</option><option value="pellizco">pellizco</option>
                      </select>

                      {/* Botón eliminar */}
                      <button type="button" onClick={() => removeRow(idx)}
                        className="text-red-400 hover:text-red-600 text-xl leading-none p-1 self-center justify-self-end"
                        disabled={ingredients.length === 1} title="Eliminar ingrediente">
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={saving}
              className="flex-1 bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? '⏳ Guardando...' : '💾 Guardar Receta'}
            </button>
            <Link href="/" className="px-6 py-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}