"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"

export default function AuthNav() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <span className="text-pink-100 text-sm animate-pulse">...</span>
    )
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-pink-100 text-sm hidden sm:inline">
          {session.user.name || session.user.email}
        </span>
        <button
          onClick={() => signOut({ redirectTo: "/login" })}
          className="text-xs bg-pink-600 hover:bg-pink-700 text-white px-3 py-1 rounded transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className="text-xs bg-pink-600 hover:bg-pink-700 text-white px-3 py-1 rounded transition-colors"
    >
      Iniciar sesión
    </Link>
  )
}
