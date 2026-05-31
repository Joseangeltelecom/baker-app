import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { prompt } = await request.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API Key no configurada' }, { status: 500 });
  }

  const model = 'gemini-2.5-flash';

  const systemPrompt = `Eres un chef repostero experto. A partir de una descripción de un postre o torta, genera una receta completa en formato JSON.
El JSON debe tener exactamente esta estructura:
{
  "name": "Nombre de la receta",
  "ingredients": [
    { "name": "Nombre del ingrediente", "quantity": 250, "unit": "g" },
    ...
  ]
}
Usa unidades de repostería (g, ml, unidades, cucharadas, etc.). No incluyas ningún texto adicional, solo el JSON puro.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\nDescripción: ${prompt}` }] }],
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: 'No se generó receta' }, { status: 500 });
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');

    const recipe = JSON.parse(jsonMatch[0]);
    // Validación básica
    if (!recipe.name || !Array.isArray(recipe.ingredients)) {
      throw new Error('Formato inválido');
    }
    return NextResponse.json(recipe);
  } catch (e: any) {
    return NextResponse.json({ error: `Error al generar: ${e.message}` }, { status: 500 });
  }
}