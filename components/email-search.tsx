"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, X, Mail, Hash } from "lucide-react"
import { createPortalAClient } from "@/lib/supabase-portal-a"
import { createPortalBClient } from "@/lib/supabase-portal-b"

interface EmailSearchProps {
  campaignId: string
  portal: "a" | "b"
}

export function EmailSearch({ campaignId, portal }: EmailSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<{
    found: boolean
    email: string
    count: number
    occurrences: Array<{ row_index: number; status: string; created_at: string }>
  } | null>(null)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)
    setResults(null)

    try {
      const supabase = portal === "a" ? createPortalAClient() : createPortalBClient()

      // Buscar en campaign_recipients
      const { data: recipients, error: recipientsError } = await supabase
        .from("campaign_recipients")
        .select("id, email, row_index")
        .eq("campaign_id", campaignId)
        .ilike("email", `%${searchTerm.trim()}%`)

      if (recipientsError) throw recipientsError

      if (!recipients || recipients.length === 0) {
        setResults({
          found: false,
          email: searchTerm.trim(),
          count: 0,
          occurrences: [],
        })
        return
      }

      // Buscar eventos para cada recipient encontrado
      const occurrences = await Promise.all(
        recipients.map(async (recipient) => {
          const { data: event } = await supabase
            .from("email_events")
            .select("event_type, created_at")
            .eq("campaign_id", campaignId)
            .eq("recipient_id", recipient.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single()

          return {
            row_index: recipient.row_index || 0,
            status: event?.event_type || "pendiente",
            created_at: event?.created_at || "",
          }
        }),
      )

      setResults({
        found: true,
        email: searchTerm.trim(),
        count: recipients.length,
        occurrences: occurrences.sort((a, b) => a.row_index - b.row_index),
      })
    } catch (error) {
      console.error("Error searching email:", error)
      setResults({
        found: false,
        email: searchTerm.trim(),
        count: 0,
        occurrences: [],
      })
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
    setResults(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return "text-green-500"
      case "opened":
        return "text-yellow-500"
      case "clicked":
        return "text-purple-500"
      case "bounced":
        return "text-orange-500"
      case "spam":
      case "failed":
        return "text-red-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "sent":
        return "Enviado"
      case "delivered":
        return "Entregado"
      case "opened":
        return "Abierto"
      case "clicked":
        return "Clic"
      case "bounced":
        return "Rebotado"
      case "spam":
        return "Spam"
      case "failed":
        return "Fallido"
      default:
        return "Pendiente"
    }
  }

  return (
    <Card className="bg-card border-border w-full">
      <CardContent className="pt-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar un correo en esta campaña..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 bg-background border-border"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()}>
            {isSearching ? "Buscando..." : "Buscar"}
          </Button>
        </div>

        {results && (
          <div className="mt-4">
            {!results.found ? (
              <div className="text-center py-4 text-muted-foreground">
                <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No se encontraron resultados para «{results.email}» en esta campaña.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-lime-500" />
                  <span className="font-medium text-foreground">{results.email}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Hash className="h-3 w-3" />
                    {results.count} {results.count === 1 ? "coincidencia" : "coincidencias"}
                  </span>
                </div>

                {results.count > 1 && (
                  <p className="text-xs text-yellow-500">
                    Este correo aparece {results.count} veces (en distintas empresas o registros).
                  </p>
                )}

                <div className="border border-border rounded-md divide-y divide-border">
                  {results.occurrences.map((occurrence, index) => (
                    <div key={index} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Fila n.º {occurrence.row_index + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className={getStatusColor(occurrence.status)}>{getStatusLabel(occurrence.status)}</span>
                        {occurrence.created_at && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(occurrence.created_at).toLocaleString("es-ES")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
