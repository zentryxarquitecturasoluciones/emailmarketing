import { createQueryClient, type DbOperation, type DbResponse } from "./query"

async function browserRunner(operation: DbOperation): Promise<DbResponse> {
  try {
    const response = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(operation),
    })
    const json = await response.json().catch(() => null)
    if (!response.ok) {
      const message = json?.error?.message || `Request failed with status ${response.status}`
      return { data: null, error: { message }, count: null }
    }
    if (!json || typeof json !== "object") {
      return { data: null, error: { message: "Invalid response from /api/db" }, count: null }
    }
    return {
      data: (json as any).data ?? null,
      error: (json as any).error ?? null,
      count: (json as any).count ?? null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { data: null, error: { message }, count: null }
  }
}

export function createClient(..._args: unknown[]) {
  return createQueryClient(browserRunner)
}

export function createPortalAClient(..._args: unknown[]) {
  return createClient()
}

export function createPortalBClient(..._args: unknown[]) {
  return createClient()
}

export function getSupabasePortalA(..._args: unknown[]) {
  return createClient()
}

export function getSupabasePortalB(..._args: unknown[]) {
  return createClient()
}

export const supabasePortalA = createClient()
export const supabasePortalB = createClient()
