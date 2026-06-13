'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCurrency } from '../context/CurrencyContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

export default function CrearRecetaIA() {
  const { symbol } = useCurrency();
  const router = useRouter();
  const { transcript, interim, listening, start, stop, reset: resetTranscript, supported: voiceSupported } = useSpeechRecognition();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [recipe, setRecipe] = useState<any>(null);
  const [error, setError] = useState('');
  const [editName, setEditName] = useState('');
  const [editIngredients, setEditIngredients] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Sincronizar transcripción al textarea
  useEffect(() => {
    if (transcript) setPrompt(transcript);
  }, [transcript]);

  // Mostrar resultados parciales en vivo mientras se habla
  const displayPrompt = listening && interim ? interim : prompt;

  // Combinar texto del prompt con la transcripción de voz
  const finalPrompt = displayPrompt.trim();

  const handleGenerate = async () => {
    if (!finalPrompt) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: finalPrompt }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setRecipe(data);
        setEditName(data.name);
        setEditIngredients(data.ingredients.map((ing: any) => ({ ...ing, quantity: ing.quantity.toString() })));
      }
    } catch (e) {
      setError('Error de conexión');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!editName || editIngredients.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/recetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          ingredients: editIngredients.map(ing => ({
            name: ing.name,
            quantity: parseFloat(ing.quantity),
            unit: ing.unit,
          })),
        }),
      });
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const err = await res.json();
        setError(err.error || 'Error al guardar');
      }
    } catch (e) {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const updateIngredient = (idx: number, field: string, value: string) => {
    const updated = [...editIngredients];
    updated[idx][field] = value;
    setEditIngredients(updated);
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <Link href="/" className="text-pink-500 underline mb-4 inline-flex items-center gap-1">
        ← Volver a recetas
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-6 border border-pink-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">🧠 Crear Receta con IA</h1>
        <p className="text-sm text-gray-600 mb-6">
          Describe el postre que quieres hacer. Puedes escribir, hablar, o ambos.
        </p>

        {/* Entrada de texto y voz */}
        <div className="space-y-4">
          <textarea
            value={displayPrompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={listening ? 'Escuchando...' : 'Ej: Torta de chocolate húmeda con cobertura de ganache, para 8 personas...'}
            className="border-2 border-gray-200 rounded-lg px-4 py-3 w-full h-32 resize-none focus:outline-none focus:border-pink-500"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            {voiceSupported && (
              <button
                onClick={listening ? stop : start}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                  listening ? 'bg-red-500 text-white' : 'bg-pink-100 text-pink-700'
                }`}
              >
                {listening ? '⏹️ Detener' : '🎤 Hablar'}
              </button>
            )}
            <button
              onClick={() => { setPrompt(''); resetTranscript(); setRecipe(null); setError(''); }}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600"
            >
              Limpiar
            </button>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !finalPrompt}
          className="mt-4 w-full bg-pink-500 text-white px-6 py-3 rounded-lg hover:bg-pink-600 disabled:opacity-50"
        >
          {generating ? 'Generando...' : '✨ Generar Receta'}
        </button>

        {error && <div className="mt-4 bg-red-50 text-red-600 p-2 rounded">{error}</div>}

        {/* Resultado editable */}
        {recipe && (
          <div className="mt-8 border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Receta generada (puedes editar)</h2>
            <div className="mb-4">
              <label className="block font-medium mb-1">Nombre</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              />
            </div>

            <h3 className="font-medium mb-2">Ingredientes</h3>
            {editIngredients.map((ing, idx) => (
              <div key={idx} className="flex gap-2 mb-2 items-center">
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                  className="border rounded px-2 py-1 flex-1"
                />
                <input
                  type="number"
                  step="any"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(idx, 'quantity', e.target.value)}
                  className="border rounded px-2 py-1 w-24"
                />
                <select
                  value={ing.unit}
                  onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                  className="border rounded px-2 py-1 w-24"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="l">l</option>
                  <option value="unidades">unidades</option>
                  <option value="cucharadas">cucharadas</option>
                  <option value="cucharaditas">cucharaditas</option>
                  <option value="tazas">tazas</option>
                </select>
                <button
                  onClick={() => setEditIngredients(editIngredients.filter((_, i) => i !== idx))}
                  className="text-red-400 hover:text-red-600 text-xl"
                  disabled={editIngredients.length <= 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => setEditIngredients([...editIngredients, { name: '', quantity: '', unit: 'g' }])}
              className="text-sm text-pink-500 underline mb-4"
            >
              + Agregar ingrediente
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : '💾 Guardar Receta'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}