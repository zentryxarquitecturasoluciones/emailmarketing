import { NextResponse } from "next/server"
import { isValidAuthToken } from "@/lib/auth"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = [
  "/login",
  "/unsubscribe",
  "/api/auth/",
  "/api/unsubscribe",
  "/api/webhooks",
]

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) return true
  if (pathname.includes("/webhooks/")) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const session = request.cookies.get("zentryx-auth")

  if (await isValidAuthToken(session?.value, process.env.DASHBOARD_PASSWORD || "")) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("next", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico|logo_zentryx.png|.*\\.(?:png|jpg|jpeg|svg|ico|webp|css|js)$).*)"],
}
