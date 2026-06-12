import { auth } from "./auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const path = req.nextUrl.pathname
  const isLoggedIn = !!req.auth

  const protectedRoutes = ["/crear", "/crear-ia", "/editar", "/escalar-dimensiones", "/escanear", "/productos", "/chat", "/configuracion"]
  const authRoutes = ["/login", "/register"]

  const isProtected = protectedRoutes.some(route => path.startsWith(route))
  const isAuthPage = authRoutes.some(route => path.startsWith(route))
  const isHome = path === "/"

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.nextUrl))
  }

  if ((isProtected || isHome) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
}

