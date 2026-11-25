import { Header } from "@/components/header"
import { createClient } from "@/lib/db/server"

export const dynamic = "force-dynamic"

type MeetingRequest = {
  id: string
  name: string | null
  company: string | null
  phone: string | null
  email: string | null
  notes: string | null
  status: string | null
  source: string | null
  created_at: string | null
}

function formatDate(value: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("es-ES")
}

export default async function MeetingsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("meeting_requests")
    .select("id, name, company, phone, email, notes, status, source, created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  const meetings = (data as MeetingRequest[] | null) || []

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">Registros</h2>
            <p className="text-muted-foreground mt-1">Solicitudes de reunión recibidas desde la web</p>
          </div>
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Nombre</th>
                  <th className="px-4 py-3 text-left font-medium">Empresa</th>
                  <th className="px-4 py-3 text-left font-medium">Teléfono</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Notas</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Origen</th>
                  <th className="px-4 py-3 text-left font-medium">Creado</th>
                </tr>
              </thead>
              <tbody>
                {meetings.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={8}>
                      No hay registros
                    </td>
                  </tr>
                ) : (
                  meetings.map((meeting) => (
                    <tr key={meeting.id} className="border-t border-border align-top">
                      <td className="px-4 py-3 text-foreground">{meeting.name || "-"}</td>
                      <td className="px-4 py-3 text-foreground">{meeting.company || "-"}</td>
                      <td className="px-4 py-3 text-foreground">{meeting.phone || "-"}</td>
                      <td className="px-4 py-3 text-foreground">{meeting.email || "-"}</td>
                      <td className="px-4 py-3 text-foreground max-w-xs whitespace-pre-wrap break-words">{meeting.notes || "-"}</td>
                      <td className="px-4 py-3 text-foreground">{meeting.status || "-"}</td>
                      <td className="px-4 py-3 text-foreground">{meeting.source === "website" ? "Web" : meeting.source || "-"}</td>
                      <td className="px-4 py-3 text-foreground whitespace-nowrap">{formatDate(meeting.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
