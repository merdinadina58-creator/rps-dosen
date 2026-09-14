'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  Wand2,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { api, type RpsDetail, type Cpmk } from '@/lib/api'
import { useAsyncAiJob } from '@/hooks/use-async-ai-job'

interface Props {
  rps: RpsDetail
}

interface GeneratedCpmk {
  kode: string
  deskripsi: string
  subCpmk: Array<{ kode: string; deskripsi: string }>
}

export function CpmkTab({ rps }: Props) {
  const queryClient = useQueryClient()

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [editingCpmk, setEditingCpmk] = useState<Cpmk | null>(null)
  const [editingSubCpmk, setEditingSubCpmk] = useState<{ cpmkId: string; subCpmk: Cpmk['subCpmk'][number] } | null>(null)
  const [addCpmkOpen, setAddCpmkOpen] = useState(false)
  const [addSubCpmkFor, setAddSubCpmkFor] = useState<string | null>(null)
  const [deleteCpmk, setDeleteCpmk] = useState<Cpmk | null>(null)
  const [deleteSubCpmk, setDeleteSubCpmk] = useState<{ cpmkId: string; subCpmk: Cpmk['subCpmk'][number] } | null>(null)

  // AI generate state
  const [aiOpen, setAiOpen] = useState(false)
  const [aiJumlah, setAiJumlah] = useState(4)
  const [aiResult, setAiResult] = useState<GeneratedCpmk[] | null>(null)
  const [aiApplyConfirm, setAiApplyConfirm] = useState(false)

  const toggleCollapse = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Mutations
  const deleteCpmkMut = useMutation({
    mutationFn: (id: string) => api.deleteCpmk(rps.id, id),
    onSuccess: () => {
      toast.success('CPMK dihapus')
      queryClient.invalidateQueries({ queryKey: ['rps', rps.id] })
      setDeleteCpmk(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteSubMut = useMutation({
    mutationFn: (id: string) => api.deleteSubCpmk(id),
    onSuccess: () => {
      toast.success('Sub-CPMK dihapus')
      queryClient.invalidateQueries({ queryKey: ['rps', rps.id] })
      setDeleteSubCpmk(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const aiGen = useAsyncAiJob<{ cpmk: GeneratedCpmk[] }>({
    onSuccess: (data) => {
      setAiResult(data.cpmk)
      toast.success(`${data.cpmk.length} CPMK berhasil dibuat`)
    },
    onError: (msg) => toast.error(msg),
  })

  const aiApplyMut = useMutation({
    mutationFn: async () => {
      if (!aiResult) return
      // Optionally clear existing CPMK? We'll add new ones to keep safe — but prompt asked for "may overwrite"
      // We append with shifted urutan
      const existingCount = rps.cpmk.length
      for (let i = 0; i < aiResult.length; i++) {
        const c = aiResult[i]
        const created = await api.createCpmk(rps.id, {
          kode: c.kode,
          deskripsi: c.deskripsi,
          urutan: existingCount + i + 1,
        })
        for (let j = 0; j < c.subCpmk.length; j++) {
          const s = c.subCpmk[j]
          await api.createSubCpmk(created.id, { kode: s.kode, deskripsi: s.deskripsi, urutan: j + 1 })
        }
      }
    },
    onSuccess: () => {
      toast.success('CPMK dari AI diterapkan ke RPS')
      queryClient.invalidateQueries({ queryKey: ['rps', rps.id] })
      setAiApplyConfirm(false)
      setAiOpen(false)
      setAiResult(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const aiReplaceMut = useMutation({
    mutationFn: async () => {
      if (!aiResult) return
      // Delete all existing CPMK then add new
      for (const c of rps.cpmk) {
        await api.deleteCpmk(rps.id, c.id)
      }
      for (let i = 0; i < aiResult.length; i++) {
        const c = aiResult[i]
        const created = await api.createCpmk(rps.id, {
          kode: c.kode,
          deskripsi: c.deskripsi,
          urutan: i + 1,
        })
        for (let j = 0; j < c.subCpmk.length; j++) {
          const s = c.subCpmk[j]
          await api.createSubCpmk(created.id, { kode: s.kode, deskripsi: s.deskripsi, urutan: j + 1 })
        }
      }
    },
    onSuccess: () => {
      toast.success('CPMK diganti dengan hasil AI')
      queryClient.invalidateQueries({ queryKey: ['rps', rps.id] })
      setAiApplyConfirm(false)
      setAiOpen(false)
      setAiResult(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Capaian Pembelajaran Mata Kuliah (CPMK)</CardTitle>
            <CardDescription>
              {rps.cpmk.length} CPMK · {rps.cpmk.reduce((sum, c) => sum + c.subCpmk.length, 0)} Sub-CPMK
            </CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setAiResult(null)
                setAiOpen(true)
              }}
            >
              <Sparkles className="size-4 mr-2" /> Generate AI
            </Button>
            <Button onClick={() => setAddCpmkOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="size-4 mr-2" /> Tambah CPMK
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rps.cpmk.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Sparkles className="size-8 mx-auto mb-2 opacity-40" />
              Belum ada CPMK. Tambah manual atau generate dengan AI.
            </div>
          ) : (
            rps.cpmk.map((cpmk) => {
              const isCollapsed = collapsed.has(cpmk.id)
              return (
                <Card key={cpmk.id} className="border-l-4 border-l-primary/60">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleCollapse(cpmk.id)}
                        className="mt-1 p-1 rounded hover:bg-accent"
                        aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                      >
                        {isCollapsed ? (
                          <ChevronRight className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </button>
                      <Badge variant="secondary" className="font-mono shrink-0">
                        {cpmk.kode}
                      </Badge>
                      <p className="text-sm flex-1">{cpmk.deskripsi}</p>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8"
                          onClick={() => setEditingCpmk(cpmk)}
                          aria-label="Edit CPMK"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteCpmk(cpmk)}
                          aria-label="Hapus CPMK"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {!isCollapsed && (
                      <div className="ml-9 mt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Sub-CPMK ({cpmk.subCpmk.length})
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => setAddSubCpmkFor(cpmk.id)}
                          >
                            <Plus className="size-3 mr-1" /> Sub-CPMK
                          </Button>
                        </div>
                        {cpmk.subCpmk.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic pl-3">
                            Belum ada Sub-CPMK.
                          </p>
                        ) : (
                          <ul className="space-y-1.5">
                            {cpmk.subCpmk.map((sub) => (
                              <li
                                key={sub.id}
                                className="flex items-start gap-2 text-sm pl-3 border-l-2 border-muted"
                              >
                                <Badge variant="outline" className="font-mono text-[10px] shrink-0">
                                  {sub.kode}
                                </Badge>
                                <p className="flex-1">{sub.deskripsi}</p>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-6"
                                  onClick={() =>
                                    setEditingSubCpmk({ cpmkId: cpmk.id, subCpmk: sub })
                                  }
                                  aria-label="Edit Sub-CPMK"
                                >
                                  <Pencil className="size-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-6 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    setDeleteSubCpmk({ cpmkId: cpmk.id, subCpmk: sub })
                                  }
                                  aria-label="Hapus Sub-CPMK"
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </CardContent>
      </Card>

      {/* Add / Edit CPMK dialog */}
      <CpmkFormDialog
        open={!!editingCpmk || addCpmkOpen}
        onOpenChange={(o) => {
          if (!o) {
            setEditingCpmk(null)
            setAddCpmkOpen(false)
          }
        }}
        rpsId={rps.id}
        cpmk={editingCpmk}
      />

      {/* Add / Edit Sub-CPMK dialog */}
      <SubCpmkFormDialog
        open={!!editingSubCpmk || !!addSubCpmkFor}
        onOpenChange={(o) => {
          if (!o) {
            setEditingSubCpmk(null)
            setAddSubCpmkFor(null)
          }
        }}
        cpmkId={editingSubCpmk?.cpmkId ?? addSubCpmkFor ?? ''}
        subCpmk={editingSubCpmk?.subCpmk ?? null}
      />

      {/* Delete CPMK */}
      <AlertDialog open={!!deleteCpmk} onOpenChange={(o) => !o && setDeleteCpmk(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus CPMK?</AlertDialogTitle>
            <AlertDialogDescription>
              Menghapus <strong>{deleteCpmk?.kode}</strong> juga akan menghapus seluruh Sub-CPMK
              di dalamnya. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => deleteCpmk && deleteCpmkMut.mutate(deleteCpmk.id)}
              disabled={deleteCpmkMut.isPending}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Sub-CPMK */}
      <AlertDialog open={!!deleteSubCpmk} onOpenChange={(o) => !o && setDeleteSubCpmk(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Sub-CPMK?</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus <strong>{deleteSubCpmk?.subCpmk.kode}</strong>? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() =>
                deleteSubCpmk && deleteSubMut.mutate(deleteSubCpmk.subCpmk.id)
              }
              disabled={deleteSubMut.isPending}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Generate Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" /> Generate CPMK dengan AI
            </DialogTitle>
            <DialogDescription>
              AI akan menyusun CPMK dan Sub-CPMK berdasarkan informasi mata kuliah{' '}
              <strong>{rps.mataKuliah.nama}</strong>.
            </DialogDescription>
          </DialogHeader>

          {!aiResult ? (
            <div className="space-y-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="jumlah">Jumlah CPMK yang diinginkan</Label>
                <Input
                  id="jumlah"
                  type="number"
                  min={1}
                  max={10}
                  value={aiJumlah}
                  onChange={(e) => setAiJumlah(Math.max(1, Math.min(10, Number(e.target.value) || 4)))}
                />
                <p className="text-xs text-muted-foreground">
                  Setiap CPMK akan memiliki 2-3 Sub-CPMK.
                </p>
              </div>

              <div className="rounded-lg bg-muted/50 p-3 text-xs">
                <p className="font-medium mb-1">Konteks yang dikirim ke AI:</p>
                <ul className="space-y-0.5 text-muted-foreground">
                  <li>Mata Kuliah: {rps.mataKuliah.nama} ({rps.mataKuliah.kode})</li>
                  <li>SKS: {rps.mataKuliah.sks} · Semester: {rps.mataKuliah.semester}</li>
                  <li>Prodi: {rps.mataKuliah.prodi}</li>
                  <li className="line-clamp-2">Deskripsi: {rps.deskripsi || rps.mataKuliah.deskripsi}</li>
                </ul>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAiOpen(false)}>
                  Batal
                </Button>
                <Button
                  onClick={() =>
                    aiGen.mutate(() =>
                      api.generateCpmk({
                        namaMataKuliah: rps.mataKuliah.nama,
                        deskripsi: rps.deskripsi || rps.mataKuliah.deskripsi || '',
                        sks: rps.mataKuliah.sks,
                        prodi: rps.mataKuliah.prodi,
                        semester: rps.mataKuliah.semester,
                        jumlahCpmk: aiJumlah,
                      })
                    )
                  }
                  disabled={aiGen.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {aiGen.isPending ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="size-4 mr-2" />
                  )}
                  {aiGen.isPending ? `Generate... ${aiGen.progress}%` : 'Generate'}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 text-xs">
                <p className="font-medium text-emerald-800 dark:text-emerald-200">
                  {aiResult.length} CPMK berhasil dibuat. Tinjau hasil di bawah ini.
                </p>
                <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Total Sub-CPMK: {aiResult.reduce((s, c) => s + c.subCpmk.length, 0)}
                </p>
              </div>

              <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-3 pr-1">
                {aiResult.map((c, i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="font-mono shrink-0">
                          {c.kode}
                        </Badge>
                        <p className="text-sm">{c.deskripsi}</p>
                      </div>
                      <ul className="mt-2 ml-7 space-y-1">
                        {c.subCpmk.map((s, j) => (
                          <li key={j} className="text-xs flex gap-2">
                            <span className="font-mono text-muted-foreground shrink-0">{s.kode}</span>
                            <span>{s.deskripsi}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button variant="ghost" onClick={() => setAiResult(null)} className="sm:mr-auto">
                  <X className="size-4 mr-1" /> Batal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => aiApplyMut.mutate()}
                  disabled={aiApplyMut.isPending || aiReplaceMut.isPending}
                >
                  {aiApplyMut.isPending ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="size-4 mr-2" />
                  )}
                  Tambahkan ke yang ada
                </Button>
                <Button
                  onClick={() => setAiApplyConfirm(true)}
                  disabled={aiApplyMut.isPending || aiReplaceMut.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Save className="size-4 mr-2" />
                  Ganti yang ada
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Replace confirm */}
      <AlertDialog open={aiApplyConfirm} onOpenChange={setAiApplyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ganti seluruh CPMK yang ada?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua CPMK dan Sub-CPMK yang sudah ada ({rps.cpmk.length} CPMK) akan dihapus dan
              diganti dengan hasil AI. Pertimbangkan untuk memilih &quot;Tambahkan ke yang ada&quot;
              jika ingin mempertahankan CPMK lama.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => aiReplaceMut.mutate()}
              disabled={aiReplaceMut.isPending}
            >
              {aiReplaceMut.isPending ? 'Memproses...' : 'Ya, Ganti'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ===== Helper dialog components =====

function CpmkFormDialog({
  open,
  onOpenChange,
  rpsId,
  cpmk,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  rpsId: string
  cpmk: Cpmk | null
}) {
  const queryClient = useQueryClient()
  const isEdit = !!cpmk

  return (
    <CpmkFormDialogInner
      key={cpmk?.id ?? 'new'}
      open={open}
      onOpenChange={onOpenChange}
      rpsId={rpsId}
      cpmk={cpmk}
      isEdit={isEdit}
      initialKode={cpmk?.kode ?? ''}
      initialDeskripsi={cpmk?.deskripsi ?? ''}
      onSaved={() => {
        queryClient.invalidateQueries({ queryKey: ['rps', rpsId] })
      }}
    />
  )
}

function CpmkFormDialogInner({
  open,
  onOpenChange,
  rpsId,
  cpmk,
  isEdit,
  initialKode,
  initialDeskripsi,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  rpsId: string
  cpmk: Cpmk | null
  isEdit: boolean
  initialKode: string
  initialDeskripsi: string
  onSaved: () => void
}) {
  const [kode, setKode] = useState(initialKode)
  const [deskripsi, setDeskripsi] = useState(initialDeskripsi)

  const mut = useMutation({
    mutationFn: async () => {
      if (isEdit && cpmk) {
        return api.updateCpmk(rpsId, cpmk.id, { kode, deskripsi })
      }
      return api.createCpmk(rpsId, { kode, deskripsi })
    },
    onSuccess: () => {
      toast.success(isEdit ? 'CPMK diperbarui' : 'CPMK dibuat')
      onSaved()
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit CPMK' : 'Tambah CPMK'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui kode atau deskripsi CPMK.'
              : 'Lengkapi kode dan deskripsi CPMK baru.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="kode">Kode CPMK</Label>
            <Input
              id="kode"
              placeholder="CPMK1"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desk">Deskripsi CPMK</Label>
            <Textarea
              id="desk"
              rows={4}
              placeholder="Mahasiswa mampu..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Gunakan kata kerja aktif taksonomi Bloom (menjelaskan, menerapkan, menganalisis, dll).
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !kode || !deskripsi}>
            {mut.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SubCpmkFormDialog({
  open,
  onOpenChange,
  cpmkId,
  subCpmk,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  cpmkId: string
  subCpmk: Cpmk['subCpmk'][number] | null
}) {
  const queryClient = useQueryClient()
  const isEdit = !!subCpmk

  return (
    <SubCpmkFormDialogInner
      key={subCpmk?.id ?? `new-${cpmkId}`}
      open={open}
      onOpenChange={onOpenChange}
      cpmkId={cpmkId}
      subCpmk={subCpmk}
      isEdit={isEdit}
      initialKode={subCpmk?.kode ?? ''}
      initialDeskripsi={subCpmk?.deskripsi ?? ''}
      onSaved={() => {
        queryClient.invalidateQueries({ queryKey: ['rps'] })
      }}
    />
  )
}

function SubCpmkFormDialogInner({
  open,
  onOpenChange,
  cpmkId,
  subCpmk,
  isEdit,
  initialKode,
  initialDeskripsi,
  onSaved,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  cpmkId: string
  subCpmk: Cpmk['subCpmk'][number] | null
  isEdit: boolean
  initialKode: string
  initialDeskripsi: string
  onSaved: () => void
}) {
  const [kode, setKode] = useState(initialKode)
  const [deskripsi, setDeskripsi] = useState(initialDeskripsi)

  const mut = useMutation({
    mutationFn: async () => {
      if (isEdit && subCpmk) {
        return api.updateSubCpmk(subCpmk.id, { kode, deskripsi })
      }
      return api.createSubCpmk(cpmkId, { kode, deskripsi })
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Sub-CPMK diperbarui' : 'Sub-CPMK dibuat')
      onSaved()
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Sub-CPMK' : 'Tambah Sub-CPMK'}</DialogTitle>
          <DialogDescription>
            Sub-CPMK adalah penjabaran lebih spesifik dari CPMK.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="skode">Kode Sub-CPMK</Label>
            <Input
              id="skode"
              placeholder="Sub-CPMK1.1"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sdesk">Deskripsi</Label>
            <Textarea
              id="sdesk"
              rows={3}
              placeholder="Penjabaran spesifik dari CPMK..."
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !kode || !deskripsi}>
            {mut.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
