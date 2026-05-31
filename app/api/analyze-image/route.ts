import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { image } = await request.json(); // base64 string (sin el prefijo data:image/...;base64,)

  if (!image) {
    return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API Key no configurada' }, { status: 500 });
  }

  const prompt = `Eres un asistente para una repostera. Analiza la imagen del producto de repostería o alimento y extrae:
- Nombre del producto (ej. "Mantequilla", "Harina de trigo")
- Marca (si se ve)
- Precio visible (si aparece un precio en la etiqueta o estante)
- Cantidad del paquete (ej. 500, 1, etc.)
- Unidad de medida (g, kg, ml, l, unidad, etc.)
- Nombre de la tienda (si se logra leer)

Devuelve ÚNICAMENTE un JSON válido con las siguientes claves: "name", "brand", "price", "package_quantity", "unit", "store".
Si no logras identificar algún campo, usa null. No incluyas explicaciones ni texto adicional.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: image, // base64 puro
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: 'No se pudo analizar la imagen' }, { status: 500 });
    }

    // Extraer el JSON de la respuesta (a veces viene con pequeñas marcas)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ raw: text, error: 'No se encontró JSON' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Error al contactar Gemini' }, { status: 500 });
  }
}