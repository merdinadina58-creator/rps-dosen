'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, type Rps } from '@/lib/api'

interface RpsFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** If provided, dialog is in edit mode */
  rps?: Rps | null
  onCreated?: (id: string) => void
}

export function RpsFormDialog({ open, onOpenChange, rps, onCreated }: RpsFormDialogProps) {
  // Use key to remount inner form whenever target rps changes - avoids useEffect set-state issues
  return (
    <RpsFormDialogInner
      key={rps?.id ?? 'new'}
      open={open}
      onOpenChange={onOpenChange}
      rps={rps}
      onCreated={onCreated}
    />
  )
}

function RpsFormDialogInner({
  open,
  onOpenChange,
  rps,
  onCreated,
}: RpsFormDialogProps) {
  const isEdit = !!rps
  const queryClient = useQueryClient()

  const { data: mataKuliahList = [] } = useQuery({
    queryKey: ['mata-kuliah'],
    queryFn: () => api.listMataKuliah(),
  })
  const { data: dosenList = [] } = useQuery({
    queryKey: ['dosen'],
    queryFn: api.listDosen,
  })

  const [mataKuliahId, setMataKuliahId] = useState(rps?.mataKuliahId ?? '')
  const [dosenId, setDosenId] = useState(rps?.dosenId ?? '')
  const [tahunAjaran, setTahunAjaran] = useState(rps?.tahunAjaran ?? '2024/2025')
  const [semester, setSemester] = useState(rps?.semester ?? 'Ganjil')
  const [kelas, setKelas] = useState(rps?.kelas ?? '')
  // For new RPS, derive judul from mata kuliah + semester + tahun (computed lazily)
  const [judulOverride, setJudulOverride] = useState<string | null>(
    rps ? rps.judul : null
  )

  // Derived judul
  const derivedJudul = (() => {
    if (judulOverride !== null) return judulOverride
    if (mataKuliahId && tahunAjaran && semester) {
      const mk = mataKuliahList.find((m) => m.id === mataKuliahId)
      if (mk) return `RPS ${mk.nama} - Semester ${semester} ${tahunAjaran}`
    }
    return ''
  })()

  const mutation = useMutation({
    mutationFn: async () => {
      if (!mataKuliahId || !dosenId) throw new Error('Mata kuliah dan dosen wajib diisi')
      const payload = {
        judul: derivedJudul.trim(),
        mataKuliahId,
        dosenId,
        tahunAjaran: tahunAjaran.trim(),
        semester,
        kelas: kelas.trim() || null,
      }
      if (isEdit && rps) {
        return api.updateRps(rps.id, payload)
      } else {
        return api.createRps(payload)
      }
    },
    onSuccess: (data) => {
      toast.success(isEdit ? 'RPS berhasil diperbarui' : 'RPS berhasil dibuat')
      queryClient.invalidateQueries({ queryKey: ['rps'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      onOpenChange(false)
      if (!isEdit && onCreated) onCreated(data.id)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleSubmit = () => mutation.mutate()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit RPS' : 'Buat RPS Baru'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Perbarui informasi dasar RPS.'
              : 'Lengkapi data untuk membuat dokumen RPS baru.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="mk">Mata Kuliah</Label>
            <Select value={mataKuliahId} onValueChange={setMataKuliahId}>
              <SelectTrigger id="mk">
                <SelectValue placeholder="Pilih mata kuliah" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {mataKuliahList.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="font-mono text-xs mr-2">{m.kode}</span>
                    {m.nama} ({m.sks} SKS)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dosen">Dosen Pengampu</Label>
            <Select value={dosenId} onValueChange={setDosenId}>
              <SelectTrigger id="dosen">
                <SelectValue placeholder="Pilih dosen" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {dosenList.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nama} <span className="text-muted-foreground">· {d.prodi}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ta">Tahun Ajaran</Label>
              <Input
                id="ta"
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                placeholder="2024/2025"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sem">Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger id="sem">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ganjil">Ganjil</SelectItem>
                  <SelectItem value="Genap">Genap</SelectItem>
                  <SelectItem value="Pendek">Pendek</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="kelas">Kelas</Label>
            <Input
              id="kelas"
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              placeholder="Contoh: TI-3A"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="judul">Judul RPS</Label>
            <Textarea
              id="judul"
              value={derivedJudul}
              onChange={(e) => setJudulOverride(e.target.value)}
              rows={2}
            />
            {!isEdit && (
              <p className="text-xs text-muted-foreground">
                Judul otomatis dibuat dari mata kuliah. Anda bisa edit manual.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Buat RPS'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
