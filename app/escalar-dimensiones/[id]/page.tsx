'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '../../context/CurrencyContext';

// Tipos similares a los de receta
interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  product_id?: number | null;
  product_price?: number | null;
  product_unit?: string | null;
  product_package_quantity?: number | null;
  product_brand?: string | null;
}

interface Recipe {
  id: number;
  name: string;
  ingredients: Ingredient[];
}

const DIAMETROS = [15, 20, 25, 30]; // cm
const ALTURAS = [5, 7, 10]; // cm

const convertToBase = (quantity: number, unit: string): number => {
  switch (unit) {
    case 'kg': return quantity * 1000;
    case 'l': return quantity * 1000;
    default: return quantity; // g, ml, unidades
  }
};

export default function EscalarDimensionesPage() {
  const params = useParams();
  const { id } = params;
  const { symbol } = useCurrency();

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [origDiam, setOrigDiam] = useState('20');
  const [origAltura, setOrigAltura] = useState('5');
  const [targetDiam, setTargetDiam] = useState('');
  const [targetAltura, setTargetAltura] = useState('');
  const [factor, setFactor] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/recetas/${id}`)
      .then(res => res.json())
      .then(data => {
        setRecipe(data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const calcularFactor = () => {
    const od = parseFloat(origDiam) || 0;
    const oh = parseFloat(origAltura) || 0;
    const td = parseFloat(targetDiam) || 0;
    const th = parseFloat(targetAltura) || 0;
    if (od <= 0 || oh <= 0 || td <= 0 || th <= 0) return;
    const volOrig = Math.PI * (od / 2) ** 2 * oh;
    const volTarget = Math.PI * (td / 2) ** 2 * th;
    setFactor(volTarget / volOrig);
  };

  useEffect(() => {
    if (targetDiam && targetAltura) calcularFactor();
  }, [targetDiam, targetAltura, origDiam, origAltura]);

  const scaledIngredients = recipe?.ingredients.map(ing => ({
    ...ing,
    scaledQty: (ing.quantity * factor).toFixed(2),
  })) || [];

  // Cálculo de costos (similar al de escalado normal)
  const calcularCosto = (ing: Ingredient) => {
    if (!ing.product_price || !ing.product_unit) return null;
    const scaledQty = ing.quantity * factor;
    const baseQty = convertToBase(scaledQty, ing.unit);
    const pricePerBaseUnit = ing.product_price / convertToBase(ing.product_package_quantity ?? 1, ing.product_unit);
    return baseQty * pricePerBaseUnit;
  };

  if (loading) return <div className="p-4 text-center">⏳ Cargando...</div>;
  if (!recipe) return <div className="p-4 text-red-500">Receta no encontrada</div>;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link href={`/receta/${id}`} className="text-pink-500 underline mb-4 inline-block">
        ← Volver a la receta
      </Link>
      <div className="bg-white rounded-lg shadow-lg p-6 border border-pink-100">
        <h1 className="text-2xl font-bold mb-2">📐 Escalar por tamaño</h1>
        <p className="text-sm text-gray-500 mb-4">Receta base: {recipe.name}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block font-medium mb-1">Diámetro original (cm)</label>
            <input
              type="number"
              value={origDiam}
              onChange={(e) => setOrigDiam(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Altura original (cm)</label>
            <input
              type="number"
              value={origAltura}
              onChange={(e) => setOrigAltura(e.target.value)}
              className="border rounded px-3 py-2 w-full"
            />
          </div>
        </div>

        <h2 className="font-semibold mb-2">Dimensiones deseadas</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {DIAMETROS.map(d => (
            <button
              key={d}
              onClick={() => setTargetDiam(d.toString())}
              className={`px-3 py-1 rounded-full border text-sm ${targetDiam === d.toString() ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-200 text-gray-600'}`}
            >
              {d} cm
            </button>
          ))}
          <input
            type="number"
            placeholder="Otro"
            value={targetDiam}
            onChange={(e) => setTargetDiam(e.target.value)}
            className="w-20 border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {ALTURAS.map(h => (
            <button
              key={h}
              onClick={() => setTargetAltura(h.toString())}
              className={`px-3 py-1 rounded-full border text-sm ${targetAltura === h.toString() ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-200 text-gray-600'}`}
            >
              {h} cm
            </button>
          ))}
          <input
            type="number"
            placeholder="Otra"
            value={targetAltura}
            onChange={(e) => setTargetAltura(e.target.value)}
            className="w-20 border rounded px-2 py-1 text-sm"
          />
        </div>

        {factor !== 1 && (
          <div className="bg-yellow-50 rounded p-3 mb-4 text-sm">
            Factor de escala: <strong>{factor.toFixed(3)}</strong> (volumen {targetDiam}cm × {targetAltura}cm respecto a {origDiam}cm × {origAltura}cm)
          </div>
        )}

        {/* Lista de ingredientes escalados */}
        <div className="space-y-2">
          {scaledIngredients.map(ing => {
            const costo = calcularCosto(ing);
            return (
              <div key={ing.id} className="flex justify-between items-center border-b py-2">
                <div>
                  <span className="font-medium">{ing.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {ing.scaledQty} {ing.unit}
                  </span>
                </div>
                {costo && (
                  <span className="text-green-700 text-sm font-medium">
                    {symbol}{costo.toFixed(2)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              // Guardar como nueva receta
              const newRecipe = {
                name: `${recipe.name} (${targetDiam}cm×${targetAltura}cm)`,
                ingredients: scaledIngredients.map(ing => ({
                  name: ing.name,
                  quantity: parseFloat(ing.scaledQty),
                  unit: ing.unit,
                  product_id: ing.product_id,
                })),
              };
              fetch('/api/recetas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRecipe),
              }).then(() => {
                window.location.href = '/';
              });
            }}
            className="bg-pink-500 text-white px-4 py-2 rounded-lg"
          >
            Guardar como nueva receta
          </button>
        </div>
      </div>
    </main>
  );
}