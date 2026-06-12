import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { compare } from "bcryptjs"
import { db, initializeDB } from "@/lib/db"

declare module "next-auth" {
  interface User {
    id: string
    username?: string | null
  }
  interface Session {
    user: {
      id: string
      username?: string | null
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}


async function findOrCreateGoogleUser(profile: { email?: string | null; name?: string | null; picture?: string | null; sub?: string }) {
  if (!profile.email) return null
  await initializeDB()

  const existing = await db.execute(
    "SELECT id, username, name, email, image FROM users WHERE google_id = ? OR email = ?",
    [profile.sub ?? null, profile.email]
  )

  if (existing.rows[0]) {
    const row = existing.rows[0] as any
    if (!row.google_id) {
      await db.execute(
        "UPDATE users SET google_id = ?, image = COALESCE(?, image), updated_at = datetime('now') WHERE id = ?",
        [profile.sub!, profile.picture ?? null, row.id]
      )
    }
    return { id: String(row.id), username: row.username, name: row.name, email: row.email, image: row.image }
  }

  const result = await db.execute(
    "INSERT INTO users (name, email, google_id, image) VALUES (?, ?, ?, ?) RETURNING id, username",
    [profile.name ?? "Usuario", profile.email!, profile.sub!, profile.picture ?? null]
  )

  const newUser = result.rows[0] as any
  return { id: String(newUser.id), username: newUser.username, name: profile.name, email: profile.email, image: profile.picture }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email", placeholder: "correo@ejemplo.com" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        await initializeDB()

        const result = await db.execute(
          "SELECT id, username, name, email, password FROM users WHERE email = ? OR username = ?",
          [credentials.email as string, credentials.email as string]
        )

        const user = result.rows[0] as any
        if (!user || !user.password) return null

        const isValid = await compare(credentials.password as string, user.password)
        if (!isValid) return null

        return { id: String(user.id), username: user.username, name: user.name, email: user.email }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && profile) {
        const dbUser = await findOrCreateGoogleUser({
          email: profile.email as string,
          name: profile.name as string,
          picture: (profile as any).picture,
          sub: (profile as any).sub,
        })
        if (dbUser) {
          token.id = dbUser.id
          token.username = dbUser.username
          token.picture = dbUser.image
        }
      } else if (user) {
        token.id = user.id
        token.username = user.username
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string | undefined
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
