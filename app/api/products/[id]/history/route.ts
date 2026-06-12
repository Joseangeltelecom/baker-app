import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDB } from '@/lib/db';
import { getUserId } from '@/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  await initializeDB();
  const { id } = await params;

  const product = await db.execute({
    sql: 'SELECT id FROM products WHERE id = ? AND user_id = ?',
    args: [id, userId],
  });
  if (product.rows.length === 0) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  const history = await db.execute({
    sql: 'SELECT * FROM product_prices WHERE product_id = ? ORDER BY date DESC',
    args: [id],
  });
  return NextResponse.json(history.rows);
}
