'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Copy, Loader2 } from 'lucide-react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, type Rps } from '@/lib/api'

interface CloneRpsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rps: Rps
  onCloned?: (newId: string) => void
}

export function CloneRpsDialog({ open, onOpenChange, rps, onCloned }: CloneRpsDialogProps) {
  const queryClient = useQueryClient()

  // Pre-fill with current values; user adjusts for new semester
  const [tahunAjaran, setTahunAjaran] = useState(rps.tahunAjaran)
  const [semester, setSemester] = useState(rps.semester)
  const [kelas, setKelas] = useState(rps.kelas ?? '')
  const [judulOverride, setJudulOverride] = useState('')

  // Derived judul (auto-generated if user doesn't override)
  const derivedJudul = (() => {
    if (judulOverride.trim()) return judulOverride.trim()
    return `RPS ${rps.mataKuliah.nama} - Semester ${semester} ${tahunAjaran}`
  })()

  const cloneMut = useMutation({
    mutationFn: () =>
      api.cloneRps(rps.id, {
        tahunAjaran: tahunAjaran.trim(),
        semester,
        kelas: kelas.trim() || null,
        judul: derivedJudul,
      }),
    onSuccess: (newRps) => {
      toast.success(`RPS berhasil di-clone ke: ${newRps.tahunAjaran} ${newRps.semester}`)
      queryClient.invalidateQueries({ queryKey: ['rps'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      onOpenChange(false)
      // Reset fields
      setJudulOverride('')
      if (onCloned) onCloned(newRps.id)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleSubmit = () => {
    if (!tahunAjaran.trim()) {
      toast.error('Tahun ajaran wajib diisi')
      return
    }
    cloneMut.mutate()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="size-5 text-primary" />
            Clone RPS ke Semester Baru
          </DialogTitle>
          <DialogDescription>
            Salin RPS ini beserta seluruh isi (CPMK, 16 pertemuan, penilaian, referensi)
            ke RPS baru untuk semester berikutnya. Status RPS baru: <strong>Draft</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Summary of what will be copied */}
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs space-y-1">
          <p className="font-medium text-primary">Yang akan disalin:</p>
          <div className="flex flex-wrap gap-2">
            {rps._count && (
              <>
                <span className="px-2 py-0.5 rounded bg-primary/10">{rps._count.cpmk} CPMK</span>
                <span className="px-2 py-0.5 rounded bg-primary/10">{rps._count.pertemuan} Pertemuan</span>
                <span className="px-2 py-0.5 rounded bg-primary/10">{rps._count.penilaian} Penilaian</span>
                <span className="px-2 py-0.5 rounded bg-primary/10">{rps._count.referensi} Referensi</span>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="clone-ta">Tahun Ajaran</Label>
              <Input
                id="clone-ta"
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                placeholder="2025/2026"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="clone-sem">Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger id="clone-sem">
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

          <div className="grid gap-1.5">
            <Label htmlFor="clone-kelas">Kelas (opsional)</Label>
            <Input
              id="clone-kelas"
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              placeholder="Contoh: TI-3B"
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="clone-judul">Judul RPS Baru</Label>
            <Input
              id="clone-judul"
              value={judulOverride || derivedJudul}
              onChange={(e) => setJudulOverride(e.target.value)}
              placeholder={derivedJudul}
            />
            <p className="text-xs text-muted-foreground">
              Otomatis dibuat dari nama mata kuliah + semester + tahun. Bisa edit manual.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={cloneMut.isPending}>
            {cloneMut.isPending ? (
              <><Loader2 className="size-4 mr-2 animate-spin" /> Menyalin...</>
            ) : (
              <><Copy className="size-4 mr-2" /> Clone RPS</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
