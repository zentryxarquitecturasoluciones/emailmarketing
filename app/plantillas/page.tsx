"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  FolderPlus,
  FileText,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Search,
  Home,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Template {
  id: string
  name: string
  subject: string
  htmlContent: string
  createdAt: string
}

interface Group {
  id: string
  name: string
  templates: Template[]
  isExpanded: boolean
}

const STORAGE_KEY = "plantillas_groups"

export default function PlantillasPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [newGroupName, setNewGroupName] = useState("")
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    subject: "",
    htmlContent: "",
  })

  // Cargar grupos desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setGroups(JSON.parse(saved))
      } catch {
        setGroups([])
      }
    }
  }, [])

  // Guardar grupos en localStorage
  useEffect(() => {
    if (groups.length > 0 || localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
    }
  }, [groups])

  // Crear nuevo grupo
  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast.error("El nombre del grupo es obligatorio.")
      return
    }

    const newGroup: Group = {
      id: crypto.randomUUID(),
      name: newGroupName.trim(),
      templates: [],
      isExpanded: true,
    }

    setGroups([...groups, newGroup])
    setNewGroupName("")
    toast.success("Grupo creado correctamente.")
  }

  // Eliminar grupo
  const handleDeleteGroup = (groupId: string) => {
    setGroups(groups.filter((g) => g.id !== groupId))
    toast.success("Grupo eliminado.")
  }

  // Actualizar nombre del grupo
  const handleUpdateGroup = () => {
    if (!editingGroup) return

    setGroups(groups.map((g) => (g.id === editingGroup.id ? { ...g, name: editingGroup.name } : g)))
    setEditingGroup(null)
    toast.success("Grupo actualizado.")
  }

  // Toggle expandir/colapsar grupo
  const toggleGroup = (groupId: string) => {
    setGroups(groups.map((g) => (g.id === groupId ? { ...g, isExpanded: !g.isExpanded } : g)))
  }

  // Crear nueva plantilla
  const handleCreateTemplate = () => {
    if (!selectedGroupId) {
      toast.error("Primero selecciona un grupo.")
      return
    }
    if (!newTemplate.name.trim() || !newTemplate.subject.trim() || !newTemplate.htmlContent.trim()) {
      toast.error("Todos los campos son obligatorios.")
      return
    }

    const template: Template = {
      id: crypto.randomUUID(),
      name: newTemplate.name.trim(),
      subject: newTemplate.subject.trim(),
      htmlContent: newTemplate.htmlContent.trim(),
      createdAt: new Date().toISOString(),
    }

    setGroups(groups.map((g) => (g.id === selectedGroupId ? { ...g, templates: [...g.templates, template] } : g)))

    setNewTemplate({ name: "", subject: "", htmlContent: "" })
    setSelectedGroupId(null)
    toast.success("Plantilla creada correctamente.")
  }

  // Eliminar plantilla
  const handleDeleteTemplate = (groupId: string, templateId: string) => {
    setGroups(
      groups.map((g) => (g.id === groupId ? { ...g, templates: g.templates.filter((t) => t.id !== templateId) } : g)),
    )
    toast.success("Plantilla eliminada.")
  }

  // Actualizar plantilla
  const handleUpdateTemplate = () => {
    if (!editingTemplate) return

    setGroups(
      groups.map((g) => ({
        ...g,
        templates: g.templates.map((t) => (t.id === editingTemplate.id ? editingTemplate : t)),
      })),
    )
    setEditingTemplate(null)
    toast.success("Plantilla actualizada.")
  }

  // Copiar contenido HTML
  const handleCopyHtml = (template: Template) => {
    navigator.clipboard.writeText(template.htmlContent)
    toast.success("HTML copiado al portapapeles.")
  }

  // Copiar asunto
  const handleCopySubject = (template: Template) => {
    navigator.clipboard.writeText(template.subject)
    toast.success("Asunto copiado al portapapeles.")
  }

  // Open the template in a new tab
  const handleOpenInNewTab = (template: Template) => {
    const newWindow = window.open("", "_blank")
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${template.name} - ${template.subject}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { background: #1e293b; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .header h1 { margin: 0 0 10px 0; font-size: 24px; }
            .header p { margin: 0; opacity: 0.8; }
            .content { border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; }
            .copy-btn { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; margin-right: 10px; }
            .copy-btn:hover { background: #2563eb; }
            .actions { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${template.name}</h1>
            <p>Asunto: ${template.subject}</p>
          </div>
          <div class="actions">
            <button class="copy-btn" onclick="navigator.clipboard.writeText(document.getElementById('html-content').innerText); alert('¡HTML copiado!')">Copiar HTML</button>
            <button class="copy-btn" onclick="navigator.clipboard.writeText('${template.subject}'); alert('¡Asunto copiado!')">Copiar asunto</button>
          </div>
          <div class="content">
            <h3>Vista previa:</h3>
            ${template.htmlContent}
          </div>
          <div style="margin-top: 20px; padding: 20px; background: #f1f5f9; border-radius: 8px;">
            <h3>Código HTML:</h3>
            <pre id="html-content" style="white-space: pre-wrap; word-break: break-all; background: white; padding: 15px; border-radius: 4px; font-size: 12px;">${template.htmlContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
          </div>
        </body>
        </html>
      `)
      newWindow.document.close()
    }
  }

  // Filtrar grupos y plantillas
  const filteredGroups = groups
    .map((group) => ({
      ...group,
      templates: group.templates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.subject.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((group) => group.name.toLowerCase().includes(searchQuery.toLowerCase()) || group.templates.length > 0)

  const totalTemplates = groups.reduce((acc, g) => acc + g.templates.length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">Administrador de plantillas</span>
          </div>

          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Home className="h-4 w-4" />
              Back to Portals
            </Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistics and actions */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Plantillas de correo</h1>
            <p className="text-slate-600 mt-1">
              {groups.length} groups · {totalTemplates} templates
            </p>
          </div>

          <div className="flex gap-2">
            {/* Create group dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <FolderPlus className="h-4 w-4" />
                  New Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crear grupo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nombre del grupo</Label>
                    <Input
                      placeholder="Ej.: Campañas de bienvenida"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleCreateGroup} className="bg-indigo-600 hover:bg-indigo-700">
                      Crear grupo
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Create template dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="h-4 w-4" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear plantilla</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Grupo</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedGroupId || ""}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                    >
                      <option value="">Selecciona un grupo...</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nombre de la plantilla</Label>
                    <Input
                      placeholder="Ej: Email de Bienvenida V1"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Asunto del correo</Label>
                    <Input
                      placeholder="Ej.: Te damos la bienvenida a nuestra plataforma"
                      value={newTemplate.subject}
                      onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contenido HTML</Label>
                    <Textarea
                      placeholder="<h1>¡Hola!</h1><p>Gracias por confiar en nosotros...</p>"
                      className="min-h-[300px] font-mono text-sm"
                      value={newTemplate.htmlContent}
                      onChange={(e) => setNewTemplate({ ...newTemplate, htmlContent: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Write the subject and email content for recipients in Spanish. The dashboard interface remains in
                      English.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancelar</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button onClick={handleCreateTemplate} className="bg-indigo-600 hover:bg-indigo-700">
                      Crear plantilla
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar grupos o plantillas..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Group list */}
        {filteredGroups.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FolderPlus className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Aún no hay grupos</h3>
              <p className="text-slate-600 mb-4">Crea tu primer grupo para organizar tus plantillas.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                  onClick={() => toggleGroup(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {group.isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-500" />
                      )}
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                      <span className="text-sm text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        {group.templates.length} templates
                      </span>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {/* Edit group */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setEditingGroup(group)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar grupo</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Nombre del grupo</Label>
                              <Input
                                value={editingGroup?.name || ""}
                                onChange={(e) =>
                                  setEditingGroup(editingGroup ? { ...editingGroup, name: e.target.value } : null)
                                }
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancelar</Button>
                            </DialogClose>
                            <DialogClose asChild>
                              <Button onClick={handleUpdateGroup}>Guardar</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Delete group */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar grupo</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will delete the "{group.name}" group and all of its templates. This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteGroup(group.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>

                {group.isExpanded && (
                  <CardContent className="pt-4">
                    {group.templates.length === 0 ? (
                      <p className="text-center text-slate-500 py-4">Este grupo aún no tiene plantillas.</p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {group.templates.map((template) => (
                          <div
                            key={template.id}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-slate-900 truncate">{template.name}</h4>
                                <p className="text-sm text-slate-500 truncate">{template.subject}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 bg-transparent"
                                onClick={() => handleCopyHtml(template)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                HTML
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 bg-transparent"
                                onClick={() => handleCopySubject(template)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Subject
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 bg-transparent"
                                onClick={() => handleOpenInNewTab(template)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Open
                              </Button>

                              {/* Edit template */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={() => setEditingTemplate(template)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Editar plantilla</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label>Nombre</Label>
                                      <Input
                                        value={editingTemplate?.name || ""}
                                        onChange={(e) =>
                                          setEditingTemplate(
                                            editingTemplate ? { ...editingTemplate, name: e.target.value } : null,
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Asunto</Label>
                                      <Input
                                        value={editingTemplate?.subject || ""}
                                        onChange={(e) =>
                                          setEditingTemplate(
                                            editingTemplate ? { ...editingTemplate, subject: e.target.value } : null,
                                          )
                                        }
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Contenido HTML</Label>
                                      <Textarea
                                        className="min-h-[300px] font-mono text-sm"
                                        value={editingTemplate?.htmlContent || ""}
                                        onChange={(e) =>
                                          setEditingTemplate(
                                            editingTemplate
                                              ? { ...editingTemplate, htmlContent: e.target.value }
                                              : null,
                                          )
                                        }
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">Cancelar</Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                      <Button onClick={handleUpdateTemplate}>Guardar</Button>
                                    </DialogClose>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              {/* Delete template */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Eliminar plantilla</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will delete the "{template.name}" template. This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTemplate(group.id, template.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
