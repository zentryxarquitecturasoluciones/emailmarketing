export interface EmailProcessResult {
  valid: string[]
  invalid: string[]
  validCount: number
  invalidCount: number
}

export const MAX_RECIPIENTS = 50000

const INVALID_WORDS = ["pepito", "perez", "lapicero", "botella", "vidrio"]

export function isInvalidEmail(email: string): boolean {
  const lowerEmail = email.toLowerCase()
  return INVALID_WORDS.some((word) => lowerEmail.includes(word))
}

export function processEmailsAsync(
  text: string,
  onProgress?: (processed: number, total: number) => void,
  onComplete?: (result: EmailProcessResult) => void,
): () => void {
  const lines = text.split(/[\n,;]+/)
  const totalLines = lines.length
  const valid: string[] = []
  const invalid: string[] = []
  let currentIndex = 0
  let cancelled = false
  const CHUNK_SIZE = MAX_RECIPIENTS

  console.log(`[David DEV version 3.5] Procesando ${totalLines.toLocaleString()} líneas...`)

  function processChunk() {
    if (cancelled) return

    const startIndex = currentIndex
    const endIndex = Math.min(currentIndex + CHUNK_SIZE, totalLines)

    for (let i = startIndex; i < endIndex; i++) {
      const email = lines[i].trim().toLowerCase()
      if (email && email.includes("@")) {
        if (isInvalidEmail(email)) {
          invalid.push(email)
        } else {
          valid.push(email)
        }
      }
    }

    currentIndex = endIndex
    onProgress?.(currentIndex, totalLines)

    if (currentIndex < totalLines) {
      setTimeout(() => processChunk(), 0)
    } else {
      console.log(
        `[David DEV version 3.5] Procesamiento completo: ${valid.length.toLocaleString()} válidos, ${invalid.length.toLocaleString()} inválidos`,
      )
      onComplete?.({
        valid,
        invalid,
        validCount: valid.length,
        invalidCount: invalid.length,
      })
    }
  }

  setTimeout(() => processChunk(), 0)

  return () => {
    cancelled = true
  }
}

export function countEmailsAsync(
  text: string,
  onProgress?: (processed: number, total: number) => void,
  onComplete?: (counts: { valid: number; invalid: number }) => void,
): () => void {
  const lines = text.split(/[\n,;]+/)
  const totalLines = lines.length
  let validCount = 0
  let invalidCount = 0
  let currentIndex = 0
  let cancelled = false
  const CHUNK_SIZE = MAX_RECIPIENTS

  function processChunk() {
    if (cancelled) return

    const endIndex = Math.min(currentIndex + CHUNK_SIZE, totalLines)

    for (let i = currentIndex; i < endIndex; i++) {
      const email = lines[i].trim().toLowerCase()
      if (email && email.includes("@")) {
        if (isInvalidEmail(email)) {
          invalidCount++
        } else {
          validCount++
        }
      }
    }

    currentIndex = endIndex
    onProgress?.(currentIndex, totalLines)

    if (currentIndex < totalLines) {
      setTimeout(() => processChunk(), 0)
    } else {
      console.log(
        `[David DEV version 3.5] Conteo: ${validCount.toLocaleString()} válidos, ${invalidCount.toLocaleString()} inválidos`,
      )
      onComplete?.({ valid: validCount, invalid: invalidCount })
    }
  }

  setTimeout(() => processChunk(), 0)

  return () => {
    cancelled = true
  }
}

export function parseCSVLarge(
  text: string,
  onProgress?: (processed: number, total: number) => void,
): Promise<{ headers: string[]; data: Record<string, any>[] }> {
  return new Promise((resolve) => {
    const lines = text.split(/\r?\n/)
    const totalLines = lines.length

    if (totalLines === 0) {
      resolve({ headers: [], data: [] })
      return
    }

    function parseCSVLine(line: string): string[] {
      const result: string[] = []
      let current = ""
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (char === '"' && !inQuotes) {
          inQuotes = true
        } else if (char === '"' && inQuotes) {
          if (nextChar === '"') {
            current += '"'
            i++ // Skip next quote
          } else {
            inQuotes = false
          }
        } else if (char === "," && !inQuotes) {
          result.push(current.trim())
          current = ""
        } else {
          current += char
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/['"]/g, ""))
    const data: Record<string, any>[] = []

    let currentIndex = 1
    const CHUNK_SIZE = 10000

    console.log(
      `[David DEV version 3.5] Parseando CSV: ${totalLines.toLocaleString()} líneas, ${headers.length} columnas`,
    )

    function parseChunk() {
      const endIndex = Math.min(currentIndex + CHUNK_SIZE, totalLines)

      for (let i = currentIndex; i < endIndex; i++) {
        const line = lines[i]
        if (!line.trim()) continue

        const values = parseCSVLine(line).map((v) => v.replace(/^["']|["']$/g, ""))

        const row: Record<string, any> = {}
        headers.forEach((header, idx) => {
          row[header] = values[idx] || ""
        })
        data.push(row)
      }

      currentIndex = endIndex
      onProgress?.(currentIndex, totalLines)

      if (currentIndex < totalLines) {
        setTimeout(() => parseChunk(), 0)
      } else {
        console.log(`[David DEV version 3.5] CSV parseado: ${data.length.toLocaleString()} registros`)
        resolve({ headers, data })
      }
    }

    setTimeout(() => parseChunk(), 0)
  })
}

export function createCsvDataMap(
  data: Record<string, any>[],
  onProgress?: (processed: number, total: number) => void,
): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    const csvDataMap: Record<string, any> = {}
    const total = data.length
    let currentIndex = 0
    const CHUNK_SIZE = 20000

    console.log(`[David DEV version 3.5] Creando mapa de datos para ${total.toLocaleString()} registros...`)

    function processChunk() {
      const endIndex = Math.min(currentIndex + CHUNK_SIZE, total)

      for (let i = currentIndex; i < endIndex; i++) {
        const row = data[i]
        const emailField = row.email || row.correo || row.e_mail || ""
        const rowEmails = emailField
          .toString()
          .split(";")
          .map((e: string) => e.trim().toLowerCase())
          .filter((e: string) => e)

        for (const email of rowEmails) {
          csvDataMap[email] = row
        }
      }

      currentIndex = endIndex
      onProgress?.(currentIndex, total)

      if (currentIndex < total) {
        setTimeout(() => processChunk(), 0)
      } else {
        console.log(
          `[David DEV version 3.5] Mapa creado: ${Object.keys(csvDataMap).length.toLocaleString()} emails mapeados`,
        )
        resolve(csvDataMap)
      }
    }

    setTimeout(() => processChunk(), 0)
  })
}

export { saveCsvDataLarge as saveCsvDataMap } from "./csv-storage"
