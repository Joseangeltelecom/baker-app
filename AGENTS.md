<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# baker-app — Project Guide

> **IMPORTANT**: After adding, removing, or renaming any file, directory, route, API, or database column, **update this file** so the project structure stays accurate for future sessions.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.6 (App Router) |
| Language | TypeScript 5 (strict: true) |
| Styling | Tailwind CSS v4 |
| Database | Turso (libSQL) — SQLite-compatible edge DB |
| Auth | NextAuth.js v5 (JWT strategy) |
| AI | Google Gemini 2.5 Flash |
| Password | bcryptjs |
| Package manager | npm |

## Environment Variables (`.env.local`)

```
GEMINI_API_KEY=        # Google Gemini API key
LIBSQL_DB_URL=         # Turso DB URL
LIBSQL_DB_AUTH_TOKEN=  # Turso DB auth token
AUTH_SECRET=           # NextAuth JWT secret (32+ hex chars)
AUTH_URL=              # App URL (e.g. http://localhost:3000)
AUTH_GOOGLE_ID=        # Google OAuth client ID
AUTH_GOOGLE_SECRET=    # Google OAuth client secret
```

## Directory Structure

```
baker-app/
  auth.ts                  # NextAuth v5 config (Credentials + Google)
  proxy.ts                 # Auth middleware (protects routes)
  lib/
    db.ts                  # DB client + schema creation + migrations
    seed.ts                # Seed data (5 preset recipes)
  hooks/
    useSpeechRecognition.ts # Web Speech API wrapper (Spanish)
  app/
    layout.tsx             # Root layout: SessionProvider, CurrencyProvider, HeaderNav
    page.tsx               # Home — recipe list
    globals.css

    # — Pages —
    login/page.tsx              # Email/username + password or Google
    register/page.tsx           # Username + name + email + password + Google
    crear/page.tsx              # Manual recipe creator
    crear-ia/page.tsx           # AI recipe generator (Gemini)
    receta/[id]/page.tsx        # Scale ingredients by quantity
    editar/[id]/page.tsx        # Edit recipe
    escalar-dimensiones/[id]/page.tsx  # Scale by pan volume
    productos/page.tsx          # Product catalog
    productos/[id]/page.tsx     # Edit product + price history
    productos/crear/page.tsx    # New product form
    chat/page.tsx               # AI pastry chat (Gemini)
    escanear/page.tsx           # Scan product with camera (Gemini vision)
    configuracion/page.tsx      # Currency settings (USD/PEN/BRL)

    # — API Routes —
    api/auth/[...nextauth]/route.ts        # NextAuth handlers
    api/auth/register/route.ts             # User registration (POST)
    api/recetas/route.ts                   # List (GET) / Create (POST) recipes
    api/recetas/[id]/route.ts              # Get (GET) / Update (PUT) / Delete (DELETE) recipe
    api/products/route.ts                  # List (GET) / Create (POST) products
    api/products/[id]/route.ts             # Get (GET) / Update (PUT) / Delete (DELETE) product
    api/products/[id]/history/route.ts     # Price history (GET)
    api/settings/route.ts                  # Settings get (GET) / set (PUT)
    api/generate-recipe/route.ts           # AI recipe generation (POST → Gemini)
    api/chat/route.ts                      # AI chat (POST → Gemini)
    api/analyze-image/route.ts             # Scan image (POST → Gemini)
    api/seed/route.ts                      # Seed DB (GET)

    # — Components —
    components/SessionProvider.tsx  # NextAuth SessionProvider wrapper
    components/HeaderNav.tsx        # Nav bar (hides on login/register)
    components/AuthNav.tsx          # Unused — login/logout

    # — Context —
    context/CurrencyContext.tsx     # Currency state (USD/PEN/BRL)
```

## Database Schema (`lib/db.ts`)

### Table: `users`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK AUTO | |
| username | TEXT UNIQUE | Nullable (null for Google users) |
| name | TEXT NOT NULL | |
| email | TEXT UNIQUE NOT NULL | |
| password | TEXT | Nullable (null for Google users) |
| google_id | TEXT UNIQUE | Nullable |
| image | TEXT | Nullable |
| created_at | TEXT | DEFAULT datetime('now') |
| updated_at | TEXT | DEFAULT datetime('now') |

### Table: `recipes`
| Column | Type | FK |
|---|---|---|
| id | INTEGER PK AUTO | |
| name | TEXT NOT NULL | |
| user_id | INTEGER NOT NULL | → users(id) ON DELETE CASCADE |
| created_at | TEXT DEFAULT datetime('now') | |
| updated_at | TEXT DEFAULT datetime('now') | |

### Table: `ingredients`
| Column | Type | FK |
|---|---|---|
| id | INTEGER PK AUTO | |
| recipe_id | INTEGER NOT NULL | → recipes(id) ON DELETE CASCADE |
| name | TEXT NOT NULL | |
| quantity | REAL NOT NULL | |
| unit | TEXT NOT NULL | |
| product_id | INTEGER | → products(id) ON DELETE SET NULL |

