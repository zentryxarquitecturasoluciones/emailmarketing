import { neon } from "@neondatabase/serverless"
import { readFileSync, existsSync } from "node:fs"
import { resolve } from "node:path"

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  const content = readFileSync(filePath, "utf8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"))
loadEnvFile(resolve(process.cwd(), ".env"))

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING
if (!databaseUrl) {
  console.error("Missing DATABASE_URL/POSTGRES_URL")
  process.exit(1)
}

const sqlFile = resolve(process.cwd(), "scripts/020_postgres_schema.sql")
const schema = readFileSync(sqlFile, "utf8")
const statements = schema
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0)

const sql = neon(databaseUrl)

for (const statement of statements) {
  await sql.query(statement)
}

console.log(`Applied ${statements.length} statements`)
