"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"

export default function HeaderNav() {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/register"

  if (isAuthPage) return null

  return (
    <nav className="flex justify-center flex-wrap gap-4 mt-3 text-sm font-medium">
      <Link href="/" className="hover:text-yellow-200 transition-colors">🍰 Recetas</Link>
      <Link href="/crear-ia" className="hover:text-yellow-200 transition-colors">🧠 IA</Link>
      <Link href="/productos" className="hover:text-yellow-200 transition-colors">📦 Productos</Link>
      <Link href="/chat" className="hover:text-yellow-200 transition-colors">💬 Chat</Link>
      <Link href="/escanear" className="hover:text-yellow-200 transition-colors">📸 Escanear</Link>
      <Link href="/configuracion" className="hover:text-yellow-200 transition-colors">⚙️ Moneda</Link>
    </nav>
  )
}
