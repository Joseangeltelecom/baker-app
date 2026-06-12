import { NextResponse } from 'next/server';
import { db, initializeDB } from '@/lib/db';
import { auth } from '@/auth';
import { seedRecipes } from '@/lib/seed';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await initializeDB();

    const userId = session.user.id;

    // Verificar si el usuario ya tiene recetas
    const count = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM recipes WHERE user_id = ?',
      args: [userId],
    });
    const existingCount = (count.rows[0] as any)?.count || 0;

    if (existingCount > 0) {
      return NextResponse.json({
        message: 'Ya tienes recetas en tu cuenta',
        count: existingCount,
      });
    }

    await seedRecipes(userId);

    return NextResponse.json({
      success: true,
      message: 'Recetas iniciales creadas exitosamente',
    });
  } catch (error) {
    console.error('Error al sembrar recetas:', error);
    return NextResponse.json(
      { error: 'Error al crear recetas iniciales' },
      { status: 500 }
    );
  }
}
