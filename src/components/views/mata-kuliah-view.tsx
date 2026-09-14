'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, BookOpen, Search } from 'lucide-react'
import { motion } from 'framer-motion'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { api, type MataKuliah } from '@/lib/api'

export function MataKuliahView() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [prodiFilter, setProdiFilter] = useState<string>('all')
  const [editing, setEditing] = useState<MataKuliah | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<MataKuliah | null>(null)

  const { data: mkList = [], isLoading } = useQuery({
    queryKey: ['mata-kuliah'],
    queryFn: () => api.listMataKuliah(),
  })

  const prodiOptions = useMemo(() => {
    const set = new Set<string>()
    mkList.forEach((m) => set.add(m.prodi))
    return Array.from(set)
  }, [mkList])

  const filtered = useMemo(() => {
    return mkList.filter((m) => {
      if (prodiFilter !== 'all' && m.prodi !== prodiFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return (
          m.nama.toLowerCase().includes(q) ||
          m.kode.toLowerCase().includes(q) ||
          m.deskripsi?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [mkList, search, prodiFilter])

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteMataKuliah(id),
    onSuccess: () => {
      toast.success('Mata kuliah dihapus')
      queryClient.invalidateQueries({ queryKey: ['mata-kuliah'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      setDeleting(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mata Kuliah</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Daftar mata kuliah ({mkList.length} mata kuliah)
          </p>
        </div>
        <Button onClick={() => setAdding(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="size-4 mr-2" /> Tambah Mata Kuliah
        </Button>
      </motion.div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari kode atau nama mata kuliah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={prodiFilter} onValueChange={setProdiFilter}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="Semua Prodi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Prodi</SelectItem>
              {prodiOptions.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <BookOpen className="size-8 mx-auto mb-2 opacity-40" />
              Belum ada mata kuliah.
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-muted z-10">
                  <TableRow>
                    <TableHead className="w-24">Kode</TableHead>
                    <TableHead className="min-w-48">Nama</TableHead>
                    <TableHead className="text-center">SKS</TableHead>
                    <TableHead className="text-center">Smt</TableHead>
                    <TableHead>Prodi</TableHead>
                    <TableHead>Prasyarat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-[10px]">
                          {m.kode}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{m.nama}</p>
                        {m.deskripsi && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {m.deskripsi}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono">{m.sks}</TableCell>
                      <TableCell className="text-center">{m.semester}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{m.prodi}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {m.prasyarat || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => setEditing(m)}
                            aria-label="Edit"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleting(m)}
                            aria-label="Hapus"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <MataKuliahFormDialog
        key={editing?.id ?? (adding ? 'new' : 'closed')}
        open={!!editing || adding}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null)
            setAdding(false)
          }
        }}
        mataKuliah={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Mata Kuliah?</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus <strong>{deleting?.nama}</strong> ({deleting?.kode})?
              {(deleting?._count?.rps ?? 0) > 0 && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                  ⚠ Mata kuliah ini masih memiliki {deleting?._count?.rps} RPS. Hapus RPS terkait terlebih dahulu.
                </span>
              )}
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
    </div>
  )
}

function MataKuliahFormDialog({
  open,
  onOpenChange,
  mataKuliah,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  mataKuliah: MataKuliah | null
}) {
  const queryClient = useQueryClient()
  const isEdit = !!mataKuliah

  const [form, setForm] = useState({
    kode: mataKuliah?.kode ?? '',
    nama: mataKuliah?.nama ?? '',
    sks: mataKuliah?.sks ?? 3,
    semester: mataKuliah?.semester ?? 1,
    prodi: mataKuliah?.prodi ?? 'Teknik Informatika',
    deskripsi: mataKuliah?.deskripsi ?? '',
    prasyarat: mataKuliah?.prasyarat ?? '',
  })

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        deskripsi: form.deskripsi || null,
        prasyarat: form.prasyarat || null,
      }
      if (isEdit && mataKuliah) {
        return api.updateMataKuliah(mataKuliah.id, payload)
      }
      return api.createMataKuliah(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Mata kuliah diperbarui' : 'Mata kuliah dibuat')
      queryClient.invalidateQueries({ queryKey: ['mata-kuliah'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Mata Kuliah' : 'Tambah Mata Kuliah'}</DialogTitle>
          <DialogDescription>Data mata kuliah untuk RPS.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="kode">Kode</Label>
              <Input
                id="kode"
                placeholder="IF-201"
                value={form.kode}
                onChange={(e) => setForm((f) => ({ ...f, kode: e.target.value }))}
              />
            </div>
            <div className="grid gap-2 col-span-2">
              <Label htmlFor="nama">Nama Mata Kuliah</Label>
              <Input
                id="nama"
                placeholder="Pemrograman Web"
                value={form.nama}
                onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sks">SKS</Label>
              <Input
                id="sks"
                type="number"
                min={1}
                max={8}
                value={form.sks}
                onChange={(e) => setForm((f) => ({ ...f, sks: Number(e.target.value) || 3 }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="smt">Semester</Label>
              <Input
                id="smt"
                type="number"
                min={1}
                max={14}
                value={form.semester}
                onChange={(e) =>
                  setForm((f) => ({ ...f, semester: Number(e.target.value) || 1 }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="prodi2">Prodi</Label>
              <Input
                id="prodi2"
                value={form.prodi}
                onChange={(e) => setForm((f) => ({ ...f, prodi: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prasyarat">Prasyarat (kode, dipisah koma)</Label>
            <Input
              id="prasyarat"
              placeholder="IF-101, IF-102"
              value={form.prasyarat}
              onChange={(e) => setForm((f) => ({ ...f, prasyarat: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="deskripsi">Deskripsi</Label>
            <Textarea
              id="deskripsi"
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            onClick={() => mut.mutate()}
            disabled={mut.isPending || !form.kode || !form.nama || !form.prodi}
          >
            {mut.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
