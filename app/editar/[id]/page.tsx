'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface IngredientRow {
  name: string;
  quantity: string;
  unit: string;
}

export default function EditRecipe() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { name: '', quantity: '', unit: 'g' },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Cargar datos de la receta
  useEffect(() => {
    fetch(`/api/recetas/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setName(data.name);
          // Convertir los ingredientes al formato del formulario
          const ings = data.ingredients.map((ing: any) => ({
            name: ing.name,
            quantity: ing.quantity.toString(),
            unit: ing.unit,
          }));
          setIngredients(ings.length > 0 ? ings : [{ name: '', quantity: '', unit: 'g' }]);
        }
      })
      .catch(() => setError('Error al cargar la receta'))
      .finally(() => setLoading(false));
  }, [id]);

  const addRow = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: 'g' }]);
  };

  const updateRow = (index: number, field: keyof IngredientRow, value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const removeRow = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
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
                <div
                  key={idx}
                  className="flex gap-2 items-start bg-gray-50 p-3 rounded-lg"
                >
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