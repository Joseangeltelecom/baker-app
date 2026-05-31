'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface IngredientRow {
  name: string;
  quantity: string;
  unit: string;
}

export default function CreateRecipe() {
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { name: '', quantity: '', unit: 'g' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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

    // Validar
    if (!name.trim()) {
      setError('El nombre de la receta es obligatorio');
      return;
    }

    const validIngredients = ingredients.filter(ing => ing.name.trim() !== '');
    if (validIngredients.length === 0) {
      setError('Debes agregar al menos un ingrediente');
      return;
    }

    // Validar que todas las cantidades sean números válidos
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

      const res = await fetch('/api/recetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), ingredients: parsedIngredients }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al guardar la receta');
      }
    } catch (error) {
      setError('Error de conexión al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link
        href="/"
        className="text-pink-500 hover:text-pink-700 underline mb-4 inline-flex items-center gap-1"
      >
        ← Volver a recetas
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-6 border border-pink-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Crear Nueva Receta</h1>

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
              {saving ? '⏳ Guardando...' : '💾 Guardar Receta'}
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