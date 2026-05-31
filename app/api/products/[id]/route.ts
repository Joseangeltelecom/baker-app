import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDB } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initializeDB();
  const { id } = await params;
  const product = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
  if (product.rows.length === 0) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }
  const history = await db.execute({
    sql: 'SELECT * FROM product_prices WHERE product_id = ? ORDER BY date DESC',
    args: [id],
  });
  return NextResponse.json({ ...product.rows[0], price_history: history.rows });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initializeDB();
  const { id } = await params;
  const body = await request.json();
  const { name, brand, unit, package_quantity, current_price, store } = body;

  const transaction = await db.transaction('write');
  try {
        await transaction.execute({
        sql: "UPDATE products SET name=?, brand=?, unit=?, package_quantity=?, current_price=?, store=?, updated_at=datetime('now') WHERE id=?",
        args: [name, brand || null, unit, package_quantity, current_price, store || null, id],
        });

    // Si el precio cambió, guardar en historial (comparamos con el precio actual antes de update)
    // Para simplificar, siempre guardamos un nuevo registro en el historial si se modificó el precio
    const prev = await db.execute({ sql: 'SELECT current_price FROM products WHERE id = ?', args: [id] });
    const oldPrice = (prev.rows[0] as any)?.current_price;
    if (oldPrice !== undefined && parseFloat(oldPrice) !== parseFloat(current_price)) {
      await transaction.execute({
        sql: 'INSERT INTO product_prices (product_id, price, store) VALUES (?, ?, ?)',
        args: [id, current_price, store || null],
      });
    }
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const updated = await db.execute({ sql: 'SELECT * FROM products WHERE id = ?', args: [id] });
  return NextResponse.json(updated.rows[0]);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await initializeDB();
  const { id } = await params;
  await db.execute({ sql: 'DELETE FROM products WHERE id = ?', args: [id] });
  return NextResponse.json({ success: true });
}