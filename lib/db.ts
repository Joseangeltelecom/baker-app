import { createClient } from '@libsql/client';

// Leer variables de entorno
const dbUrl = process.env.LIBSQL_DB_URL;
const authToken = process.env.LIBSQL_DB_AUTH_TOKEN;

if (!dbUrl || !authToken) {
  throw new Error('Faltan las variables de entorno LIBSQL_DB_URL y/o LIBSQL_DB_AUTH_TOKEN');
}

// Crear cliente de base de datos
export const db = createClient({
  url: dbUrl,
  authToken: authToken,
});

// Inicializar tablas (se llama antes de cualquier operación)
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

  // Nuevo: catálogo de productos
  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand TEXT,
      unit TEXT NOT NULL,
      current_price REAL,
      store TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Nuevo: historial de precios
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

  // Migración: si la columna product_id no existe en ingredients (bases antiguas)
  const hasColumn = await db.execute(
    "SELECT COUNT(*) as count FROM pragma_table_info('ingredients') WHERE name='product_id'"
  );
  if ((hasColumn.rows[0] as any).count === 0) {
    await db.execute(`ALTER TABLE ingredients ADD COLUMN product_id INTEGER REFERENCES products(id)`);
  }
}