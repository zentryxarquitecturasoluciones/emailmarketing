"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ShieldCheck } from "lucide-react"

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email")

  const [email, setEmail] = useState(emailParam || "")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleUnsubscribe = async () => {
    if (!email) {
      setMessage("Por favor, introduce tu dirección de correo electrónico.")
      setStatus("error")
      return
    }

    setStatus("loading")

    try {
      const response = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setStatus("success")
        setMessage("Te has dado de baja correctamente de nuestra lista de correo.")
      } else {
        setStatus("error")
        setMessage("Se produjo un error. Inténtalo de nuevo.")
      }
    } catch (error) {
      setStatus("error")
      setMessage("No se pudo completar la baja. Inténtalo más tarde.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg border border-gray-200 p-8">
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2 text-primary font-bold text-2xl">
            <ShieldCheck className="h-8 w-8 text-secondary" />
            <span className="text-lime-700">Data Zentryx</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Cancelar suscripción</h1>

        {status === "success" ? (
          <div className="text-center">
            <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6 border border-green-200">{message}</div>
            <p className="text-sm text-gray-500">
              Sentimos que te vayas. Si ha sido un error, ponte en contacto con nuestro equipo de soporte.
            </p>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6 text-center">
              Sentimos que te vayas. Introduce tu correo electrónico para darte de baja de nuestra lista de correo.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo electrónico
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {status === "error" && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">{message}</div>
              )}

              <Button
                onClick={handleUnsubscribe}
                disabled={status === "loading"}
                className="w-full bg-lime-600 hover:bg-blue-700 text-white font-medium py-2"
              >
                {status === "loading" ? "Procesando..." : "Cancelar suscripción"}
              </Button>

              <p className="text-xs text-center text-gray-400 mt-4">
                Dejarás de recibir nuestras futuras comunicaciones de marketing.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-lime-700">Cargando...</div>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  )
}
