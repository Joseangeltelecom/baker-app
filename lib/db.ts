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
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    )
  `);
}