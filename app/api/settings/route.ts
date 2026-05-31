import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDB } from '@/lib/db';

export async function GET() {
  await initializeDB();
  const result = await db.execute('SELECT * FROM settings');
  const settings: Record<string, string> = {};
  for (const row of result.rows) {
    settings[row.key as string] = row.value as string;
  }
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  await initializeDB();
  const { key, value } = await request.json();
  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key y value requeridos' }, { status: 400 });
  }
  await db.execute({
    sql: 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
    args: [key, value],
  });
  return NextResponse.json({ success: true });
}