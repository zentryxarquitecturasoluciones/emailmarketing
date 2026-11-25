import { neon } from "@neondatabase/serverless"
import type { DbFilter, DbOperation, DbResponse } from "./query"

const TABLES: Record<string, Record<string, string>> = {
  campaigns: {
    id: "text",
    name: "text",
    subject: "text",
    from_name: "text",
    from_email: "text",
    reply_to: "text",
    html_content: "text",
    content: "text",
    status: "text",
    module: "text",
    total_recipients: "int",
    total_sent: "int",
    sent_count: "int",
    delivered_count: "int",
    opened_count: "int",
    clicked_count: "int",
    bounced_count: "int",
    complained_count: "int",
    spam_count: "int",
    failed_count: "int",
    created_at: "timestamp",
    updated_at: "timestamp",
    sent_at: "timestamp",
  },
  campaign_recipients: {
    id: "text",
    campaign_id: "text",
    email: "text",
    email_id: "text",
    status: "text",
    row_index: "int",
    created_at: "timestamp",
  },
  email_events: {
    id: "text",
    campaign_id: "text",
    recipient_id: "text",
    contact_email: "text",
    email: "text",
    recipient_email: "text",
    event_type: "text",
    email_id: "text",
    created_at: "timestamp",
    updated_at: "timestamp",
    timestamp: "timestamp",
    metadata: "jsonb",
    key_index: "int",
  },
  system_settings: {
    key: "text",
    value: "text",
    description: "text",
    updated_at: "timestamp",
  },
  email_templates: {
    id: "text",
    name: "text",
    subject: "text",
    content: "text",
    created_at: "timestamp",
    updated_at: "timestamp",
  },
  contacts: {
    id: "text",
    email: "text",
    name: "text",
    unsubscribed: "boolean",
    subscribed: "boolean",
    unsubscribed_at: "timestamp",
    created_at: "timestamp",
    updated_at: "timestamp",
  },
  meeting_requests: {
    id: "text",
    name: "text",
    company: "text",
    phone: "text",
    email: "text",
    notes: "text",
    status: "text",
    source: "text",
    created_at: "timestamp",
    updated_at: "timestamp",
  },
}

const DEFAULT_CONFLICT: Record<string, string> = {
  system_settings: "key",
  contacts: "email",
}

let sqlClient: ReturnType<typeof neon> | null = null

function getSql() {
  if (sqlClient) return sqlClient
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING
  if (!url) {
    throw new Error("DATABASE_URL is not configured")
  }
  sqlClient = neon(url)
  return sqlClient
}

function getTable(table: string) {
  const schema = TABLES[table]
  if (!schema) throw new Error(`Unsupported table: ${table}`)
  return schema
}

function quoteId(id: string) {
  return `"${id.replace(/"/g, '""')}"`
}

function parseColumns(table: string, columns: string) {
  const schema = getTable(table)
  const raw = columns.trim()
  if (!raw || raw === "*") return Object.keys(schema).map(quoteId)
  return raw.split(",").map((part) => {
    const col = part.trim()
    if (!schema[col]) throw new Error(`Unsupported column: ${table}.${col}`)
    return quoteId(col)
  })
}

function coerceValue(table: string, column: string, value: unknown) {
  const schema = getTable(table)
  const type = schema[column]
  if (!type) throw new Error(`Unsupported column: ${table}.${column}`)
  if (value === undefined) return null
  if (value === null) return null
  if (type === "text") {
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
  }
  if (type === "int") {
    if (value === "") return null
    const n = typeof value === "number" ? value : Number(value)
    return Number.isFinite(n) ? Math.trunc(n) : null
  }
  if (type === "boolean") {
    if (typeof value === "boolean") return value
    if (value === "true" || value === "1" || value === 1) return true
    if (value === "false" || value === "0" || value === 0) return false
    return Boolean(value)
  }
  if (type === "jsonb") {
    if (typeof value === "string") return value
    return JSON.stringify(value ?? null)
  }
  if (type === "timestamp") {
    if (value instanceof Date) return value.toISOString()
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
  }
  return value
}

