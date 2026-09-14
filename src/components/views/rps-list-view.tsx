'use client'

import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  FileText,
  Plus,
  Search,
  Trash2,
  CalendarDays,
  Users,
  BookOpen,
  Pencil,
  Wand2,
} from 'lucide-react'
import { motion } from 'framer-motion'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { StatusBadge } from '@/components/status-badge'
import { RpsFormDialog } from '@/components/rps-form-dialog'
import { AutoGenerateRpsDialog } from '@/components/auto-generate-rps-dialog'
import { api, type Rps } from '@/lib/api'
import { useAppStore } from '@/lib/store'

export function RpsListView() {
  const { openRps } = useAppStore()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dosenFilter, setDosenFilter] = useState<string>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [autoGenOpen, setAutoGenOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Rps | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Rps | null>(null)

  const { data: rpsList = [], isLoading } = useQuery({
    queryKey: ['rps', 'list'],
    queryFn: () => api.listRps(),
  })
  const { data: dosenList = [] } = useQuery({
    queryKey: ['dosen'],
    queryFn: api.listDosen,
  })

  const filtered = useMemo(() => {
    return rpsList.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (dosenFilter !== 'all' && r.dosenId !== dosenFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const inJudul = r.judul.toLowerCase().includes(q)
        const inMk = r.mataKuliah.nama.toLowerCase().includes(q) || r.mataKuliah.kode.toLowerCase().includes(q)
        const inDosen = r.dosen.nama.toLowerCase().includes(q)
        if (!inJudul && !inMk && !inDosen) return false
      }
      return true
    })
  }, [rpsList, search, statusFilter, dosenFilter])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteRps(id),
    onSuccess: () => {
      toast.success('RPS berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: ['rps'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      setDeleteTarget(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daftar RPS</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola seluruh dokumen Rencana Pembelajaran Semester
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setAutoGenOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm"
          >
            <Wand2 className="size-4 mr-2" /> Generate RPS dengan AI
          </Button>
          <Button
            onClick={() => {
              setEditTarget(null)
              setCreateOpen(true)
            }}
            variant="outline"
          >
            <Plus className="size-4 mr-2" /> Buat Manual
          </Button>
        </div>
      </motion.div>

      {/* Highlight banner for AI feature */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 p-4"
      >
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
            <Wand2 className="size-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">
              Baru! Generate RPS lengkap otomatis dengan AI
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cukup pilih mata kuliah, AI akan menyusun deskripsi, CPL, CPMK, 16 pertemuan, penilaian, dan referensi dalam sekali klik — bukan lagi input manual seperti di Word.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setAutoGenOpen(true)}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shrink-0"
          >
            Coba Sekarang
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari judul, mata kuliah, atau dosen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="final">Final</SelectItem>
              <SelectItem value="revisi">Revisi</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dosenFilter} onValueChange={setDosenFilter}>
            <SelectTrigger className="w-full md:w-56">
              <SelectValue placeholder="Dosen" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all">Semua Dosen</SelectItem>
              {dosenList.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="size-10 mx-auto text-muted-foreground/50" />
            <p className="mt-3 font-medium">Belum ada RPS</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Buat RPS pertama Anda secara manual, atau biarkan AI menyusunnya lengkap otomatis untuk Anda.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
              <Button
                onClick={() => setAutoGenOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                <Wand2 className="size-4 mr-2" /> Generate dengan AI
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditTarget(null)
                  setCreateOpen(true)
                }}
              >
                <Plus className="size-4 mr-2" /> Buat Manual
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((rps, idx) => (
            <motion.div
              key={rps.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
            >
              <Card
                className="group hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full"
                onClick={() => openRps(rps.id)}
              >
                <CardContent className="p-5 flex flex-col gap-3 h-full">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm leading-tight line-clamp-2">{rps.judul}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {rps.mataKuliah.kode}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{rps.mataKuliah.sks} SKS</span>
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={rps.status} />
                  </div>

                  <div className="text-sm text-muted-foreground line-clamp-1">
                    <BookOpen className="size-3.5 inline mr-1" />
                    {rps.mataKuliah.nama}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-auto pt-2 border-t">
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" /> {rps.dosen.nama}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="size-3.5" /> {rps.tahunAjaran} {rps.semester}
                    </span>
                    {rps.kelas && <span className="font-mono">Kelas {rps.kelas}</span>}
                  </div>

                  <div className="flex gap-2 mt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditTarget(rps)
                        setCreateOpen(true)
                      }}
                    >
                      <Pencil className="size-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(rps)
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <RpsFormDialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o)
          if (!o) setEditTarget(null)
        }}
        rps={editTarget}
        onCreated={(id) => {
          openRps(id)
        }}
      />

      <AutoGenerateRpsDialog
        open={autoGenOpen}
        onOpenChange={setAutoGenOpen}
        onCreated={(id) => openRps(id)}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus RPS?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus RPS <strong>{deleteTarget?.judul}</strong>?
              Tindakan ini tidak dapat dibatalkan dan akan menghapus seluruh CPMK, pertemuan,
              referensi, serta komponen penilaian terkait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
