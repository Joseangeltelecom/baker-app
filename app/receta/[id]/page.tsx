'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '@/app/context/CurrencyContext';

// ---------- Tipos ----------
interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  product_id?: number | null;
  product_name?: string | null;
  product_price?: number | null;
  product_unit?: string | null;
  product_brand?: string | null;
  product_store?: string | null;
  product_package_quantity?: number | null;   // <--- NUEVA LÍNEA
}

interface Recipe {
  id: number;
  name: string;
  ingredients: Ingredient[];
}

interface ExtraCost {
  id: number;       // solo para key temporal
  name: string;
  amount: string;
}

// ---------- Utilidades de conversión ----------
const convertToBase = (quantity: number, unit: string): number => {
  switch (unit) {
    case 'kg': return quantity * 1000;
    case 'l':  return quantity * 1000;
    default:   return quantity;   // g, ml, unidades, cucharadas, etc.
  }
};

const calculateCost = (ing: Ingredient, factor: number) => {
  if (!ing.product_id || ing.product_price == null || ing.product_unit == null) return null;
  const scaledQty = ing.quantity * factor;
  const ingredientBaseQty = convertToBase(scaledQty, ing.unit);
  // Precio por unidad base del paquete
  const packageQty = ing.product_package_quantity ?? 1; // Asegurar que no sea 0
  const pricePerBaseUnit = ing.product_price / convertToBase(packageQty, ing.product_unit);
  return ingredientBaseQty * pricePerBaseUnit;
};

