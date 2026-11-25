// IndexedDB storage for large CSV data (supports 100MB+)
const DB_NAME = "campaign_csv_db"
const DB_VERSION = 1
const STOpv_NAME = "csv_data"

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STOpv_NAME)) {
        db.createObjectStore(STOpv_NAME, { keyPath: "campaignId" })
      }
    }
  })
}

export async function saveCsvDataLarge(campaignId: string, csvDataMap: Record<string, any>): Promise<void> {
  const recordCount = Object.keys(csvDataMap).length
  console.log(`[David DEV version 3.5] Guardando ${recordCount.toLocaleString()} registros CSV en IndexedDB...`)

  try {
    const db = await openDB()
    const transaction = db.transaction(STOpv_NAME, "readwrite")
    const store = transaction.objectStore(STOpv_NAME)

    const data = {
      campaignId,
      csvDataMap,
      createdAt: new Date().toISOString(),
    }

    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => {
        console.log(`[David DEV version 3.5] CSV guardado en IndexedDB correctamente`)
        resolve()
      }
      request.onerror = () => {
        console.log(`[David DEV version 3.5] Error guardando en IndexedDB: ${request.error}`)
        reject(request.error)
      }
    })
  } catch (error) {
    console.log(`[David DEV version 3.5] IndexedDB no disponible, usando localStorage como fallback`)
    // Fallback to localStorage with truncation
    const jsonStr = JSON.stringify(csvDataMap)
    if (jsonStr.length > 4 * 1024 * 1024) {
      const truncated: Record<string, any> = {}
      const keys = Object.keys(csvDataMap)
      for (let i = 0; i < Math.min(keys.length, 50000); i++) {
        truncated[keys[i]] = csvDataMap[keys[i]]
      }
      localStorage.setItem(`campaign_csv_data_${campaignId}`, JSON.stringify(truncated))
    } else {
      localStorage.setItem(`campaign_csv_data_${campaignId}`, jsonStr)
    }
  }
}

export async function loadCsvDataLarge(campaignId: string): Promise<Record<string, any>> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STOpv_NAME, "readonly")
    const store = transaction.objectStore(STOpv_NAME)

    return new Promise((resolve) => {
      const request = store.get(campaignId)
      request.onsuccess = () => {
        if (request.result?.csvDataMap) {
          console.log(
            `[David DEV version 3.5] CSV cargado desde IndexedDB: ${Object.keys(request.result.csvDataMap).length.toLocaleString()} registros`,
          )
          resolve(request.result.csvDataMap)
        } else {
          // Fallback to localStorage
          const localData = localStorage.getItem(`campaign_csv_data_${campaignId}`)
          if (localData) {
            const parsed = JSON.parse(localData)
            console.log(
              `[David DEV version 3.5] CSV cargado desde localStorage: ${Object.keys(parsed).length.toLocaleString()} registros`,
            )
            resolve(parsed)
          } else {
            resolve({})
          }
        }
      }
      request.onerror = () => {
        // Fallback to localStorage
        try {
          const localData = localStorage.getItem(`campaign_csv_data_${campaignId}`)
          resolve(localData ? JSON.parse(localData) : {})
        } catch {
          resolve({})
        }
      }
    })
  } catch {
    // Fallback to localStorage
    try {
      const localData = localStorage.getItem(`campaign_csv_data_${campaignId}`)
      return localData ? JSON.parse(localData) : {}
    } catch {
      return {}
    }
  }
}

export async function deleteCsvData(campaignId: string): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(STOpv_NAME, "readwrite")
    const store = transaction.objectStore(STOpv_NAME)
    store.delete(campaignId)
    localStorage.removeItem(`campaign_csv_data_${campaignId}`)
  } catch {
    localStorage.removeItem(`campaign_csv_data_${campaignId}`)
  }
}
