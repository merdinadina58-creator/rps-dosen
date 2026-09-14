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
  BookMarked,
  Save,
  X,
  ExternalLink,
  Wand2,
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, type RpsDetail, type Referensi } from '@/lib/api'
import { useAsyncAiJob } from '@/hooks/use-async-ai-job'

interface Props {
  rps: RpsDetail
}

export function ReferensiTab({ rps }: Props) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Referensi | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<Referensi | null>(null)

  const [aiOpen, setAiOpen] = useState(false)
  const [aiResult, setAiResult] = useState<Array<Record<string, unknown>> | null>(null)
  const [aiApplyConfirm, setAiApplyConfirm] = useState(false)

  const bukuUtama = rps.referensi.filter((r) => r.isUtama)
  const bukuPendukung = rps.referensi.filter((r) => !r.isUtama)

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteReferensi(id),
    onSuccess: () => {
      toast.success('Referensi dihapus')
      queryClient.invalidateQueries({ queryKey: ['rps', rps.id] })
      setDeleting(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const aiGen = useAsyncAiJob<{ referensi: GeneratedReferensi[] }>({
    onSuccess: (data) => {
      setAiResult(data.referensi)
      toast.success(`${data.referensi.length} referensi dibuat`)
    },
    onError: (msg) => toast.error(msg),
  })

  const buildReferensiInput = () => ({
    namaMataKuliah: rps.mataKuliah.nama,
    deskripsi: rps.deskripsi || rps.mataKuliah.deskripsi || '',
    prodi: rps.mataKuliah.prodi,
  })

  const aiApplyMut = useMutation({
    mutationFn: async () => {
      if (!aiResult) return
      // Append new referensi (don't delete existing by default)
      const startUrutan = rps.referensi.length
      for (let i = 0; i < aiResult.length; i++) {
        const r = aiResult[i]
        await api.createReferensi(rps.id, {
          jenis: (r.jenis as string) || 'buku',
          judul: r.judul as string,
          pengarang: (r.pengarang as string) || null,
          penerbit: (r.penerbit as string) || null,
          tahun: (r.tahun as string) || null,
          url: (r.url as string) || null,
          isUtama: Boolean(r.isUtama),
          urutan: startUrutan + i + 1,
        })
      }
    },
    onSuccess: () => {
      toast.success('Referensi dari AI ditambahkan')
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
            <CardTitle className="text-base">Referensi / Bahan Pustaka</CardTitle>
            <CardDescription>
              {rps.referensi.length} referensi · {bukuUtama.length} utama · {bukuPendukung.length} pendukung
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
              <Plus className="size-4 mr-2" /> Tambah Referensi
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {rps.referensi.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <BookMarked className="size-8 mx-auto mb-2 opacity-40" />
              Belum ada referensi. Tambah manual atau generate dengan AI.
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                    Utama
                  </Badge>
                  <span className="text-muted-foreground font-normal">({bukuUtama.length})</span>
                </h3>
                <ol className="space-y-2 ml-4">
                  {bukuUtama.map((r, i) => (
                    <ReferensiItem
                      key={r.id}
                      referensi={r}
                      index={i + 1}
                      onEdit={() => setEditing(r)}
                      onDelete={() => setDeleting(r)}
                    />
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="secondary">Pendukung</Badge>
                  <span className="text-muted-foreground font-normal">({bukuPendukung.length})</span>
                </h3>
                {bukuPendukung.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic ml-4">Belum ada referensi pendukung.</p>
                ) : (
                  <ol className="space-y-2 ml-4">
                    {bukuPendukung.map((r, i) => (
                      <ReferensiItem
                        key={r.id}
                        referensi={r}
                        index={i + 1}
                        onEdit={() => setEditing(r)}
                        onDelete={() => setDeleting(r)}
                      />
                    ))}
                  </ol>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ReferensiFormDialog
        key={editing?.id ?? (adding ? 'new' : 'closed')}
        open={!!editing || adding}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null)
            setAdding(false)
          }
        }}
        rpsId={rps.id}
        referensi={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Referensi?</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus <strong>{deleting?.judul}</strong>?
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

      {/* AI */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto scrollbar-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" /> Generate Referensi AI
            </DialogTitle>
            <DialogDescription>
              AI akan menyarankan buku teks utama dan referensi pendukung untuk mata kuliah{' '}
              <strong>{rps.mataKuliah.nama}</strong>.
            </DialogDescription>
          </DialogHeader>

          {!aiResult ? (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                AI akan menggunakan informasi: nama mata kuliah, deskripsi, dan prodi untuk
                menyarankan 6 referensi (3 utama + 3 pendukung).
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAiOpen(false)}>Batal</Button>
                <Button
                  onClick={() => aiGen.mutate(() => api.generateReferensi(buildReferensiInput()))}
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
                  {aiResult.length} referensi berhasil dibuat
                </p>
              </div>

              <div className="max-h-72 overflow-y-auto scrollbar-thin space-y-2 pr-1">
                {aiResult.map((r, i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="font-mono shrink-0">
                          {String(r.jenis ?? 'buku')}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{String(r.judul)}</p>
                          <p className="text-xs text-muted-foreground">
                            {[r.pengarang, r.penerbit, r.tahun].filter(Boolean).join(', ')}
                          </p>
                          {r.isUtama ? (
                            <Badge className="mt-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 text-[10px]">
                              Utama
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="mt-1 text-[10px]">Pendukung</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setAiResult(null)} className="sm:mr-auto">
                  <X className="size-4 mr-1" /> Batal
                </Button>
                <Button
                  onClick={() => setAiApplyConfirm(true)}
                  disabled={aiApplyMut.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {aiApplyMut.isPending ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="size-4 mr-2" />
                  )}
                  Tambahkan ke RPS
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={aiApplyConfirm} onOpenChange={setAiApplyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tambahkan {aiResult?.length ?? 0} referensi?</AlertDialogTitle>
            <AlertDialogDescription>
              Referensi baru akan ditambahkan ke daftar yang sudah ada ({rps.referensi.length}{' '}
              referensi). Referensi lama tidak akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => aiApplyMut.mutate()}
              disabled={aiApplyMut.isPending}
            >
              {aiApplyMut.isPending ? 'Memproses...' : 'Tambahkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ReferensiItem({
  referensi: r,
  index,
  onEdit,
  onDelete,
}: {
  referensi: Referensi
  index: number
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{index}.</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium">
          {r.pengarang && <span className="italic">{r.pengarang}. </span>}
          <span>{r.judul}. </span>
          <span className="text-muted-foreground">
            {[r.penerbit, r.tahun].filter(Boolean).join(', ')}
            {r.penerbit || r.tahun ? '.' : ''}
          </span>
        </p>
        {r.url && (
          <a
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
          >
            <ExternalLink className="size-3" /> {r.url}
          </a>
        )}
        <Badge variant="outline" className="mt-1 text-[10px] capitalize">{r.jenis}</Badge>
      </div>
      <div className="flex shrink-0">
        <Button size="icon" variant="ghost" className="size-7" onClick={onEdit} aria-label="Edit">
          <Pencil className="size-3" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-destructive hover:text-destructive"
          onClick={onDelete}
          aria-label="Hapus"
        >
          <Trash2 className="size-3" />
        </Button>
      </div>
    </li>
  )
}

function ReferensiFormDialog({
  open,
  onOpenChange,
  rpsId,
  referensi,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  rpsId: string
  referensi: Referensi | null
}) {
  const queryClient = useQueryClient()
  const isEdit = !!referensi

  const [form, setForm] = useState({
    jenis: referensi?.jenis ?? 'buku',
    judul: referensi?.judul ?? '',
    pengarang: referensi?.pengarang ?? '',
    penerbit: referensi?.penerbit ?? '',
    tahun: referensi?.tahun ?? '',
    isbn: referensi?.isbn ?? '',
    url: referensi?.url ?? '',
    isUtama: referensi?.isUtama ?? false,
  })

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        pengarang: form.pengarang || null,
        penerbit: form.penerbit || null,
        tahun: form.tahun || null,
        isbn: form.isbn || null,
        url: form.url || null,
      }
      if (isEdit && referensi) {
        return api.updateReferensi(referensi.id, payload)
      }
      return api.createReferensi(rpsId, payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Referensi diperbarui' : 'Referensi dibuat')
      queryClient.invalidateQueries({ queryKey: ['rps', rpsId] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Referensi' : 'Tambah Referensi'}</DialogTitle>
          <DialogDescription>Tambahkan buku teks, jurnal, atau sumber online.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="jenis">Jenis</Label>
              <Select value={form.jenis} onValueChange={(v) => setForm((f) => ({ ...f, jenis: v }))}>
                <SelectTrigger id="jenis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buku">Buku</SelectItem>
                  <SelectItem value="jurnal">Jurnal</SelectItem>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="skripsi">Skripsi/Tesis</SelectItem>
                  <SelectItem value="lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tahun">Tahun</Label>
              <Input
                id="tahun"
                placeholder="2024"
                value={form.tahun}
                onChange={(e) => setForm((f) => ({ ...f, tahun: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="judul">Judul</Label>
            <Input
              id="judul"
              placeholder="Judul buku / jurnal"
              value={form.judul}
              onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="pengarang">Pengarang</Label>
              <Input
                id="pengarang"
                placeholder="Nama pengarang"
                value={form.pengarang}
                onChange={(e) => setForm((f) => ({ ...f, pengarang: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="penerbit">Penerbit</Label>
              <Input
                id="penerbit"
                value={form.penerbit}
                onChange={(e) => setForm((f) => ({ ...f, penerbit: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="isbn">ISBN</Label>
              <Input
                id="isbn"
                value={form.isbn}
                onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                placeholder="https://"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="utama"
              checked={form.isUtama}
              onCheckedChange={(v) => setForm((f) => ({ ...f, isUtama: v === true }))}
            />
            <Label htmlFor="utama" className="cursor-pointer">
              Referensi utama (bukan pendukung)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !form.judul}>
            {mut.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
