// lib/db.ts
import { createClient } from '@libsql/client';

const dbUrl = process.env.LIBSQL_DB_URL;
const authToken = process.env.LIBSQL_DB_AUTH_TOKEN;

if (!dbUrl || !authToken) {
  throw new Error('Faltan las variables de entorno LIBSQL_DB_URL y/o LIBSQL_DB_AUTH_TOKEN');
}

export const db = createClient({ url: dbUrl, authToken });

export async function initializeDB() {
  // Tablas originales
  await db.execute(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipe_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      product_id INTEGER,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    )
  `);

  // Tabla de productos (ahora con package_quantity)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT,
      unit TEXT NOT NULL,
      package_quantity REAL NOT NULL DEFAULT 1,
      current_price REAL,
      store TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Historial de precios
  await db.execute(`
    CREATE TABLE IF NOT EXISTS product_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      price REAL NOT NULL,
      store TEXT,
      date TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

  // Tabla de configuración global
  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Insertar moneda por defecto si no existe
  await db.execute(`
    INSERT OR IGNORE INTO settings (key, value) VALUES ('currency', 'USD')
  `);

  // Migración para tablas viejas (si package_quantity no existe)
  const hasCol = await db.execute(
    "SELECT COUNT(*) as count FROM pragma_table_info('products') WHERE name='package_quantity'"
  );
  if ((hasCol.rows[0] as any).count === 0) {
    await db.execute(`ALTER TABLE products ADD COLUMN package_quantity REAL NOT NULL DEFAULT 1`);
  }
}