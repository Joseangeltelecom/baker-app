'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

interface Recipe {
  id: number;
  name: string;
  ingredients: Ingredient[];
}

export default function RecipeScalePage() {
  const params = useParams();
  const { id } = params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [referenceId, setReferenceId] = useState<number | null>(null);
  const [newAmount, setNewAmount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/recetas/${id}`);
      
      if (!res.ok) {
        throw new Error('Error al cargar la receta');
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setRecipe(data);
      
      // Establecer el primer ingrediente como referencia por defecto
      if (data.ingredients && Array.isArray(data.ingredients) && data.ingredients.length > 0) {
        setReferenceId(data.ingredients[0].id);
      }
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Error al cargar la receta');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Verificar que ingredients existe antes de usar .find()
  const referenceIngredient = recipe?.ingredients?.find(ing => ing.id === referenceId);
  
  const factor = referenceIngredient && newAmount !== '' && referenceIngredient.quantity > 0
    ? parseFloat(newAmount) / referenceIngredient.quantity
    : 1;

  const handleSetReference = (ingId: number) => {
    setReferenceId(ingId);
    setNewAmount('');
  };

  const handleNewAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*\.?\d*$/.test(val)) {
      setNewAmount(val);
    }
  };

  const handleReset = () => {
    setNewAmount('');
  };

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto p-4 text-center">
        <div className="animate-spin text-4xl">⏳</div>
        <p className="mt-2">Cargando receta...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-2xl mx-auto p-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 text-lg">❌ {error}</p>
          <Link href="/" className="text-pink-500 underline mt-4 inline-block">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  if (!recipe || !recipe.ingredients) {
    return (
      <main className="max-w-2xl mx-auto p-4 text-center">
        <p className="text-gray-600">Receta no encontrada</p>
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{recipe.name}</h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            💡 <strong>Cómo usar:</strong> Selecciona el ingrediente del que tienes una cantidad específica,
            escribe esa cantidad y automáticamente se calcularán las proporciones para todos los demás.
          </p>
        </div>

        <div className="space-y-3">
          {recipe.ingredients.map(ing => {
            const isReference = ing.id === referenceId;
            const scaledQuantity = (ing.quantity * factor).toFixed(2);
            const originalText = `Original: ${ing.quantity} ${ing.unit}`;

            return (
              <div
                key={ing.id}
                className={`border-2 rounded-lg p-4 transition-all ${
                  isReference ? 'border-pink-400 bg-pink-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="reference"
                    id={`ing-${ing.id}`}
                    checked={isReference}
                    onChange={() => handleSetReference(ing.id)}
                    className="w-5 h-5 text-pink-500 cursor-pointer"
                  />
                  <label htmlFor={`ing-${ing.id}`} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-lg">{ing.name}</span>
                      <span className="text-sm text-gray-500">({originalText})</span>
                    </div>
                  </label>
                </div>

                {isReference ? (
                  <div className="mt-3 ml-8">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nueva cantidad:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder={`Ej: ${ing.quantity}`}
                        value={newAmount}
                        onChange={handleNewAmountChange}
                        className="border-2 border-pink-300 rounded-lg px-3 py-2 w-40 focus:outline-none focus:border-pink-500 text-lg"
                      />
                      <span className="text-gray-600 font-medium">{ing.unit}</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 ml-8">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">→</span>
                      <span className="text-2xl font-bold text-pink-600">
                        {scaledQuantity}
                      </span>
                      <span className="text-gray-600">{ing.unit}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {newAmount !== '' && (
          <button
            onClick={handleReset}
            className="mt-6 w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            🔄 Reiniciar cantidades
          </button>
        )}
      </div>
    </main>
  );
}