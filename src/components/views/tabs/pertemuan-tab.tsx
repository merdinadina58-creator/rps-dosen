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
  Save,
  AlertTriangle,
  Wand2,
  X,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { api, type RpsDetail, type Pertemuan } from '@/lib/api'
import { useAsyncAiJob } from '@/hooks/use-async-ai-job'

interface Props {
  rps: RpsDetail
}

interface GeneratedPertemuan {
  mingguKe: number
  materi: string
  metode: string
  aktivitasDosen: string
  aktivitasMhs: string
  pengalamanBelajar: string
  indikatorPenilaian: string
  bobotPenilaian: number
  estimasiWaktu: string
  subCpmkTerkait: string[]
}

export function PertemuanTab({ rps }: Props) {
  const queryClient = useQueryClient()

  const [editing, setEditing] = useState<Pertemuan | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<Pertemuan | null>(null)

  const [aiOpen, setAiOpen] = useState(false)
  const [aiResult, setAiResult] = useState<GeneratedPertemuan[] | null>(null)
  const [aiApplyConfirm, setAiApplyConfirm] = useState(false)

  const totalBobot = rps.pertemuan.reduce((s, p) => s + p.bobotPenilaian, 0)
  const bobotValid = totalBobot === 100

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deletePertemuan(id),
    onSuccess: () => {
      toast.success('Pertemuan dihapus')
      queryClient.invalidateQueries({ queryKey: ['rps', rps.id] })
      setDeleting(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const aiGen = useAsyncAiJob<{ pertemuan: GeneratedPertemuan[] }>({
    onSuccess: (data) => {
      setAiResult(data.pertemuan)
      toast.success(`${data.pertemuan.length} pertemuan berhasil dibuat`)
    },
    onError: (msg) => toast.error(msg),
  })

  const buildPertemuanInput = () => {
    const cpmkList = rps.cpmk.map((c) => ({ kode: c.kode, deskripsi: c.deskripsi }))
    const subCpmkList = rps.cpmk.flatMap((c) =>
      c.subCpmk.map((s) => ({ kode: s.kode, deskripsi: s.deskripsi, cpmkKode: c.kode }))
    )
    if (cpmkList.length === 0) {
      throw new Error('Belum ada CPMK. Buat CPMK terlebih dahulu sebelum generate pertemuan.')
    }
    return {
      namaMataKuliah: rps.mataKuliah.nama,
      deskripsi: rps.deskripsi || rps.mataKuliah.deskripsi || '',
      sks: rps.mataKuliah.sks,
      cpmkList,
      subCpmkList,
      jumlahPertemuan: rps.mingguPertemuan,
    }
  }

  const aiReplaceMut = useMutation({
    mutationFn: async () => {
      if (!aiResult) return
      for (const p of rps.pertemuan) {
        await api.deletePertemuan(p.id)
      }
      for (let i = 0; i < aiResult.length; i++) {
        const p = aiResult[i]
        await api.createPertemuan(rps.id, {
          mingguKe: p.mingguKe,
          materi: p.materi,
          metode: p.metode,
          aktivitasDosen: p.aktivitasDosen,
          aktivitasMhs: p.aktivitasMhs,
          pengalamanBelajar: p.pengalamanBelajar,
          indikatorPenilaian: p.indikatorPenilaian,
          bobotPenilaian: p.bobotPenilaian,
          estimasiWaktu: p.estimasiWaktu,
          urutan: i + 1,
        })
      }
    },
    onSuccess: () => {
      toast.success('Rencana mingguan diterapkan dari AI')
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
            <CardTitle className="text-base">Rencana Pembelajaran Mingguan</CardTitle>
            <CardDescription>
              {rps.pertemuan.length} dari {rps.mingguPertemuan} pertemuan
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
            <Button onClick={() => setAdding(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="size-4 mr-2" /> Tambah Pertemuan
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Total bobot */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">Total Bobot Penilaian</span>
              <span
                className={`font-bold ${bobotValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
              >
                {totalBobot}%
              </span>
            </div>
            <Progress value={totalBobot} className={bobotValid ? '[&>div]:bg-emerald-500' : '[&>div]:bg-amber-500'} />
            {!bobotValid && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                <AlertTriangle className="size-3" />
                Total bobot seharusnya 100% (saat ini {totalBobot}%)
              </p>
            )}
          </div>

          {rps.pertemuan.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <Sparkles className="size-8 mx-auto mb-2 opacity-40" />
              Belum ada pertemuan. Tambah manual atau generate dengan AI.
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <div className="max-h-[560px] overflow-auto scrollbar-thin">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted z-10">
                    <TableRow>
                      <TableHead className="w-12">Mgg</TableHead>
                      <TableHead className="min-w-48">Materi</TableHead>
                      <TableHead className="w-32">Metode</TableHead>
                      <TableHead className="w-20">Bobot</TableHead>
                      <TableHead className="w-28">Waktu</TableHead>
                      <TableHead className="w-20 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rps.pertemuan.map((p) => (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer hover:bg-accent/40"
                        onClick={() => setEditing(p)}
                      >
                        <TableCell className="font-medium text-center">{p.mingguKe}</TableCell>
                        <TableCell>
                          <p className="font-medium text-sm line-clamp-1">{p.materi || '-'}</p>
                          {p.subCpmkUtama && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{p.subCpmkUtama}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {p.metode ? (
                            <Badge variant="secondary" className="text-[10px]">{p.metode}</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-center">{p.bobotPenilaian}%</TableCell>
                        <TableCell className="text-xs">{p.estimasiWaktu || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditing(p)
                              }}
                              aria-label="Edit"
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleting(p)
                              }}
                              aria-label="Hapus"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <PertemuanFormDialog
        key={editing?.id ?? (adding ? 'new' : 'closed')}
        open={!!editing || adding}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null)
            setAdding(false)
          }
        }}
        rpsId={rps.id}
        pertemuan={editing}
        nextMingguKe={(rps.pertemuan.reduce((m, p) => Math.max(m, p.mingguKe), 0) || 0) + 1}
      />

      {/* Delete */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pertemuan?</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus pertemuan minggu ke-{deleting?.mingguKe}? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => deleting && deleteMut.mutate(deleting.id)}
              disabled={deleteMut.isPending}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Generate */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" /> Generate Rencana Mingguan AI
            </DialogTitle>
            <DialogDescription>
              AI akan menyusun {rps.mingguPertemuan} pertemuan berdasarkan CPMK & Sub-CPMK yang ada.
            </DialogDescription>
          </DialogHeader>

          {!aiResult ? (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/50 p-3 text-xs">
                <p className="font-medium mb-2">Konteks untuk AI:</p>
                <div className="space-y-1.5 text-muted-foreground">
                  <p>Mata Kuliah: {rps.mataKuliah.nama} ({rps.mataKuliah.sks} SKS)</p>
                  <p>CPMK ({rps.cpmk.length}):</p>
                  <ul className="ml-4 space-y-0.5">
                    {rps.cpmk.slice(0, 5).map((c) => (
                      <li key={c.id}>
                        <span className="font-mono">{c.kode}</span>: {c.deskripsi.slice(0, 80)}
                        {c.deskripsi.length > 80 ? '...' : ''}
                      </li>
                    ))}
                  </ul>
                  <p>Sub-CPMK: {rps.cpmk.reduce((s, c) => s + c.subCpmk.length, 0)} item</p>
                  {rps.cpmk.length === 0 && (
                    <p className="text-amber-600 dark:text-amber-400 font-medium mt-2">
                      ⚠ Belum ada CPMK. Buat CPMK terlebih dahulu di tab CPMK.
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setAiOpen(false)}>
                  Batal
                </Button>
                <Button
                  onClick={() => aiGen.mutate(() => api.generatePertemuan(buildPertemuanInput()))}
                  disabled={aiGen.isPending || rps.cpmk.length === 0}
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
                  {aiResult.length} pertemuan berhasil dibuat.
                </p>
                <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Total bobot:{' '}
                  {aiResult.reduce((s, p) => s + (Number(p.bobotPenilaian) || 0), 0)}%
                </p>
              </div>

              <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-2 pr-1">
                {aiResult.map((p, i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Badge variant="secondary" className="font-mono shrink-0">
                          Mgg {p.mingguKe}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{p.materi}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.metode} · {p.estimasiWaktu} · Bobot {p.bobotPenilaian}%
                          </p>
                          {p.subCpmkTerkait && p.subCpmkTerkait.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {p.subCpmkTerkait.map((s, j) => (
                                <Badge key={j} variant="outline" className="text-[10px] font-mono">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button variant="ghost" onClick={() => setAiResult(null)} className="sm:mr-auto">
                  <X className="size-4 mr-1" /> Batal
                </Button>
                <Button
                  onClick={() => setAiApplyConfirm(true)}
                  disabled={aiReplaceMut.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {aiReplaceMut.isPending ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="size-4 mr-2" />
                  )}
                  Terapkan ke RPS
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={aiApplyConfirm} onOpenChange={setAiApplyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terapkan rencana mingguan dari AI?</AlertDialogTitle>
            <AlertDialogDescription>
              {rps.pertemuan.length > 0 ? (
                <>
                  Semua pertemuan yang ada ({rps.pertemuan.length} pertemuan) akan{' '}
                  <strong>dihapus dan diganti</strong> dengan hasil AI ({aiResult?.length ?? 0}{' '}
                  pertemuan).
                </>
              ) : (
                <>AI akan membuat {aiResult?.length ?? 0} pertemuan baru.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => aiReplaceMut.mutate()}
              disabled={aiReplaceMut.isPending}
            >
              {aiReplaceMut.isPending ? 'Memproses...' : 'Ya, Terapkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PertemuanFormDialog({
  open,
  onOpenChange,
  rpsId,
  pertemuan,
  nextMingguKe,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  rpsId: string
  pertemuan: Pertemuan | null
  nextMingguKe: number
}) {
  const queryClient = useQueryClient()
  const isEdit = !!pertemuan

  const [form, setForm] = useState({
    mingguKe: pertemuan?.mingguKe ?? nextMingguKe,
    materi: pertemuan?.materi ?? '',
    metode: pertemuan?.metode ?? '',
    aktivitasDosen: pertemuan?.aktivitasDosen ?? '',
    aktivitasMhs: pertemuan?.aktivitasMhs ?? '',
    pengalamanBelajar: pertemuan?.pengalamanBelajar ?? '',
    indikatorPenilaian: pertemuan?.indikatorPenilaian ?? '',
    bobotPenilaian: pertemuan?.bobotPenilaian ?? 0,
    estimasiWaktu: pertemuan?.estimasiWaktu ?? '150 menit',
    subCpmkUtama: pertemuan?.subCpmkUtama ?? '',
  })

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        materi: form.materi || null,
        metode: form.metode || null,
        aktivitasDosen: form.aktivitasDosen || null,
        aktivitasMhs: form.aktivitasMhs || null,
        pengalamanBelajar: form.pengalamanBelajar || null,
        indikatorPenilaian: form.indikatorPenilaian || null,
        subCpmkUtama: form.subCpmkUtama || null,
      }
      if (isEdit && pertemuan) {
        return api.updatePertemuan(pertemuan.id, payload)
      }
      return api.createPertemuan(rpsId, payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Pertemuan diperbarui' : 'Pertemuan dibuat')
      queryClient.invalidateQueries({ queryKey: ['rps', rpsId] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit Pertemuan ${pertemuan?.mingguKe}` : 'Tambah Pertemuan'}</DialogTitle>
          <DialogDescription>Detail rencana pembelajaran untuk satu pertemuan.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="mgg">Minggu Ke</Label>
              <Input
                id="mgg"
                type="number"
                min={1}
                value={form.mingguKe}
                onChange={(e) => setForm((f) => ({ ...f, mingguKe: Number(e.target.value) || 1 }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bobot">Bobot (%)</Label>
              <Input
                id="bobot"
                type="number"
                min={0}
                max={100}
                value={form.bobotPenilaian}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bobotPenilaian: Number(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="waktu">Estimasi Waktu</Label>
              <Input
                id="waktu"
                value={form.estimasiWaktu}
                onChange={(e) => setForm((f) => ({ ...f, estimasiWaktu: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="materi">Materi / Bahasan</Label>
            <Textarea
              id="materi"
              rows={2}
              value={form.materi}
              onChange={(e) => setForm((f) => ({ ...f, materi: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="metode">Metode Pembelajaran</Label>
            <Input
              id="metode"
              placeholder="Ceramah, Diskusi, Praktikum..."
              value={form.metode}
              onChange={(e) => setForm((f) => ({ ...f, metode: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="adosen">Aktivitas Dosen</Label>
              <Textarea
                id="adosen"
                rows={3}
                value={form.aktivitasDosen}
                onChange={(e) => setForm((f) => ({ ...f, aktivitasDosen: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amhs">Aktivitas Mahasiswa</Label>
              <Textarea
                id="amhs"
                rows={3}
                value={form.aktivitasMhs}
                onChange={(e) => setForm((f) => ({ ...f, aktivitasMhs: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pengalaman">Pengalaman Belajar</Label>
            <Textarea
              id="pengalaman"
              rows={2}
              value={form.pengalamanBelajar}
              onChange={(e) => setForm((f) => ({ ...f, pengalamanBelajar: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="indikator">Indikator Penilaian</Label>
            <Textarea
              id="indikator"
              rows={2}
              value={form.indikatorPenilaian}
              onChange={(e) => setForm((f) => ({ ...f, indikatorPenilaian: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