function normalizePayload(payload: unknown) {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === "object") return [payload as Record<string, unknown>]
  return []
}

function parseInList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value !== "string") return [value]
  const trimmed = value.trim()
  const inner = trimmed.startsWith("(") && trimmed.endsWith(")") ? trimmed.slice(1, -1) : trimmed
  if (!inner.trim()) return []
  return inner.split(",").map((part) => {
    const p = part.trim()
    if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
      return p.slice(1, -1)
    }
    return p
  }).filter((p) => p !== "")
}

function buildFilter(table: string, filter: DbFilter, params: unknown[]): string | null {
  const schema = getTable(table)
  if (!schema[filter.column]) throw new Error(`Unsupported column: ${table}.${filter.column}`)
  const col = quoteId(filter.column)
  const op = filter.op

  if (op === "eq") { params.push(coerceValue(table, filter.column, filter.value)); return `${col} = $${params.length}` }
  if (op === "neq") { params.push(coerceValue(table, filter.column, filter.value)); return `${col} <> $${params.length}` }
  if (op === "gt") { params.push(coerceValue(table, filter.column, filter.value)); return `${col} > $${params.length}` }
  if (op === "gte") { params.push(coerceValue(table, filter.column, filter.value)); return `${col} >= $${params.length}` }
  if (op === "lt") { params.push(coerceValue(table, filter.column, filter.value)); return `${col} < $${params.length}` }
  if (op === "lte") { params.push(coerceValue(table, filter.column, filter.value)); return `${col} <= $${params.length}` }
  if (op === "like") { params.push(filter.value as any); return `${col} LIKE $${params.length}` }
  if (op === "ilike") { params.push(filter.value as any); return `${col} ILIKE $${params.length}` }
  if (op === "is") {
    if (filter.value === null) return `${col} IS NULL`
    if (filter.value === true) return `${col} IS TRUE`
    if (filter.value === false) return `${col} IS FALSE`
    params.push(coerceValue(table, filter.column, filter.value))
    return `${col} IS NOT DISTINCT FROM $${params.length}`
  }
  if (op === "in") {
    const list = Array.isArray(filter.value) ? filter.value : parseInList(filter.value)
    if (list.length === 0) return "FALSE"
    const placeholders = list.map((v) => { params.push(coerceValue(table, filter.column, v)); return `$${params.length}` })
    return `${col} IN (${placeholders.join(", ")})`
  }
  if (op === "not") {
    const operator = String(filter.operator || "").toLowerCase()
    if (operator === "is") {
      if (filter.value === null) return `${col} IS NOT NULL`
      params.push(coerceValue(table, filter.column, filter.value))
      return `${col} IS DISTINCT FROM $${params.length}`
    }
    if (operator === "in") {
      const list = parseInList(filter.value)
      if (list.length === 0) return null
      const placeholders = list.map((v) => { params.push(coerceValue(table, filter.column, v)); return `$${params.length}` })
      return `${col} NOT IN (${placeholders.join(", ")})`
    }
    if (operator === "like") { params.push(filter.value as any); return `${col} NOT LIKE $${params.length}` }
    if (operator === "ilike") { params.push(filter.value as any); return `${col} NOT ILIKE $${params.length}` }
    if (operator === "eq") { params.push(coerceValue(table, filter.column, filter.value)); return `${col} <> $${params.length}` }
    throw new Error(`Unsupported not operator: ${operator}`)
  }
  throw new Error(`Unsupported filter op: ${op}`)
}

function buildWhere(table: string, filters: DbFilter[], params: unknown[]) {
  const clauses = filters.map((f) => buildFilter(table, f, params)).filter(Boolean) as string[]
  if (clauses.length === 0) return ""
  return ` WHERE ${clauses.join(" AND ")}`
}

