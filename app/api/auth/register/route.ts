import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db, initializeDB } from "@/lib/db"
import { seedRecipes } from "@/lib/seed"

export async function POST(req: Request) {
  try {
    await initializeDB()
    const { username, name, email, password } = await req.json()

    if (!username || !name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({ error: "Username must be 3-20 characters (letters, numbers, underscores)" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const existingEmail = await db.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [email],
    })

    if (existingEmail.rows[0]) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 })
    }

    const existingUsername = await db.execute({
      sql: "SELECT id FROM users WHERE username = ?",
      args: [username],
    })

    if (existingUsername.rows[0]) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 })
    }

    const hashedPassword = await hash(password, 12)

    const result = await db.execute({
      sql: "INSERT INTO users (username, name, email, password) VALUES (?, ?, ?, ?)",
      args: [username, name, email, hashedPassword],
    })

    // Seed sample recipes for the new user
    const userId = String(result.lastInsertRowid)
    await seedRecipes(userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error("[register] Error:", msg)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
