'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '../../context/CurrencyContext';

interface IngredientRow {
  name: string;
  quantity: string;
  unit: string;
  productId?: number | null;
}

export default function EditRecipe() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { symbol } = useCurrency();

  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Catálogo de productos
  const [catalog, setCatalog] = useState<any[]>([]);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  // Cargar catálogo
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setCatalog(data);
        setCatalogLoaded(true);
      })
      .catch(console.error);
  }, []);

  // Cargar datos de la receta
  useEffect(() => {
    fetch(`/api/recetas/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setName(data.name);
          const ings = data.ingredients.map((ing: any) => ({
            name: ing.name,
            quantity: ing.quantity.toString(),
            unit: ing.unit,
            productId: ing.product_id ?? null,
          }));
          setIngredients(ings.length > 0 ? ings : [{ name: '', quantity: '', unit: 'g', productId: null }]);
        }
      })
      .catch(() => setError('Error al cargar la receta'))
      .finally(() => setLoading(false));
  }, [id]);

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

  // Manejar selección de producto del catálogo
  const handleProductSelect = (index: number, productId: string) => {
    const pid = productId ? parseInt(productId) : null;
    const updated = [...ingredients];
    updated[index].productId = pid;

    if (pid) {
      const product = catalog.find(p => p.id === pid);
      if (product) {
        updated[index].name = product.name;
        updated[index].unit = product.unit; // unidad del producto
      }
    }
    setIngredients(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre de la receta es obligatorio');
      return;
    }

    const validIngredients = ingredients.filter(ing => ing.name.trim() !== '');
    if (validIngredients.length === 0) {
      setError('Debes agregar al menos un ingrediente');
      return;
    }

    for (const ing of validIngredients) {
      if (!ing.quantity || parseFloat(ing.quantity) <= 0) {
        setError(`La cantidad de "${ing.name}" debe ser un número mayor a 0`);
        return;
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

      const res = await fetch(`/api/recetas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), ingredients: parsedIngredients }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al actualizar la receta');
      }
    } catch (error) {
      setError('Error de conexión al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto p-4 text-center">
        <div className="animate-spin text-4xl">⏳</div>
        <p>Cargando receta...</p>
      </main>
    );
  }

  if (error && !name) {
    return (
      <main className="max-w-2xl mx-auto p-4 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <Link href="/" className="text-pink-500 underline mt-4 inline-block">
          Volver al inicio
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link
        href="/"
        className="text-pink-500 hover:text-pink-700 underline mb-4 inline-flex items-center gap-1"
      >
        ← Volver a recetas
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-6 border border-pink-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Editar Receta</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Nombre de la receta *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Tarta de manzana"
              required
              className="border-2 border-gray-200 rounded-lg px-4 py-2 w-full focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-gray-700">Ingredientes</h2>
              <button
                type="button"
                onClick={addRow}
                className="text-pink-500 hover:text-pink-700 text-sm font-medium"
              >
                + Agregar ingrediente
              </button>
            </div>

            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-2">
                  {/* Dropdown del catálogo (mejorado) */}
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

                  {/* Fila con nombre, cantidad, unidad y botón de quitar */}
                  <div className="flex gap-2 items-start">
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="Nombre del ingrediente"
                        value={ing.name}
                        onChange={e => updateRow(idx, 'name', e.target.value)}
                        required
                        className="border-2 border-gray-200 rounded px-3 py-2 w-full focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <div className="w-28">
                      <input
                        type="number"
                        step="any"
                        placeholder="Cantidad"
                        value={ing.quantity}
                        onChange={e => updateRow(idx, 'quantity', e.target.value)}
                        required
                        className="border-2 border-gray-200 rounded px-3 py-2 w-full focus:outline-none focus:border-pink-500"
                      />
                    </div>
                    <div className="w-32">
                      <select
                        value={ing.unit}
                        onChange={e => updateRow(idx, 'unit', e.target.value)}
                        className="border-2 border-gray-200 rounded px-3 py-2 w-full focus:outline-none focus:border-pink-500 bg-white"
                      >
                        <option value="g">gramos (g)</option>
                        <option value="kg">kilogramos (kg)</option>
                        <option value="ml">mililitros (ml)</option>
                        <option value="l">litros (l)</option>
                        <option value="unidades">unidades</option>
                        <option value="cucharadas">cucharadas</option>
                        <option value="cucharaditas">cucharaditas</option>
                        <option value="tazas">tazas</option>
                        <option value="pellizco">pellizco</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="text-red-400 hover:text-red-600 p-2"
                      disabled={ingredients.length === 1}
                      title="Eliminar ingrediente"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '⏳ Guardando...' : '💾 Actualizar Receta'}
            </button>
            <Link
              href="/"
              className="px-6 py-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}