export default function RecipeScalePage() {
  const params = useParams();
  const { id } = params;
  const { symbol } = useCurrency();

  // ---------- Estado ----------
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [referenceId, setReferenceId] = useState<number | null>(null);
  const [newAmount, setNewAmount] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Gastos extra
  const [extraCosts, setExtraCosts] = useState<ExtraCost[]>([]);
  const [nextExtraId, setNextExtraId] = useState(1);

  // ---------- Efectos ----------
  useEffect(() => {
    fetchRecipe();
  }, [id]);

  const fetchRecipe = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/recetas/${id}`);
      if (!res.ok) throw new Error('Error al cargar la receta');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setRecipe(data);
      if (data.ingredients?.length > 0) {
        setReferenceId(data.ingredients[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al cargar la receta');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Derivados ----------
  const referenceIngredient = recipe?.ingredients?.find(ing => ing.id === referenceId);
  const factor = referenceIngredient && newAmount !== '' && referenceIngredient.quantity > 0
    ? parseFloat(newAmount) / referenceIngredient.quantity
    : 1;

  // Costos individuales (array de { ingrediente, costo })
  const ingredientCosts = recipe?.ingredients
    ?.map(ing => ({
      ingredient: ing,
      cost: calculateCost(ing, factor),
    }))
    .filter(item => item.cost !== null) ?? [];

  const subtotal = ingredientCosts.reduce((sum, item) => sum + (item.cost ?? 0), 0);

  // Suma de gastos extra
  const extraTotal = extraCosts.reduce((sum, ec) => {
    const val = parseFloat(ec.amount);
    return isNaN(val) ? sum : sum + val;
  }, 0);

  const total = subtotal + extraTotal;

  // ---------- Handlers ----------
  const handleSetReference = (ingId: number) => {
    setReferenceId(ingId);
    setNewAmount('');
  };

  const handleNewAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*\.?\d*$/.test(val)) setNewAmount(val);
  };

  const handleReset = () => setNewAmount('');

  // Manejo de gastos extra
  const addExtraCost = () => {
    setExtraCosts([...extraCosts, { id: nextExtraId, name: '', amount: '' }]);
    setNextExtraId(nextExtraId + 1);
  };

  const updateExtraCost = (id: number, field: 'name' | 'amount', value: string) => {
    setExtraCosts(prev => prev.map(ec => (ec.id === id ? { ...ec, [field]: value } : ec)));
  };

  const removeExtraCost = (id: number) => {
    setExtraCosts(prev => prev.filter(ec => ec.id !== id));
  };

  // ---------- Render ----------
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
          <Link href="/" className="text-pink-500 underline mt-4 inline-block">Volver al inicio</Link>
        </div>
      </main>
    );
  }

  if (!recipe || !recipe.ingredients) {
    return (
      <main className="max-w-2xl mx-auto p-4 text-center">
        <p className="text-gray-600">Receta no encontrada</p>
        <Link href="/" className="text-pink-500 underline mt-4 inline-block">Volver al inicio</Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link href="/" className="text-pink-500 hover:text-pink-700 underline mb-4 inline-flex items-center gap-1">
        ← Volver a recetas
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-6 border border-pink-100 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{recipe.name}</h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            💡 <strong>Cómo usar:</strong> Selecciona el ingrediente del que tienes una cantidad específica,
            escribe esa cantidad y automáticamente se calcularán las proporciones y el costo.
          </p>
        </div>

        <div className="space-y-3">
          {recipe.ingredients.map(ing => {
            const isReference = ing.id === referenceId;
            const scaledQuantity = (ing.quantity * factor).toFixed(2);
            const originalText = `Original: ${ing.quantity} ${ing.unit}`;

            // Buscar costo de este ingrediente en el array calculado
            const costItem = ingredientCosts.find(item => item.ingredient.id === ing.id);
            const ingredientCost = costItem?.cost;

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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva cantidad:</label>
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
                      <span className="text-2xl font-bold text-pink-600">{scaledQuantity}</span>
                      <span className="text-gray-600">{ing.unit}</span>
                    </div>
                  </div>
                )}

                {/* Mostrar costo unitario si está vinculado a un producto */}
                {ing.product_id && ingredientCost !== undefined && ingredientCost !== null && (
                  <div className="mt-2 ml-8 text-sm">
                    <span className="text-green-700 font-medium">
                      Costo: {symbol}{ingredientCost.toFixed(2)}
                    </span>
                    {ing.product_brand && (
                      <span className="text-gray-500 ml-2">
                        ({ing.product_brand}{ing.product_store ? ` · ${ing.product_store}` : ''})
                      </span>
                    )}
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

      {/* ========== SECCIÓN DE COSTOS TOTALES ========== */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-green-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">💰 Resumen de costos</h2>

        {/* Subtotal de ingredientes */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-lg">
            <span className="font-medium">Subtotal de ingredientes</span>
            <span className="font-bold">{symbol}{subtotal.toFixed(2)}</span>
          </div>

          {/* Lista de gastos extra */}
          {extraCosts.length > 0 && (
            <div className="mt-2">
              <h3 className="font-medium text-gray-700 mb-2">Gastos adicionales</h3>
              {extraCosts.map(ec => (
                <div key={ec.id} className="flex gap-2 mb-2 items-center">
                  <input
                    type="text"
                    placeholder="Concepto (ej: Transporte)"
                    value={ec.name}
                    onChange={e => updateExtraCost(ec.id, 'name', e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 flex-1 text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-sm">{symbol}</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={ec.amount}
                      onChange={e => updateExtraCost(ec.id, 'amount', e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 w-24 text-sm"
                    />
                  </div>
                  <button
                    onClick={() => removeExtraCost(ec.id)}
                    className="text-red-400 hover:text-red-600 text-xl leading-none"
                    title="Eliminar gasto"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botón para agregar gasto extra */}
          <button
            onClick={addExtraCost}
            className="mt-2 text-blue-500 hover:text-blue-700 text-sm font-medium"
          >
            + Agregar gasto extra (transporte, gas, mano de obra…)
          </button>
        </div>

        {/* Línea divisoria y total */}
        <div className="border-t border-gray-200 my-4"></div>
        <div className="flex justify-between items-center text-xl">
          <span className="font-bold">Costo total estimado</span>
          <span className="font-bold text-pink-600">{symbol}{total.toFixed(2)}</span>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          * Los costos se calculan según los productos asignados y el factor de escala actual.
        </p>
      </div>
    </main>
  );
}