### Table: `products`
| Column | Type | FK | Notes |
|---|---|---|---|
| id | INTEGER PK AUTO | | |
| name | TEXT NOT NULL | | |
| brand | TEXT | | |
| unit | TEXT NOT NULL | | |
| package_quantity | REAL NOT NULL DEFAULT 1 | | Added via migration |
| current_price | REAL | | |
| store | TEXT | | |
| user_id | INTEGER NOT NULL | → users(id) ON DELETE CASCADE | |
| created_at | TEXT | | |
| updated_at | TEXT | | |

### Table: `product_prices`
| Column | Type | FK |
|---|---|---|
| id | INTEGER PK AUTO | |
| product_id | INTEGER NOT NULL | → products(id) ON DELETE CASCADE |
| price | REAL NOT NULL | |
| store | TEXT | |
| date | TEXT DEFAULT datetime('now') | |

### Table: `settings`
| Column | Type |
|---|---|
| key | TEXT PK |
| value | TEXT NOT NULL |

### Auto-migrations in `initializeDB()`
- Adds `package_quantity` to `products` if missing
- Adds `user_id` to `recipes` if missing
- Adds `user_id` to `products` if missing
- Adds `username` to `users` if missing
- Inserts default `currency = 'USD'` setting

## Auth System (`auth.ts` + `proxy.ts`)

### Providers
- **Credentials**: email/username + password (bcryptjs compare)
- **Google OAuth**: links by google_id or email; auto-creates if new

### Session
- JWT strategy with `id` and `username` in token
- Session user includes: `id`, `username`, `name`, `email`, `image`

### Type augmentations
```ts
// In auth.ts
User { id: string; username?: string | null }
Session.user { id: string; username?: string | null; name?, email?, image? }
```

### Middleware (`proxy.ts`)
- Protects: `/`, `/crear`, `/crear-ia`, `/editar`, `/escalar-dimensiones`, `/escanear`, `/productos`, `/chat`, `/configuracion`
- If logged in → redirect `/login`, `/register` to `/`
- If NOT logged in → redirect protected routes to `/login`
- Excluded from check: `/api`, `/_next/static`, `/_next/image`, `*.png`

## Known Pitfalls — DO NOT Repeat These Mistakes

### ❌ No usar `turbopack.root` en `next.config.ts`
Nunca agregues `turbopack: { root: __dirname }` ni ninguna variante de `turbopack.root` a `next.config.ts`.
`__dirname` no está definido en el contexto ESM en que Next.js evalúa este archivo, por lo que resuelve a `undefined`.
Con `root: undefined`, el file watcher de Turbopack se engancha en la raíz del sistema de archivos (`C:\`) y entra en un loop infinito — cada archivo generado en `.next` dispara una recompilación que genera más archivos, consumiendo toda la RAM en segundos (se han registrado 10 GB en ~1 segundo).
La advertencia de múltiples lockfiles que esto pretende silenciar es **cosmética e inofensiva** — ignórala.

### ❌ No usar `let initialized = false` para guardar estado entre hot-reloads
En Next.js dev con Turbopack, cada hot-reload re-evalúa los módulos desde cero, reseteando cualquier variable a nivel de módulo.
Usa siempre `global._miVariable` para estado que debe sobrevivir entre recargas (conexiones DB, flags de inicialización).
Ejemplo correcto en `lib/db.ts`:
```ts
declare global { _db?: ReturnType<typeof createClient>; _dbInitialized?: boolean; }
if (!global._db) global._db = createClient({ url, authToken });
export const db = global._db;
```

### ❌ No llamar `initializeDB()` sin el guard de `global`
Antes del fix, `initializeDB()` se ejecutaba en cada request (GET, POST, etc.) corriendo múltiples queries SQL innecesarias.
El guard `if (global._dbInitialized) return;` asegura que el setup del schema corra solo una vez por proceso.

### ❌ No crear `middleware.ts` — el nombre correcto es `proxy.ts`
En Next.js 16+, el archivo de middleware se llama `proxy.ts`, no `middleware.ts`.
Si ambos archivos existen simultáneamente, Next.js lanza un error fatal que rompe toda la app.
El archivo correcto ya existe en: `proxy.ts`.

## Key Architecture Notes

- **Params are async**: `params` in page/layout is `Promise<{ id: string }>` — must `await`
- **Tailwind v4**: Uses `@tailwindcss/postcss` plugin, `@import "tailwindcss"`, `@theme inline` for CSS vars
- **Path alias**: `@/*` maps to project root
- **Language**: Spanish UI (app name "Delicias da Julieta")
- **Icons**: Emoji-based throughout (no icon library)
- **AuthNav.tsx**: Exists but **unused** in layout — kept for reference
- **DB migrations**: Run automatically in `initializeDB()` — no manual migration tool
- **Gemini model**: `models/gemini-2.5-flash-001` for all AI features

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npx tsc --noEmit   # Type-check only
```

## Rule: Keep This File Updated

Whenever you:
- Add, rename, or remove a **file or directory**
- Add, rename, or remove a **route** (page or API)
- Add, rename, or remove a **database table or column**
- Add, rename, or remove an **env variable**
- Change the **auth system, middleware, or layout**

→ **Update this file** to reflect the change so future sessions always have an accurate reference.
