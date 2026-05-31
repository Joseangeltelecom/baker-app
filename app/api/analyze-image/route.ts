import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { image } = await request.json();

  if (!image) {
    return NextResponse.json({ error: 'Falta la imagen' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'API Key de Gemini no configurada en el servidor' }, { status: 500 });
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
                    data: image,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // 1. Revisar si la API de Gemini devolvió un error explícito
    if (data.error) {
      console.error('Gemini API error:', data.error);
      return NextResponse.json({
        error: `Error de Gemini: ${data.error.message || 'desconocido'}`,
        details: data.error,
      }, { status: 500 });
    }

    // 2. Extraer el texto de la respuesta
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      // Quizá el modelo bloqueó la imagen por seguridad o no generó texto
      const finishReason = data?.candidates?.[0]?.finishReason;
      console.error('Respuesta inesperada de Gemini:', data);
      return NextResponse.json({
        error: `No se generó texto. Motivo: ${finishReason || 'desconocido'}.`,
        details: data,
      }, { status: 500 });
    }

    // 3. Intentar parsear el JSON del texto generado
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Texto generado no contiene JSON:', text);
      return NextResponse.json({
        error: 'El modelo no devolvió un JSON válido.',
        raw_text: text,
      }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Error al contactar Gemini:', error);
    return NextResponse.json({
      error: `Error inesperado: ${error.message}`,
    }, { status: 500 });
  }
}