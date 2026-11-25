"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Send, Mail, Users, Pause, Play, XCircle, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { loadCsvDataLarge, saveCsvDataLarge, deleteCsvData } from "@/lib/csv-storage"

interface UnifiedSendButtonProps {
  campaignId: string
  campaignName?: string
  totalRecipients: number
  apiPath: string
  portal?: "a" | "b"
  alreadySent?: number
  firstPendingRowIndex?: number
}

const TELEGRAM_INTERVAL = 5 * 60 * 1000
const DELAY_BETWEEN_CALLS = 10000

export function UnifiedSendButton({
  campaignId,
  campaignName = "Untitled",
  totalRecipients,
  apiPath,
  portal = "a",
  alreadySent = 0,
  firstPendingRowIndex = 0,
}: UnifiedSendButtonProps) {
  const [sending, setSending] = useState(false)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [emailsSent, setEmailsSent] = useState(0)
  const [emailsFailed, setEmailsFailed] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState("")
  const [currentCall, setCurrentCall] = useState(0)
  const [totalCalls, setTotalCalls] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")
  const [completed, setCompleted] = useState(false)
  const [needsCsvUpload, setNeedsCsvUpload] = useState(false)
  const [csvLoaded, setCsvLoaded] = useState(false)
  const [csvRecordsCount, setCsvRecordsCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startTimeRef = useRef<number>(0)
  const pausedRef = useRef<boolean>(false)
  const abortRef = useRef<boolean>(false)
  const lastTelegramRef = useRef<number>(0)
  const emailsSentRef = useRef<number>(0)
  const emailsFailedRef = useRef<number>(0)
  const progressRef = useRef<number>(0)
  const timeElapsedRef = useRef<number>(0)
  const estimatedRemainingRef = useRef<string>("")

  useEffect(() => {
    const checkCsv = async () => {
      const csvData = await loadCsvDataLarge(campaignId)
      const count = Object.keys(csvData).length
      setCsvRecordsCount(count)
      setCsvLoaded(count > 0)
      // Si hay emails ya enviados pero no hay CSV, necesita cargarlo
      if (alreadySent > 0 && count === 0) {
        setNeedsCsvUpload(true)
      }
    }
    checkCsv()
  }, [campaignId, alreadySent])

  const sendTelegramNotification = async (
    status: "started" | "progress" | "completed" | "paused" | "cancelled" | "error",
    overrideSent?: number,
    overrideFailed?: number,
    overrideProgress?: number,
    overrideElapsed?: string,
    overrideRemaining?: string,
  ) => {
    try {
      const sent = typeof overrideSent === "number" ? overrideSent : emailsSentRef.current
      const failed = typeof overrideFailed === "number" ? overrideFailed : emailsFailedRef.current
      const prog = typeof overrideProgress === "number" ? overrideProgress : progressRef.current
      const elapsed = overrideElapsed || formatTime(timeElapsedRef.current) || "0s"
      const remaining = overrideRemaining || estimatedRemainingRef.current || ""

      await fetch("/api/telegram/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaignId || "unknown",
          campaignName: campaignName || "Campaign",
          portal: portal || "a",
          totalEmails: totalRecipients || 0,
          sentEmails: sent || 0,
          failedEmails: failed || 0,
          progress: Math.round(prog) || 0,
          elapsedTime: elapsed,
          estimatedRemaining: remaining,
          status,
        }),
      })
    } catch {
      // Silent fail
    }
  }

  useEffect(() => {
    let timeInterval: NodeJS.Timeout

    if (sending && !paused && !completed) {
      if (startTimeRef.current === 0) {
        startTimeRef.current = Date.now()
      }

      timeInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setTimeElapsed(elapsed)
        timeElapsedRef.current = elapsed

        if (emailsSentRef.current > 0) {
          const remainingEmails = totalRecipients - emailsSentRef.current
          const emailsPerSecond = emailsSentRef.current / Math.max(elapsed, 1)
          const remainingSeconds = Math.ceil(remainingEmails / Math.max(emailsPerSecond, 0.1))

          let remaining = ""
          if (remainingSeconds > 3600) {
            remaining = `${Math.floor(remainingSeconds / 3600)}h ${Math.floor((remainingSeconds % 3600) / 60)}m`
          } else if (remainingSeconds > 60) {
            remaining = `${Math.floor(remainingSeconds / 60)} min`
          } else {
            remaining = `${remainingSeconds}s`
          }
          setEstimatedTimeRemaining(remaining)
          estimatedRemainingRef.current = remaining
        }

        const now = Date.now()
        if (now - lastTelegramRef.current >= TELEGRAM_INTERVAL && emailsSentRef.current > 0) {
          lastTelegramRef.current = now
          sendTelegramNotification("progress")
        }
      }, 1000)

      return () => clearInterval(timeInterval)
    }
  }, [sending, paused, completed, totalRecipients])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const formatNumber = (num: number) => num.toLocaleString("es-ES")

  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => {
      const checkPause = setInterval(() => {
        if (abortRef.current) {
          clearInterval(checkPause)
          resolve()
        }
      }, 100)
      setTimeout(() => {
        clearInterval(checkPause)
        resolve()
      }, ms)
    })
  }

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setStatusMessage("Procesando el archivo CSV...")

    try {
      const text = await file.text()
      const lines = text.split("\n").filter((line) => line.trim())

      if (lines.length < 2) {
        setErrorMessage("El archivo CSV está vacío o no contiene datos.")
        return
      }

      const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
      const emailColumnIndex = headers.findIndex(
        (h) => h.toLowerCase() === "email" || h.toLowerCase() === "correo" || h.toLowerCase() === "e-mail",
      )

      if (emailColumnIndex === -1) {
        setErrorMessage('El archivo CSV debe incluir una columna "email".')
        return
      }

      const dataMapByIndex: Record<string, Record<string, string>> = {}

      const startRowIndex = firstPendingRowIndex > 0 ? firstPendingRowIndex : alreadySent

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        if (!line.trim()) continue

        const values: string[] = []
        let current = ""
        let inQuotes = false

        for (let j = 0; j < line.length; j++) {
          const char = line[j]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === "," && !inQuotes) {
            values.push(current.trim())
            current = ""
          } else {
            current += char
          }
        }
        values.push(current.trim())

        const rowData: Record<string, string> = {}
        headers.forEach((header, idx) => {
          rowData[header] = values[idx]?.replace(/^"|"$/g, "") || ""
        })

        const rowIndex = startRowIndex + (i - 1)
        dataMapByIndex[String(rowIndex)] = rowData
      }

      const recordCount = Object.keys(dataMapByIndex).length
      const minKey = Math.min(...Object.keys(dataMapByIndex).map(Number))
      const maxKey = Math.max(...Object.keys(dataMapByIndex).map(Number))
      console.log(`[v0] CSV procesado: ${recordCount} registros (row_index ${minKey} a ${maxKey})`)

      await saveCsvDataLarge(campaignId, dataMapByIndex)

      setCsvRecordsCount(recordCount)
      setCsvLoaded(true)
      setNeedsCsvUpload(false)
      setErrorMessage("")
      setStatusMessage(`CSV cargado: ${formatNumber(recordCount)} registros (índice de fila ${minKey} a ${maxKey})`)

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (err: any) {
      setErrorMessage(`Error al procesar el archivo CSV: ${err.message}`)
    }
  }

  const handleSend = async () => {
    const csvData = await loadCsvDataLarge(campaignId)
    const csvCount = Object.keys(csvData).length

    if (csvCount === 0 && totalRecipients > 0) {
      setNeedsCsvUpload(true)
      setErrorMessage("Sube el archivo CSV para continuar con los datos personalizados.")
      return
    }

    const confirmMessage =
      alreadySent > 0
        ? `¿Reanudar el envío? Ya se enviaron ${formatNumber(alreadySent)} de ${formatNumber(totalRecipients)} correos.\n\nRegistros CSV cargados: ${formatNumber(csvCount)}.\n\nEl envío continuará desde donde se detuvo.`
        : `¿Enviar esta campaña a ${formatNumber(totalRecipients)} destinatarios?\n\nRegistros CSV cargados: ${formatNumber(csvCount)}.\n\nEl envío podría tardar varios minutos, según el volumen.`

    if (!confirm(confirmMessage)) return

    setSending(true)
    setPaused(false)
    setCompleted(false)
    pausedRef.current = false
    abortRef.current = false
    setProgress(alreadySent > 0 ? Math.round((alreadySent / totalRecipients) * 100) : 0)
    setEmailsSent(alreadySent)
    setEmailsFailed(0)
    setTimeElapsed(0)
    setErrorMessage("")
    emailsSentRef.current = alreadySent
    emailsFailedRef.current = 0
    progressRef.current = alreadySent > 0 ? Math.round((alreadySent / totalRecipients) * 100) : 0
    timeElapsedRef.current = 0
    estimatedRemainingRef.current = ""
    startTimeRef.current = Date.now()
    lastTelegramRef.current = Date.now()
    setStatusMessage(alreadySent > 0 ? "Reanudando el envío..." : "Preparando el envío...")

    const remainingEmails = totalRecipients - alreadySent
    const callsEstimate = Math.ceil(remainingEmails / 300)
    setTotalCalls(callsEstimate)
    setCurrentCall(0)

    setTimeout(
      () =>
        sendTelegramNotification(
          alreadySent > 0 ? "progress" : "started",
          alreadySent,
          0,
          progressRef.current,
          "0s",
          "Calculando...",
        ),
      1000,
    )

    try {
      const fullCsvDataMap = await loadCsvDataLarge(campaignId)
      const csvKeys = Object.keys(fullCsvDataMap)
      console.log(`[v0] CSV cargado para envío: ${csvKeys.length} registros`)

      setStatusMessage("Conectando con el servidor...")

      let callNum = 0
      let totalSent = alreadySent
      let totalFailed = 0
      let retryCount = 0
      const maxRetries = 5
      let needsContinue = true

      while (needsContinue && !abortRef.current) {
        while (pausedRef.current && !abortRef.current) {
          setStatusMessage("Envío pausado")
          await delay(1000)
        }

        if (abortRef.current) break

        callNum++
        setCurrentCall(callNum)
        setStatusMessage(`Procesando lote ${callNum}...`)

        try {
          const response = await fetch(apiPath, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              campaignId,
              csvDataMap: fullCsvDataMap,
            }),
          })

          if (!response.ok) {
            const data = await response.json()
            throw new Error(data.error || "Error del servidor.")
          }

          const result = await response.json()
          retryCount = 0

          totalSent = result.sent || 0
          totalFailed = result.failed || 0

          setEmailsSent(totalSent)
          setEmailsFailed(totalFailed)
          setProgress(result.progress || 0)

          emailsSentRef.current = totalSent
          emailsFailedRef.current = totalFailed
          progressRef.current = result.progress || 0

          if (result.remaining > 0) {
            const newEstimate = callNum + Math.ceil(result.remaining / 300)
            setTotalCalls(newEstimate)
          }

          if (result.completed || !result.needsContinue) {
            needsContinue = false
            setProgress(100)
            progressRef.current = 100
            setStatusMessage("Envío completado")
            setEstimatedTimeRemaining("")
            estimatedRemainingRef.current = ""
            setCompleted(true)
            await deleteCsvData(campaignId)
            const finalElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
            await sendTelegramNotification("completed", totalSent, totalFailed, 100, formatTime(finalElapsed), "")
            setTimeout(() => window.location.reload(), 3000)
            return
          }

          if (result.needsContinue && !abortRef.current) {
            setStatusMessage(`Lote ${callNum} completado. Esperando...`)
            await delay(DELAY_BETWEEN_CALLS)
          }
        } catch (err: any) {
          retryCount++
          if (retryCount < maxRetries) {
            setStatusMessage(`Error. Reintentando (${retryCount}/${maxRetries})...`)
            await delay(5000)
            callNum--
          } else {
            throw err
          }
        }
      }

      if (abortRef.current) {
        setStatusMessage("Envío cancelado")
        const cancelElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        await sendTelegramNotification(
          "cancelled",
          emailsSentRef.current,
          emailsFailedRef.current,
          progressRef.current,
          formatTime(cancelElapsed),
          "",
        )
        setSending(false)
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Error de conexión.")
      await sendTelegramNotification(
        "error",
        emailsSentRef.current,
        emailsFailedRef.current,
        progressRef.current,
        formatTime(timeElapsedRef.current),
        "",
      )
      setStatusMessage("Error: consulta los detalles")
    }
  }

  const handlePause = async () => {
    pausedRef.current = true
    setPaused(true)
    await sendTelegramNotification("paused")
  }

  const handleResume = () => {
    pausedRef.current = false
    setPaused(false)
    lastTelegramRef.current = Date.now()
  }

  const handleCancel = async () => {
    if (confirm("¿Cancelar este envío? No se pueden recuperar los correos que ya se enviaron.")) {
      abortRef.current = true
      setPaused(false)
      pausedRef.current = false
    }
  }

  const handleRetry = () => {
    setErrorMessage("")
    setSending(false)
  }

  const successRate = emailsSent > 0 ? ((emailsSent / (emailsSent + emailsFailed)) * 100).toFixed(1) : "100"

  if (needsCsvUpload && !csvLoaded) {
    return (
      <div className="space-y-4">
        <div className="p-4 border border-yellow-500/30 rounded-lg bg-yellow-500/10">
          <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">Sube el CSV para reanudar el envío</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Ya enviados: {formatNumber(alreadySent)} de {formatNumber(totalRecipients)}
            <br />
            <strong>Importante:</strong> Sube ÚNICAMENTE los registros restantes (desde la fila {alreadySent + 1} del
            archivo CSV original).
            <br />
            El sistema asignará automáticamente los índices de fila correctos a partir de {alreadySent}.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="block w-full text-sm text-muted-foreground
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-primary file:text-primary-foreground
              hover:file:bg-primary/90
              cursor-pointer"
          />
        </div>
      </div>
    )
  }

  if (sending) {
    return (
      <div className="w-full max-w-md space-y-5 p-6 border border-border/50 rounded-2xl bg-gradient-to-b from-card to-card/80 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${paused ? "bg-yellow-500/10" : errorMessage ? "bg-red-500/10" : completed ? "bg-green-500/10" : "bg-primary/10"}`}
            >
              {paused ? (
                <Pause className="h-5 w-5 text-yellow-500" />
              ) : errorMessage ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {paused ? "Pausado" : errorMessage ? "Error" : completed ? "Completado" : "Enviando..."}
              </h3>
              <p className="text-xs text-muted-foreground">{statusMessage}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{formatTime(timeElapsed)}</p>
            {estimatedTimeRemaining && (
              <p className="text-xs text-muted-foreground">~{estimatedTimeRemaining} restantes</p>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500">{errorMessage}</p>
            <Button onClick={handleRetry} size="sm" variant="outline" className="mt-2 bg-transparent">
              Reintentar
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted/50">
            <div
              className={`h-full transition-all duration-500 ease-out ${
                paused
                  ? "bg-yellow-500"
                  : errorMessage
                    ? "bg-red-500"
                    : completed
                      ? "bg-green-500"
                      : "bg-gradient-to-r from-primary via-primary to-primary/80"
              }`}
              style={{ width: `${progress}%` }}
            />
            {!paused && !errorMessage && progress < 100 && progress > 0 && (
              <div
                className="absolute top-0 h-full w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                style={{ left: `${Math.max(0, progress - 10)}%` }}
              />
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-foreground">{progress.toFixed(0)}%</span>
            <span className="text-xs text-muted-foreground">
              Lote {currentCall} de ~{totalCalls}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/30 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-[10px] uppercase tracking-wide mb-1">
              <Users className="h-3 w-3" />
              Total
            </div>
            <span className="text-xl font-bold text-foreground">{formatNumber(totalRecipients)}</span>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-primary text-[10px] uppercase tracking-wide mb-1">
              <Mail className="h-3 w-3" />
              Enviados
            </div>
            <span className="text-xl font-bold text-primary">{formatNumber(emailsSent)}</span>
          </div>
          <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-red-400 text-[10px] uppercase tracking-wide mb-1">
              <XCircle className="h-3 w-3" />
              Fallidos
            </div>
            <span className="text-xl font-bold text-red-400">{formatNumber(emailsFailed)}</span>
          </div>
        </div>

        {emailsSent > 0 && (
          <div className="flex items-center justify-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">
              Tasa de éxito: <span className="font-semibold text-green-500">{successRate}%</span>
            </span>
          </div>
        )}

        {completed && <p className="text-xs text-muted-foreground text-center">Actualizando en 3 segundos...</p>}

        {!errorMessage && !completed && (
          <div className="flex gap-2 pt-2">
            {paused ? (
              <Button onClick={handleResume} className="flex-1 bg-primary hover:bg-primary/90 h-11">
                <Play className="mr-2 h-4 w-4" />
                Reanudar
              </Button>
            ) : (
              <Button onClick={handlePause} variant="outline" className="flex-1 h-11 bg-transparent">
                <Pause className="mr-2 h-4 w-4" />
                Pausar
              </Button>
            )}
            <Button
              onClick={handleCancel}
              variant="ghost"
              className="h-11 px-4 text-red-400 hover:text-red-500 hover:bg-red-500/10"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          Recibirás actualizaciones por Telegram cada 5 minutos.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {csvLoaded && (
        <p className="text-xs text-muted-foreground">CSV cargado: {formatNumber(csvRecordsCount)} registros</p>
      )}
      <Button onClick={handleSend} className="bg-primary hover:bg-primary/90 h-11 px-6">
        <Send className="mr-2 h-4 w-4" />
        {alreadySent > 0
          ? `Reanudar envío (${formatNumber(totalRecipients - alreadySent)} restantes)`
          : `Enviar a ${formatNumber(totalRecipients)} destinatarios`}
      </Button>
    </div>
  )
}
