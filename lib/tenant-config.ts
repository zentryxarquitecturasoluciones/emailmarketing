export interface TenantConfig {
  name: string
  domain: string
  logo: string
  password: string
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey: string
  }
  SMTPPrivateOD92: {
    apiKey: string
  }
  colors: {
    primary: string
    secondary: string
  }
  email: {
    from: string
    replyTo: string
  }
}

export const ZENTRYX_CONFIG: TenantConfig = {
  name: "Data Zentryx",
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN || "datazentryx",
  logo: "/logo_zentryx.png",
  password: process.env.DASHBOARD_PASSWORD || "",
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  },
  SMTPPrivateOD92: {
    apiKey: process.env.MAIL_API_KEY || "",
  },
  colors: {
    primary: "13 18 11",
    secondary: "141 239 7",
  },
  email: {
    from: process.env.MAIL_FROM_EMAIL || "zentryxarquitecturadesoluciones@gmail.com",
    replyTo: process.env.MAIL_REPLY_TO || "zentryxarquitecturadesoluciones@gmail.com",
  },
}

export function getTenantConfig(_hostname?: string): TenantConfig {
  return ZENTRYX_CONFIG
}
