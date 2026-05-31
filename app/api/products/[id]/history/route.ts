import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDB } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initializeDB();
  const { id } = await params;
  const history = await db.execute({
    sql: 'SELECT * FROM product_prices WHERE product_id = ? ORDER BY date DESC',
    args: [id],
  });
  return NextResponse.json(history.rows);
}