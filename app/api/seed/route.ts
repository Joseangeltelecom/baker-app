import { NextResponse } from 'next/server';
import { db, initializeDB } from '@/lib/db';

export async function GET() {
  try {
    await initializeDB();

    // Verificar si ya hay recetas
    const count = await db.execute('SELECT COUNT(*) as count FROM recipes');
    const existingCount = (count.rows[0] as any)?.count || 0;

    if (existingCount > 0) {
      return NextResponse.json({
        message: 'La base de datos ya contiene recetas',
        count: existingCount
      });
    }

    // Datos de recetas predefinidas (las mismas de lib/seed.ts pero aquí para ejecutarlas directamente)
    const seedRecipes = [
      {
        name: 'Bizcocho básico',
        ingredients: [
          { name: 'Harina de trigo', quantity: 250, unit: 'g' },
          { name: 'Azúcar', quantity: 200, unit: 'g' },
          { name: 'Huevos', quantity: 4, unit: 'unidades' },
          { name: 'Mantequilla', quantity: 100, unit: 'g' },
          { name: 'Leche', quantity: 120, unit: 'ml' },
          { name: 'Polvo de hornear', quantity: 10, unit: 'g' },
          { name: 'Esencia de vainilla', quantity: 5, unit: 'ml' },
        ],
      },
      {
        name: 'Galletas de mantequilla',
        ingredients: [
          { name: 'Harina de trigo', quantity: 300, unit: 'g' },
          { name: 'Mantequilla', quantity: 200, unit: 'g' },
          { name: 'Azúcar glass', quantity: 100, unit: 'g' },
          { name: 'Huevo', quantity: 1, unit: 'unidades' },
          { name: 'Esencia de vainilla', quantity: 5, unit: 'ml' },
        ],
      },
      {
        name: 'Brownies de chocolate',
        ingredients: [
          { name: 'Chocolate negro', quantity: 200, unit: 'g' },
          { name: 'Mantequilla', quantity: 150, unit: 'g' },
          { name: 'Azúcar', quantity: 200, unit: 'g' },
          { name: 'Huevos', quantity: 3, unit: 'unidades' },
          { name: 'Harina de trigo', quantity: 100, unit: 'g' },
          { name: 'Nueces', quantity: 80, unit: 'g' },
        ],
      },
      {
        name: 'Crema pastelera',
        ingredients: [
          { name: 'Leche', quantity: 500, unit: 'ml' },
          { name: 'Yemas de huevo', quantity: 4, unit: 'unidades' },
          { name: 'Azúcar', quantity: 100, unit: 'g' },
          { name: 'Maicena', quantity: 40, unit: 'g' },
          { name: 'Esencia de vainilla', quantity: 5, unit: 'ml' },
        ],
      },
      {
        name: 'Cupcakes de vainilla',
        ingredients: [
          { name: 'Harina de trigo', quantity: 200, unit: 'g' },
          { name: 'Azúcar', quantity: 150, unit: 'g' },
          { name: 'Mantequilla', quantity: 120, unit: 'g' },
          { name: 'Huevos', quantity: 2, unit: 'unidades' },
          { name: 'Leche', quantity: 100, unit: 'ml' },
          { name: 'Polvo de hornear', quantity: 8, unit: 'g' },
          { name: 'Esencia de vainilla', quantity: 5, unit: 'ml' },
        ],
      },
    ];

    const transaction = await db.transaction('write');

    try {
      for (const recipe of seedRecipes) {
        const recipeResult = await transaction.execute({
          sql: 'INSERT INTO recipes (name) VALUES (?)',
          args: [recipe.name],
        });

        const recipeId = Number(recipeResult.lastInsertRowid);

        if (recipeId) {
          for (const ing of recipe.ingredients) {
            await transaction.execute({
              sql: 'INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?)',
              args: [recipeId, ing.name, ing.quantity, ing.unit],
            });
          }
        }
      }

      await transaction.commit();
      return NextResponse.json({
        success: true,
        message: 'Recetas iniciales creadas exitosamente',
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error al sembrar recetas:', error);
    return NextResponse.json(
      { error: 'Error al crear recetas iniciales' },
      { status: 500 }
    );
  }
}