function buildOrder(table: string, operation: DbOperation) {
  const schema = getTable(table)
  if (operation.order.length === 0) return ""
  const parts = operation.order.map((o) => {
    if (!schema[o.column]) throw new Error(`Unsupported column: ${table}.${o.column}`)
    return `${quoteId(o.column)} ${o.ascending ? "ASC" : "DESC"}`
  })
  return ` ORDER BY ${parts.join(", ")}`
}

function buildLimitOffset(operation: DbOperation) {
  let sql = ""
  if (operation.range) {
    const limit = Math.max(0, operation.range.to - operation.range.from + 1)
    const offset = Math.max(0, operation.range.from)
    sql += ` LIMIT ${limit} OFFSET ${offset}`
    return sql
  }
  if (operation.limit !== null && operation.limit !== undefined) {
    sql += ` LIMIT ${Math.max(0, Math.trunc(operation.limit))}`
  }
  return sql
}

function normalizeRows(rows: unknown): Record<string, unknown>[] {
  if (Array.isArray(rows)) return rows as Record<string, unknown>[]
  if (rows && typeof rows === "object") return [rows as Record<string, unknown>]
  return []
}

function shapeResponse(operation: DbOperation, rows: Record<string, unknown>[], count: number | null): DbResponse {
  if (operation.action === "select" && operation.head) {
    return { data: null, error: null, count }
  }
  if (operation.single) {
    return { data: rows[0] ?? null, error: null, count }
  }
  if (operation.action !== "select" && !operation.returning) {
    return { data: null, error: null, count }
  }
  return { data: rows, error: null, count }
}

async function runSelect(sql: ReturnType<typeof neon>, operation: DbOperation): Promise<DbResponse> {
  const params: unknown[] = []
  const table = quoteId(operation.table)
  const where = buildWhere(operation.table, operation.filters, params)
  const order = buildOrder(operation.table, operation)
  const limitOffset = buildLimitOffset(operation)

  if (operation.head && operation.count === "exact") {
    const countSql = `SELECT COUNT(*)::int AS count FROM ${table}${where}`
    const result = normalizeRows(await sql.query(countSql, params))
    const count = Number(result[0]?.count ?? 0)
    return { data: null, error: null, count }
  }

  const cols = parseColumns(operation.table, operation.columns).join(", ")
  const dataSql = `SELECT ${cols} FROM ${table}${where}${order}${limitOffset}`
  const rows = normalizeRows(await sql.query(dataSql, params))

  let count: number | null = null
  if (operation.count === "exact") {
    const countParams: unknown[] = []
    const countWhere = buildWhere(operation.table, operation.filters, countParams)
    const countSql = `SELECT COUNT(*)::int AS count FROM ${table}${countWhere}`
    const countRows = normalizeRows(await sql.query(countSql, countParams))
    count = Number(countRows[0]?.count ?? 0)
  }

  return shapeResponse(operation, rows, count)
}

function buildInsertRows(operation: DbOperation) {
  const rows = normalizePayload(operation.payload)
  if (rows.length === 0) throw new Error("Insert payload is required")
  const schema = getTable(operation.table)
  const columns = Array.from(new Set(rows.flatMap((r) => Object.keys(r)))).filter((c) => schema[c])
  if (columns.length === 0) throw new Error("No valid columns to insert")
  return { rows, columns }
}

async function runInsert(sql: ReturnType<typeof neon>, operation: DbOperation): Promise<DbResponse> {
  const { rows, columns } = buildInsertRows(operation)
  const params: unknown[] = []
  const valuesSql = rows.map((row) => {
    const vals = columns.map((col) => {
      params.push(coerceValue(operation.table, col, (row as any)[col]))
      return `$${params.length}`
    })
    return `(${vals.join(", ")})`
  }).join(", ")
  const returning = operation.returning || operation.single ? ` RETURNING ${parseColumns(operation.table, operation.columns).join(", ")}` : ""
  const query = `INSERT INTO ${quoteId(operation.table)} (${columns.map(quoteId).join(", ")}) VALUES ${valuesSql}${returning}`
  const result = normalizeRows(await sql.query(query, params))
  return shapeResponse(operation, result, null)
}

