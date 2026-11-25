import { createQueryClient, type DbOperation, type DbResponse } from "./query"

async function serverRunner(operation: DbOperation): Promise<DbResponse> {
  const { executeOperation } = await import("./executor")
  return executeOperation(operation)
}

export async function createClient(..._args: unknown[]) {
  return createQueryClient(serverRunner)
}

export async function createServerClient(..._args: unknown[]) {
  return createClient(..._args)
}
