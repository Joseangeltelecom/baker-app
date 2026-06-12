// lib/db.ts
import { createClient } from '@libsql/client';

const dbUrl = process.env.LIBSQL_DB_URL;
const authToken = process.env.LIBSQL_DB_AUTH_TOKEN;

if (!dbUrl || !authToken) {
  throw new Error('Faltan las variables de entorno LIBSQL_DB_URL y/o LIBSQL_DB_AUTH_TOKEN');
}

declare global {
  var _db: ReturnType<typeof createClient> | undefined
  var _dbInitialized: boolean | undefined
}

// Reuse the same client across hot-reloads in dev
if (!global._db) {
  global._db = createClient({ url: dbUrl, authToken });
}
export const db = global._db;

export async function initializeDB() {
  if (global._dbInitialized) return;
  global._dbInitialized = true;

  // Tablas originales
  await db.execute(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
      user_id INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

  // Tabla de usuarios
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      google_id TEXT UNIQUE,
      image TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
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

  // Migración para columna user_id en recipes
  const hasRecipeUserId = await db.execute(
    "SELECT COUNT(*) as count FROM pragma_table_info('recipes') WHERE name='user_id'"
  );
  if ((hasRecipeUserId.rows[0] as any).count === 0) {
    await db.execute("ALTER TABLE recipes ADD COLUMN user_id INTEGER");
  }

  const hasProductUserId = await db.execute(
    "SELECT COUNT(*) as count FROM pragma_table_info('products') WHERE name='user_id'"
  );
  if ((hasProductUserId.rows[0] as any).count === 0) {
    await db.execute("ALTER TABLE products ADD COLUMN user_id INTEGER");
  }

  // Migración para columna username en users
  const hasUsername = await db.execute(
    "SELECT COUNT(*) as count FROM pragma_table_info('users') WHERE name='username'"
  );
  if ((hasUsername.rows[0] as any).count === 0) {
    await db.execute(`ALTER TABLE users ADD COLUMN username TEXT`);
    try {
      await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)`);
    } catch { }
  }
}