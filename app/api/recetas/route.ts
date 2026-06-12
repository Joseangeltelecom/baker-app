import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDB } from '@/lib/db';
import { getUserId } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    await initializeDB();
    const result = await db.execute({
      sql: 'SELECT * FROM recipes WHERE user_id = ? ORDER BY created_at DESC',
      args: [userId],
    });
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error al obtener recetas:', error);
    return NextResponse.json({ error: 'Error al cargar recetas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    await initializeDB();
    const body = await request.json();
    const { name, ingredients } = body;

    if (!name || !ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const transaction = await db.transaction('write');

    try {
      const recipeResult = await transaction.execute({
        sql: 'INSERT INTO recipes (name, user_id) VALUES (?, ?)',
        args: [name, userId],
      });

      const recipeId = Number(recipeResult.lastInsertRowid);

      if (!recipeId) {
        throw new Error('No se pudo crear la receta');
      }

      for (const ing of ingredients) {
        if (!ing.name || !ing.unit) continue;
        const qty = parseFloat(ing.quantity);
        if (isNaN(qty)) continue;
        await transaction.execute({
          sql: 'INSERT INTO ingredients (recipe_id, name, quantity, unit, product_id) VALUES (?, ?, ?, ?, ?)',
          args: [recipeId, ing.name, qty, ing.unit, ing.product_id || null],
        });
      }

      await transaction.commit();

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
