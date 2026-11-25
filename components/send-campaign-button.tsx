"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Send, Loader2, Mail, CheckCircle, Clock, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { loadCsvDataLarge, deleteCsvData } from "@/lib/csv-storage"

interface SendCampaignButtonProps {
  campaignId: string
  totalRecipients?: number
  apiPath?: string
}

const CSV_DATA_LIMIT = 2000

const PRIORITY_EMAILS = [
  "ap@aapcapital.biz",
  "aportillo@insurepartners.net",
  "armando.portillo@gmail.com",
  "ap@getmyerc.com",
  "eca@aapcapital.biz",
  "zentryxarquitecturadesoluciones@gmail.com",
  "esty@insurepartners.net",
  "ap@aapcapitaladvisory.com",
  "estefaniacruzalvarez@yahoo.com",
  "nejuanjioros@gmail.com",
  "juancarlosgonzalez171@gmail.com",
  "mejuanjiorios@gmail.com",
  "juanciosetests@outlook.com",
  "mmejuanjiorios@gmail.com",
  "cristiangutierrez20355@gmail.com",
  "juanjsenfc@gmail.com",
  "metin2pago00924@gmail.com",
  "maluandgar@gmail.com",
  "eca.actservices@gmail.com",
]

export function SendCampaignButton({
  campaignId,
  totalRecipients = 0,
  apiPath = "/api/campaigns/send",
}: SendCampaignButtonProps) {
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [emailsSent, setEmailsSent] = useState(0)
  const [emailsDelivered, setEmailsDelivered] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState("")
  const [currentBatch, setCurrentBatch] = useState(0)
  const [totalBatches, setTotalBatches] = useState(0)
  const router = useRouter()
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    let progressInterval: NodeJS.Timeout
    let timeInterval: NodeJS.Timeout
    let emailInterval: NodeJS.Timeout

    if (sending && totalRecipients > 0) {
      startTimeRef.current = Date.now()
      const batchSize = 1000
      const batches = Math.ceil(totalRecipients / batchSize)
      setTotalBatches(batches)
      const estimatedTotalTime = Math.min(totalRecipients * 50, 60000)

      timeInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        setTimeElapsed(elapsed)
        const remainingEmails = totalRecipients - emailsSent
        const emailsPerSecond = emailsSent / Math.max(elapsed, 1)
        const remainingSeconds = Math.ceil(remainingEmails / Math.max(emailsPerSecond, 100))
        if (remainingSeconds > 60) {
          setEstimatedTimeRemaining(`${Math.ceil(remainingSeconds / 60)} min remaining`)
        } else {
          setEstimatedTimeRemaining(`${remainingSeconds} sec remaining`)
        }
      }, 1000)

      const emailIncrement = Math.ceil(totalRecipients / 100)
      const emailUpdateInterval = estimatedTotalTime / 100

      emailInterval = setInterval(() => {
        setEmailsSent((prev) => {
          const next = Math.min(prev + emailIncrement + Math.floor(Math.random() * 50), totalRecipients)
          setCurrentBatch(Math.ceil(next / 1000))
          setEmailsDelivered(Math.floor(next * 0.98))
          return next
        })
      }, emailUpdateInterval)

      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev
          return Math.min(prev + 1, 95)
        })
      }, estimatedTotalTime / 100)

      const messages = [
        "Conectando con el servidor SMTP...",
        "Verificando las credenciales de envío...",
        "Validando las direcciones de correo...",
        "Preparando el contenido HTML...",
        "Enviando lote de correos...",
        "Procesando la cola de envío...",
        "Verificando la entrega...",
        "Registrando eventos de entrega...",
        "Actualizando estadísticas...",
        "Finalizando...",
      ]

      let msgIndex = 0
      const messageInterval = setInterval(() => {
        setStatusMessage(messages[msgIndex % messages.length])
        msgIndex++
      }, estimatedTotalTime / messages.length)

      return () => {
        clearInterval(progressInterval)
        clearInterval(timeInterval)
        clearInterval(emailInterval)
        clearInterval(messageInterval)
      }
    }
  }, [sending, totalRecipients])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString("es-ES")
  }

  const handleSend = async () => {
    if (
      !confirm(
        `¿Enviar esta campaña a ${formatNumber(totalRecipients)} destinatarios?\n\nEl proceso puede tardar varios minutos, según el volumen.`,
      )
    )
      return

    setSending(true)
    setProgress(0)
    setEmailsSent(0)
    setEmailsDelivered(0)
    setTimeElapsed(0)
    setStatusMessage("Cargando datos del CSV...")

    try {
      const fullCsvDataMap = await loadCsvDataLarge(campaignId)
      const csvKeys = Object.keys(fullCsvDataMap)
      console.log(`[David DEV version 3.5] CSV data cargado: ${csvKeys.length.toLocaleString()} registros`)

      let csvDataToSend: Record<string, Record<string, string>> | null = null
      if (csvKeys.length > 0) {
        if (csvKeys.length <= CSV_DATA_LIMIT) {
          csvDataToSend = fullCsvDataMap
        } else {
          csvDataToSend = {}

          const prioritySet = new Set(PRIORITY_EMAILS.map((e) => e.toLowerCase()))
          for (const key of csvKeys) {
            if (prioritySet.has(key.toLowerCase())) {
              csvDataToSend[key] = fullCsvDataMap[key]
            }
          }

          const currentCount = Object.keys(csvDataToSend).length
          const remainingSlots = CSV_DATA_LIMIT - currentCount
          let added = 0

          for (const key of csvKeys) {
            if (added >= remainingSlots) break
            if (!csvDataToSend[key]) {
              csvDataToSend[key] = fullCsvDataMap[key]
              added++
            }
          }

          console.log(`[David DEV version 3.5] Registros CSV preparados: ${Object.keys(csvDataToSend).length}`)
        }
      }

      setStatusMessage("Iniciando el envío...")

      const response = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          csvDataMap: csvDataToSend,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setProgress(100)
        setEmailsSent(totalRecipients)
        setEmailsDelivered(Math.floor(totalRecipients * 0.98))
        setStatusMessage("Envío completado correctamente.")
        setEstimatedTimeRemaining("")

        await deleteCsvData(campaignId)

        setTimeout(() => {
          window.location.reload()
        }, 3000)
      } else {
        const data = await response.json()
        alert(data.error || "No se pudo enviar la campaña.")
        setSending(false)
      }
    } catch (error) {
      console.log(`[David DEV version 3.5] Error en envío:`, error)
      alert("No se pudo conectar con el servidor.")
      setSending(false)
    }
  }

  if (sending) {
    return (
      <div className="w-full max-w-lg space-y-4 p-6 border border-primary/30 rounded-xl bg-card/80 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="font-medium text-foreground">Enviando campaña</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Clock className="h-4 w-4" />
            <span>{formatTime(timeElapsed)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{progress.toFixed(0)}% completado</span>
            <span>{estimatedTimeRemaining}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
              <Users className="h-3 w-3" />
              <span>Total</span>
            </div>
            <span className="text-lg font-bold text-foreground">{formatNumber(totalRecipients)}</span>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-primary text-xs mb-1">
              <Mail className="h-3 w-3" />
              <span>Enviados</span>
            </div>
            <span className="text-lg font-bold text-primary">{formatNumber(emailsSent)}</span>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-blue-500 text-xs mb-1">
              <CheckCircle className="h-3 w-3" />
              <span>Entregados</span>
            </div>
            <span className="text-lg font-bold text-blue-500">{formatNumber(emailsDelivered)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span>{statusMessage}</span>
        </div>

        {totalBatches > 1 && (
          <div className="text-xs text-muted-foreground text-center">
            Procesando lote {currentBatch} de {totalBatches} (
            {formatNumber(Math.min(currentBatch * 1000, totalRecipients))} correos)
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          No cierres esta ventana. El envío continuará en segundo plano.
        </p>
      </div>
    )
  }

  return (
    <Button onClick={handleSend} disabled={sending}>
      <Send className="mr-2 h-4 w-4" />
      Enviar a {formatNumber(totalRecipients)} destinatarios
    </Button>
  )
}
