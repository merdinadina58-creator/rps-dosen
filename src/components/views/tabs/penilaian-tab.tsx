'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'

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
import { api, type RpsDetail, type KomponenPenilaian } from '@/lib/api'

interface Props {
  rps: RpsDetail
}

export function PenilaianTab({ rps }: Props) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<KomponenPenilaian | null>(null)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<KomponenPenilaian | null>(null)

  const totalBobot = rps.penilaian.reduce((s, p) => s + p.bobot, 0)
  const isValid = totalBobot === 100

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deletePenilaian(id),
    onSuccess: () => {
      toast.success('Komponen penilaian dihapus')
      queryClient.invalidateQueries({ queryKey: ['rps', rps.id] })
      setDeleting(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">Komponen Penilaian</CardTitle>
            <CardDescription>
              Total bobot harus 100%. Saat ini: {rps.penilaian.length} komponen.
            </CardDescription>
          </div>
          <Button onClick={() => setAdding(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="size-4 mr-2" /> Tambah Komponen
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="rounded-lg border p-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium flex items-center gap-2">
                Total Bobot
                {isValid ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <AlertTriangle className="size-4 text-amber-500" />
                )}
              </span>
              <span
                className={`font-bold ${isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}
              >
                {totalBobot}%
              </span>
            </div>
            <Progress value={totalBobot} className={isValid ? '[&>div]:bg-emerald-500' : '[&>div]:bg-amber-500'} />
            {!isValid && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                {100 - totalBobot > 0
                  ? `Kurang ${100 - totalBobot}% lagi.`
                  : `Lebih ${totalBobot - 100}%. Silakan kurangi.`}
              </p>
            )}
          </div>

          {rps.penilaian.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Belum ada komponen penilaian. Tambahkan komponen seperti Tugas, UTS, UAS, Kehadiran, dll.
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Nama Komponen</TableHead>
                    <TableHead>Bentuk</TableHead>
                    <TableHead className="w-20">Bobot</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="w-20 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rps.penilaian.map((p, i) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{p.nama}</TableCell>
                      <TableCell className="text-sm">
                        {p.bentuk ? <Badge variant="secondary" className="text-[10px]">{p.bentuk}</Badge> : '-'}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium">{p.bobot}%</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.keterangan || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => setEditing(p)}
                            aria-label="Edit"
                          >
                            <Pencil className="size-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleting(p)}
                            aria-label="Hapus"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/40 font-medium">
                    <TableCell colSpan={3} className="text-right">TOTAL</TableCell>
                    <TableCell className="text-center">{totalBobot}%</TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PenilaianFormDialog
        key={editing?.id ?? (adding ? 'new' : 'closed')}
        open={!!editing || adding}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null)
            setAdding(false)
          }
        }}
        rpsId={rps.id}
        penilaian={editing}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Komponen?</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus <strong>{deleting?.nama}</strong> ({deleting?.bobot}%)? Tindakan ini tidak dapat dibatalkan.
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

function PenilaianFormDialog({
  open,
  onOpenChange,
  rpsId,
  penilaian,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  rpsId: string
  penilaian: KomponenPenilaian | null
}) {
  const queryClient = useQueryClient()
  const isEdit = !!penilaian

  const [form, setForm] = useState({
    nama: penilaian?.nama ?? '',
    bobot: penilaian?.bobot ?? 0,
    bentuk: penilaian?.bentuk ?? '',
    keterangan: penilaian?.keterangan ?? '',
  })

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        bentuk: form.bentuk || null,
        keterangan: form.keterangan || null,
      }
      if (isEdit && penilaian) {
        return api.updatePenilaian(penilaian.id, payload)
      }
      return api.createPenilaian(rpsId, payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Komponen diperbarui' : 'Komponen dibuat')
      queryClient.invalidateQueries({ queryKey: ['rps', rpsId] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Komponen Penilaian' : 'Tambah Komponen Penilaian'}</DialogTitle>
          <DialogDescription>
            Contoh: Tugas, UTS, UAS, Kehadiran, Praktikum, Quis, Proyek.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="nama">Nama Komponen</Label>
            <Input
              id="nama"
              placeholder="Tugas Individu"
              value={form.nama}
              onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="bobot">Bobot (%)</Label>
              <Input
                id="bobot"
                type="number"
                min={0}
                max={100}
                value={form.bobot}
                onChange={(e) => setForm((f) => ({ ...f, bobot: Number(e.target.value) || 0 }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bentuk">Bentuk Penilaian</Label>
              <Input
                id="bentuk"
                placeholder="Tulisan / Lisan / Praktik"
                value={form.bentuk}
                onChange={(e) => setForm((f) => ({ ...f, bentuk: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ket">Keterangan</Label>
            <Textarea
              id="ket"
              rows={3}
              placeholder="Detail penilaian..."
              value={form.keterangan}
              onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !form.nama}>
            {mut.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
