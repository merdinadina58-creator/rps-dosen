'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Users, Mail, Phone, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
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
import { api, type Dosen } from '@/lib/api'

export function DosenView() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Dosen | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<Dosen | null>(null)

  const { data: dosenList = [], isLoading } = useQuery({
    queryKey: ['dosen'],
    queryFn: api.listDosen,
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteDosen(id),
    onSuccess: () => {
      toast.success('Dosen dihapus')
      queryClient.invalidateQueries({ queryKey: ['dosen'] })
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
          <h1 className="text-2xl font-bold tracking-tight">Dosen</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Daftar dosen pengampu mata kuliah ({dosenList.length} dosen)
          </p>
        </div>
        <Button onClick={() => setAdding(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="size-4 mr-2" /> Tambah Dosen
        </Button>
      </motion.div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : dosenList.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Users className="size-8 mx-auto mb-2 opacity-40" />
              Belum ada dosen.
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-muted z-10">
                  <TableRow>
                    <TableHead className="min-w-48">Nama</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Prodi</TableHead>
                    <TableHead>Jabatan</TableHead>
                    <TableHead className="text-center">RPS</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dosenList.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                            {d.nama.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                          </div>
                          <span className="font-medium">{d.nama}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{d.nip || '-'}</TableCell>
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          {d.email && (
                            <p className="flex items-center gap-1">
                              <Mail className="size-3" /> {d.email}
                            </p>
                          )}
                          {d.telepon && (
                            <p className="flex items-center gap-1 text-muted-foreground">
                              <Phone className="size-3" /> {d.telepon}
                            </p>
                          )}
                          {!d.email && !d.telepon && '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px]">{d.prodi}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{d.jabatan || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-mono">
                          <FileText className="size-3 mr-1" />
                          {d._count?.rps ?? 0}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8"
                            onClick={() => setEditing(d)}
                            aria-label="Edit"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleting(d)}
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

      <DosenFormDialog
        key={editing?.id ?? (adding ? 'new' : 'closed')}
        open={!!editing || adding}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null)
            setAdding(false)
          }
        }}
        dosen={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dosen?</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus <strong>{deleting?.nama}</strong>?
              {(deleting?._count?.rps ?? 0) > 0 && (
                <span className="block mt-1 text-amber-600 dark:text-amber-400">
                  ⚠ Dosen ini masih memiliki {deleting?._count?.rps} RPS. Hapus RPS terkait terlebih dahulu.
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

function DosenFormDialog({
  open,
  onOpenChange,
  dosen,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  dosen: Dosen | null
}) {
  const queryClient = useQueryClient()
  const isEdit = !!dosen

  const [form, setForm] = useState({
    nama: dosen?.nama ?? '',
    nip: dosen?.nip ?? '',
    email: dosen?.email ?? '',
    telepon: dosen?.telepon ?? '',
    prodi: dosen?.prodi ?? 'Teknik Informatika',
    jabatan: dosen?.jabatan ?? '',
  })

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        nip: form.nip || null,
        email: form.email || null,
        telepon: form.telepon || null,
        jabatan: form.jabatan || null,
      }
      if (isEdit && dosen) {
        return api.updateDosen(dosen.id, payload)
      }
      return api.createDosen(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Dosen diperbarui' : 'Dosen dibuat')
      queryClient.invalidateQueries({ queryKey: ['dosen'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Dosen' : 'Tambah Dosen'}</DialogTitle>
          <DialogDescription>Data dosen pengampu mata kuliah.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="nama">Nama Lengkap (dengan gelar)</Label>
            <Input
              id="nama"
              placeholder="Dr. Ahmad Wijaya, M.Kom."
              value={form.nama}
              onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="nip">NIP / NIDN</Label>
              <Input
                id="nip"
                placeholder="198501012010011001"
                value={form.nip}
                onChange={(e) => setForm((f) => ({ ...f, nip: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jabatan">Jabatan</Label>
              <Select
                value={form.jabatan}
                onValueChange={(v) => setForm((f) => ({ ...f, jabatan: v }))}
              >
                <SelectTrigger id="jabatan">
                  <SelectValue placeholder="Pilih jabatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Asisten Ahli">Asisten Ahli</SelectItem>
                  <SelectItem value="Lektor">Lektor</SelectItem>
                  <SelectItem value="Lektor Kepala">Lektor Kepala</SelectItem>
                  <SelectItem value="Guru Besar">Guru Besar</SelectItem>
                  <SelectItem value="Tenaga Pengajar">Tenaga Pengajar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@univ.ac.id"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="telepon">Telepon</Label>
              <Input
                id="telepon"
                value={form.telepon}
                onChange={(e) => setForm((f) => ({ ...f, telepon: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prodi">Program Studi</Label>
            <Input
              id="prodi"
              placeholder="Teknik Informatika"
              value={form.prodi}
              onChange={(e) => setForm((f) => ({ ...f, prodi: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !form.nama || !form.prodi}>
            {mut.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
