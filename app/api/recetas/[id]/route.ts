import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDB } from '@/lib/db';
import { getUserId } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    await initializeDB();

    const { id } = await params;

    const recipeResult = await db.execute({
      sql: 'SELECT * FROM recipes WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    if (recipeResult.rows.length === 0) {
      return NextResponse.json({ error: 'Receta no encontrada' }, { status: 404 });
    }

    const ingredientsResult = await db.execute({
      sql: `
        SELECT 
          i.id, i.recipe_id, i.name, i.quantity, i.unit, i.product_id,
          p.name as product_name,
          p.current_price as product_price,
          p.unit as product_unit,
          p.package_quantity as product_package_quantity,
          p.brand as product_brand,
          p.store as product_store
        FROM ingredients i
        LEFT JOIN products p ON i.product_id = p.id
        WHERE i.recipe_id = ?
        ORDER BY i.id ASC
      `,
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
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    await initializeDB();

    const { id } = await params;
    const body = await request.json();
    const { name, ingredients } = body;

    const transaction = await db.transaction('write');

    try {
      await transaction.execute({
        sql: "UPDATE recipes SET name = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?",
        args: [name, id, userId],
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
        sql: 'SELECT * FROM recipes WHERE id = ? AND user_id = ?',
        args: [id, userId],
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
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    await initializeDB();

    const { id } = await params;

    await db.execute({
      sql: 'DELETE FROM ingredients WHERE recipe_id = ?',
      args: [id],
    });

    await db.execute({
      sql: 'DELETE FROM recipes WHERE id = ? AND user_id = ?',
      args: [id, userId],
    });

    return NextResponse.json({ success: true, message: 'Receta eliminada' });
  } catch (error) {
    console.error('Error al eliminar receta:', error);
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 });
  }
}
