import { createQueryClient, type DbOperation, type DbResponse } from "./query"

async function browserRunner(operation: DbOperation): Promise<DbResponse> {
  const response = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(operation),
  })
  const json = await response.json().catch(() => null)
  if (!response.ok) {
    return { data: null, error: { message: json?.error?.message || `Request failed with status ${response.status}` }, count: null }
  }
  return { data: json?.data ?? null, error: json?.error ?? null, count: json?.count ?? null }
}

async function serverRunner(operation: DbOperation): Promise<DbResponse> {
  const { executeOperation } = await import("./executor")
  return executeOperation(operation)
}

function getRunner() {
  return typeof window === "undefined" ? serverRunner : browserRunner
}

function createPortalClient() {
  return createQueryClient((operation) => getRunner()(operation))
}

export function createPortalAClient(..._args: unknown[]) {
  return createPortalClient()
}

export function createPortalBClient(..._args: unknown[]) {
  return createPortalClient()
}

export function getSupabasePortalA(..._args: unknown[]) {
  return createPortalClient()
}

export function getSupabasePortalB(..._args: unknown[]) {
  return createPortalClient()
}

export const supabasePortalA = createPortalClient()
export const supabasePortalB = createPortalClient()
export const supabasePortalAServer = createPortalClient()
export const supabasePortalBServer = createPortalClient()
