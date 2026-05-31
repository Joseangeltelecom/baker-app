import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { messages } = await request.json(); // [{ role: 'user' | 'assistant', text: string }]
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API Key no configurada' }, { status: 500 });
  }

  const model = 'gemini-2.5-flash';

  const systemInstruction = `Eres una repostera profesional, amable y detallada. Ayudas con recetas, técnicas, conversiones de repostería, solución de problemas, etc.
Cuando el usuario te pida explícitamente una receta, responde con los ingredientes y pasos. Al final de la receta, incluye un bloque JSON exactamente así:
<!--RECIPE-->{"name":"Nombre","ingredients":[{"name":"Ingrediente","quantity":250,"unit":"g"},...]}<!--END_RECIPE-->
No incluyas texto fuera del JSON dentro del bloque de receta. El bloque debe ser claro para que la aplicación lo pueda guardar.`;

  try {
    // Construir historial para Gemini (system como primer mensaje de usuario)
    const contents = [
      { role: 'user', parts: [{ text: systemInstruction }] },
      ...messages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.text }],
      })),
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      return NextResponse.json({ error: 'Sin respuesta' }, { status: 500 });
    }
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}