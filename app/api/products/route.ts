import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDB } from '@/lib/db';
import { auth } from '@/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  await initializeDB();
  const result = await db.execute({
    sql: `
      SELECT p.*, 
        (SELECT COUNT(*) FROM product_prices WHERE product_id = p.id) as price_count
      FROM products p
      WHERE p.user_id = ?
      ORDER BY p.name ASC
    `,
    args: [session.user.id],
  });
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  await initializeDB();
  const body = await request.json();
  const { name, brand, unit, current_price, store,  package_quantity } = body;

  if (!name || !unit || current_price == null) {
    return NextResponse.json({ error: 'Nombre, unidad y precio son obligatorios' }, { status: 400 });
  }

  const result = await db.execute({
    sql: 'INSERT INTO products (name, brand, unit, package_quantity, current_price, store, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [name, brand || null, unit, package_quantity, current_price, store || null, session.user.id],
  });

  const productId = Number(result.lastInsertRowid);

  await db.execute({
    sql: 'INSERT INTO product_prices (product_id, price, store) VALUES (?, ?, ?)',
    args: [productId, current_price, store || null],
  });

  const newProduct = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [productId] });
  return NextResponse.json(newProduct.rows[0], { status: 201 });
}
