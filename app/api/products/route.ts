import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDB } from '@/lib/db';

export async function GET() {
  await initializeDB();
  const result = await db.execute(`
    SELECT p.*, 
      (SELECT COUNT(*) FROM product_prices WHERE product_id = p.id) as price_count
    FROM products p
    ORDER BY p.name ASC
  `);
  return NextResponse.json(result.rows);
}

export async function POST(request: NextRequest) {
  await initializeDB();
  const body = await request.json();
  const { name, brand, unit, current_price, store,  package_quantity } = body;

  if (!name || !unit || current_price == null) {
    return NextResponse.json({ error: 'Nombre, unidad y precio son obligatorios' }, { status: 400 });
  }

  const result = await db.execute({
  sql: 'INSERT INTO products (name, brand, unit, package_quantity, current_price, store) VALUES (?, ?, ?, ?, ?, ?)',
  args: [name, brand || null, unit, package_quantity, current_price, store || null],
});

  const productId = Number(result.lastInsertRowid);

  // Guardar el primer precio en el historial
  await db.execute({
    sql: 'INSERT INTO product_prices (product_id, price, store) VALUES (?, ?, ?)',
    args: [productId, current_price, store || null],
  });

  const newProduct = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [productId] });
  return NextResponse.json(newProduct.rows[0], { status: 201 });
}