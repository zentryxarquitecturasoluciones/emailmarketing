"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Copy, MoreHorizontal, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { createPortalAClient } from "@/lib/supabase-portal-a"
import { createPortalBClient } from "@/lib/supabase-portal-b"
import { useRouter } from "next/navigation"

interface Campaign {
  id: string
  name: string
  subject: string
  status: string
  created_at: string
  total_recipients?: number
}

interface CampaignsTableProps {
  campaigns: Campaign[]
  basePath: string
  portal: "a" | "b"
}

export function CampaignsTable({ campaigns: initialCampaigns, basePath, portal }: CampaignsTableProps) {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null)

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      draft: { label: "Borrador", className: "bg-neutral-700 text-neutral-200 border-neutral-600" },
      sending: { label: "Enviando", className: "bg-lime-500/20 text-lime-400 border-blue-500/30" },
      sent: { label: "Enviada", className: "bg-green-500/20 text-green-400 border-emerald-500/30" },
      failed: { label: "Error", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    }
    const variant = variants[status] || variants.draft
    return (
      <Badge variant="outline" className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  const handleDeleteClick = (campaign: Campaign) => {
    setCampaignToDelete(campaign)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return

    setDeletingId(campaignToDelete.id)
    setShowDeleteDialog(false)

    const supabase = getSupabaseClient()

    // Eliminar eventos de email primero (foreign key)
    await supabase.from("email_events").delete().eq("campaign_id", campaignToDelete.id)

    // Eliminar destinatarios
    await supabase.from("campaign_recipients").delete().eq("campaign_id", campaignToDelete.id)

    // Eliminar campaña
    const { error } = await supabase.from("campaigns").delete().eq("id", campaignToDelete.id)

    if (!error) {
      setCampaigns(campaigns.filter((c) => c.id !== campaignToDelete.id))
    }

    setDeletingId(null)
    setCampaignToDelete(null)
    router.refresh()
  }

  const getSupabaseClient = () => {
    return portal === "a" ? createPortalAClient() : createPortalBClient()
  }

  if (campaigns.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Todavía no hay campañas.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Campañas recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Asunto
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    Destinatarios
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    Fecha
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-foreground truncate max-w-[200px]">{campaign.name}</p>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <p className="text-sm text-muted-foreground truncate max-w-[250px]">{campaign.subject}</p>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(campaign.status)}</td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <p className="text-sm text-muted-foreground">
                        {(campaign.total_recipients || 0).toLocaleString("es-ES")}
                      </p>
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      <p className="text-sm text-muted-foreground">
                        {new Date(campaign.created_at).toLocaleDateString("es-ES")}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {deletingId === campaign.id ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`${basePath}/campaigns/view/${campaign.id}`}
                                className="flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                Ver detalles
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`${basePath}/campaigns/create?sourceCampaignId=${campaign.id}`}
                                className="flex items-center gap-2"
                              >
                                <Copy className="h-4 w-4" />
                                Duplicar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(campaign)}
                              className="flex items-center gap-2 text-red-500 focus:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">¿Eliminar campaña?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar la campaña «{campaignToDelete?.name}». Se eliminarán permanentemente todos los
              destinatarios y las estadísticas asociadas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
