import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDB } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDB();

    // ✅ ESPERAR a que params se resuelva
    const { id } = await params;

    const recipeResult = await db.execute({
      sql: 'SELECT * FROM recipes WHERE id = ?',
      args: [id],
    });

    if (recipeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 });
    }

    const ingredientsResult = await db.execute({
      sql: 'SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY id ASC',
      args: [id],
    });

    const recipe = {
      ...recipeResult.rows[0],
      ingredients: ingredientsResult.rows,
    };

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Error al obtener receta:', error);
    return NextResponse.json({ error: 'Error al cargar receta' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDB();
    
    // ✅ ESPERAR a que params se resuelva
    const { id } = await params;
    const body = await request.json();
    const { name, ingredients } = body;

    const transaction = await db.transaction('write');

    try {
      await transaction.execute({
        sql: "UPDATE recipes SET name = ?, updated_at = datetime('now') WHERE id = ?",
        args: [name, id],
      });

      await transaction.execute({
        sql: 'DELETE FROM ingredients WHERE recipe_id = ?',
        args: [id],
      });

      for (const ing of ingredients) {
        await transaction.execute({
          sql: 'INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?)',
          args: [id, ing.name, ing.quantity, ing.unit],
        });
      }

      await transaction.commit();

      const updated = await db.execute({
        sql: 'SELECT * FROM recipes WHERE id = ?',
        args: [id],
      });

      return NextResponse.json(updated.rows[0]);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error al actualizar receta:', error);
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDB();

    // ✅ ESPERAR a que params se resuelva
    const { id } = await params;

    await db.execute({
      sql: 'DELETE FROM ingredients WHERE recipe_id = ?',
      args: [id],
    });

    await db.execute({
      sql: 'DELETE FROM recipes WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true, message: 'Receta eliminada' });
  } catch (error) {
    console.error('Error al eliminar receta:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}