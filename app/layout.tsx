import type React from "react"
import type { Metadata } from "next"
import { Fraunces, Inter } from "next/font/google"
import "./globals.css"
import { headers } from "next/headers"
import { getTenantConfig } from "@/lib/tenant-config"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" })

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers()
  const hostname = headersList.get("host") || ""
  const tenantConfig = getTenantConfig(hostname)

  return {
    title: `${tenantConfig.name} | Email Marketing`,
    description: `Plataforma de email marketing de ${tenantConfig.name}`,
    icons: {
      icon: "/logo_zentryx.png",
      apple: "/logo_zentryx.png",
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${fraunces.variable} font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