async function runUpsert(sql: ReturnType<typeof neon>, operation: DbOperation): Promise<DbResponse> {
  const { rows, columns } = buildInsertRows(operation)
  const conflictCol = operation.onConflict || DEFAULT_CONFLICT[operation.table] || "id"
  const schema = getTable(operation.table)
  if (!schema[conflictCol]) throw new Error(`Unsupported conflict column: ${operation.table}.${conflictCol}`)
  const params: unknown[] = []
  const valuesSql = rows.map((row) => {
    const vals = columns.map((col) => {
      params.push(coerceValue(operation.table, col, (row as any)[col]))
      return `$${params.length}`
    })
    return `(${vals.join(", ")})`
  }).join(", ")
  const updateCols = columns.filter((c) => c !== conflictCol)
  const updateSql = updateCols.length > 0
    ? ` DO UPDATE SET ${updateCols.map((c) => `${quoteId(c)} = EXCLUDED.${quoteId(c)}`).join(", ")}`
    : ` DO NOTHING`
  const returning = operation.returning || operation.single ? ` RETURNING ${parseColumns(operation.table, operation.columns).join(", ")}` : ""
  const query = `INSERT INTO ${quoteId(operation.table)} (${columns.map(quoteId).join(", ")}) VALUES ${valuesSql} ON CONFLICT (${quoteId(conflictCol)})${updateSql}${returning}`
  const result = normalizeRows(await sql.query(query, params))
  return shapeResponse(operation, result, null)
}

async function runUpdate(sql: ReturnType<typeof neon>, operation: DbOperation): Promise<DbResponse> {
  const payload = (operation.payload && typeof operation.payload === "object" && !Array.isArray(operation.payload))
    ? operation.payload as Record<string, unknown>
    : null
  if (!payload) throw new Error("Update payload is required")
  const schema = getTable(operation.table)
  const columns = Object.keys(payload).filter((c) => schema[c])
  if (columns.length === 0) throw new Error("No valid columns to update")
  const params: unknown[] = []
  const setSql = columns.map((col) => {
    params.push(coerceValue(operation.table, col, payload[col]))
    return `${quoteId(col)} = $${params.length}`
  }).join(", ")
  const where = buildWhere(operation.table, operation.filters, params)
  const returning = operation.returning || operation.single ? ` RETURNING ${parseColumns(operation.table, operation.columns).join(", ")}` : ""
  const query = `UPDATE ${quoteId(operation.table)} SET ${setSql}${where}${returning}`
  const result = normalizeRows(await sql.query(query, params))
  return shapeResponse(operation, result, null)
}

async function runDelete(sql: ReturnType<typeof neon>, operation: DbOperation): Promise<DbResponse> {
  const params: unknown[] = []
  const where = buildWhere(operation.table, operation.filters, params)
  const returning = operation.returning || operation.single ? ` RETURNING ${parseColumns(operation.table, operation.columns).join(", ")}` : ""
  const query = `DELETE FROM ${quoteId(operation.table)}${where}${returning}`
  const result = normalizeRows(await sql.query(query, params))
  return shapeResponse(operation, result, null)
}

export async function executeOperation(operation: DbOperation): Promise<DbResponse> {
  try {
    const sql = getSql()
    getTable(operation.table)

    if (operation.action === "select") return await runSelect(sql, operation)
    if (operation.action === "insert") return await runInsert(sql, operation)
    if (operation.action === "upsert") return await runUpsert(sql, operation)
    if (operation.action === "update") return await runUpdate(sql, operation)
    if (operation.action === "delete") return await runDelete(sql, operation)
    return { data: null, error: { message: `Unsupported action: ${String((operation as any).action)}` }, count: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { data: null, error: { message }, count: null }
  }
}
