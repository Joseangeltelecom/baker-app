import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDB } from '@/lib/db';

export async function GET() {
  try {
    await initializeDB();
    const result = await db.execute('SELECT * FROM recipes ORDER BY created_at DESC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener recetas:', error);
    return NextResponse.json({ error: 'Error al cargar recetas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeDB();
    const body = await request.json();
    const { name, ingredients } = body;

    if (!name || !ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    // Usar transacción
    const transaction = await db.transaction('write');

    try {
      // Insertar receta
      const recipeResult = await transaction.execute({
        sql: 'INSERT INTO recipes (name) VALUES (?)',
        args: [name],
      });

      const recipeId = Number(recipeResult.lastInsertRowid);

      if (!recipeId) {
        throw new Error('No se pudo crear la receta');
      }

      // Insertar ingredientes
      for (const ing of ingredients) {
        if (!ing.name || !ing.quantity || !ing.unit) {
          throw new Error('Cada ingrediente debe tener nombre, cantidad y unidad');
        }
        await transaction.execute({
          sql: 'INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?)',
          args: [recipeId, ing.name, ing.quantity, ing.unit],
        });
      }

      await transaction.commit();

      // Obtener la receta creada
      const recipe = await db.execute({
        sql: 'SELECT * FROM recipes WHERE id = ?',
        args: [recipeId],
      });

      return NextResponse.json(recipe.rows[0], { status: 201 });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Error al crear receta:', error);
    return NextResponse.json(
      { error: error.message || 'Error al guardar la receta' },
      { status: 500 }
    );
  }
}