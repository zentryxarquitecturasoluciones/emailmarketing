export type DbError = { message: string }

export type DbResponse<T = any> = {
  data: T | null
  error: DbError | null
  count: number | null
}

type FilterOp =
  | "eq"
  | "neq"
  | "is"
  | "not"
  | "like"
  | "ilike"
  | "in"
  | "gte"
  | "gt"
  | "lt"
  | "lte"

export type DbFilter = {
  op: FilterOp
  column: string
  value?: unknown
  operator?: string
}

export type DbOrder = {
  column: string
  ascending: boolean
}

export type DbRange = {
  from: number
  to: number
}

export type DbOperation = {
  table: string
  action: "select" | "insert" | "upsert" | "update" | "delete"
  columns: string
  payload?: unknown
  filters: DbFilter[]
  order: DbOrder[]
  range: DbRange | null
  limit: number | null
  count: "exact" | null
  head: boolean
  single: boolean
  returning: boolean
  onConflict?: string
}

export type DbRunner = (operation: DbOperation) => Promise<DbResponse>

export class QueryBuilder<T = any> implements PromiseLike<DbResponse<T>> {
  private operation: DbOperation
  private runner: DbRunner
  private executed: Promise<DbResponse<T>> | null = null

  constructor(table: string, runner: DbRunner) {
    this.operation = {
      table,
      action: "select",
      columns: "*",
      filters: [],
      order: [],
      range: null,
      limit: null,
      count: null,
      head: false,
      single: false,
      returning: false,
    }
    this.runner = runner
  }

  select(columns = "*", options?: { count?: "exact"; head?: boolean }): this {
    if (this.operation.action === "select") {
      this.operation.columns = columns
      this.operation.count = options?.count ?? null
      this.operation.head = options?.head ?? false
      return this
    }
    this.operation.returning = true
    this.operation.columns = columns
    this.operation.count = options?.count ?? this.operation.count
    this.operation.head = options?.head ?? this.operation.head
    return this
  }

  insert(payload: unknown): this {
    this.operation.action = "insert"
    this.operation.payload = payload
    this.operation.returning = false
    return this
  }

  upsert(payload: unknown, options?: { onConflict?: string }): this {
    this.operation.action = "upsert"
    this.operation.payload = payload
    this.operation.onConflict = options?.onConflict
    this.operation.returning = false
    return this
  }

  update(payload: unknown): this {
    this.operation.action = "update"
    this.operation.payload = payload
    this.operation.returning = false
    return this
  }

  delete(): this {
    this.operation.action = "delete"
    this.operation.payload = undefined
    this.operation.returning = false
    return this
  }

  eq(column: string, value: unknown): this {
    this.operation.filters.push({ op: "eq", column, value })
    return this
  }

  neq(column: string, value: unknown): this {
    this.operation.filters.push({ op: "neq", column, value })
    return this
  }

  is(column: string, value: unknown): this {
    this.operation.filters.push({ op: "is", column, value })
    return this
  }

  not(column: string, operator: string, value: unknown): this {
    this.operation.filters.push({ op: "not", column, operator, value })
    return this
  }

  like(column: string, value: unknown): this {
    this.operation.filters.push({ op: "like", column, value })
    return this
  }

  ilike(column: string, value: unknown): this {
    this.operation.filters.push({ op: "ilike", column, value })
    return this
  }

  in(column: string, value: unknown): this {
    this.operation.filters.push({ op: "in", column, value })
    return this
  }

  gte(column: string, value: unknown): this {
    this.operation.filters.push({ op: "gte", column, value })
    return this
  }

  gt(column: string, value: unknown): this {
    this.operation.filters.push({ op: "gt", column, value })
    return this
  }

  lt(column: string, value: unknown): this {
    this.operation.filters.push({ op: "lt", column, value })
    return this
  }

  lte(column: string, value: unknown): this {
    this.operation.filters.push({ op: "lte", column, value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }): this {
    this.operation.order.push({ column, ascending: options?.ascending ?? true })
    return this
  }

  range(from: number, to: number): this {
    this.operation.range = { from, to }
    return this
  }

  limit(value: number): this {
    this.operation.limit = value
    return this
  }

  single(): this {
    this.operation.single = true
    return this
  }

  maybeSingle(): this {
    this.operation.single = true
    return this
  }

  then<TResult1 = DbResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: DbResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    if (!this.executed) {
      this.executed = this.runner(this.operation) as Promise<DbResponse<T>>
    }
    return this.executed.then(onfulfilled, onrejected)
  }
}

export function createQueryClient(runner: DbRunner) {
  return {
    from(table: string) {
      return new QueryBuilder(table, runner)
    },
  }
}
