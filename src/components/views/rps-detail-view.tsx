'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  FileText,
  Download,
  FileDown,
  Pencil,
  Trash2,
  Loader2,
  CalendarDays,
  Users,
  BookOpen,
  Sparkles,
  ChevronDown,
  CircleDot,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
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
import { StatusBadge, type RpsStatus } from '@/components/status-badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RpsFormDialog } from '@/components/rps-form-dialog'
import { IdentitasTab } from '@/components/views/tabs/identitas-tab'
import { CpmkTab } from '@/components/views/tabs/cpmk-tab'
import { PertemuanTab } from '@/components/views/tabs/pertemuan-tab'
import { PenilaianTab } from '@/components/views/tabs/penilaian-tab'
import { ReferensiTab } from '@/components/views/tabs/referensi-tab'
import { PreviewTab } from '@/components/views/tabs/preview-tab'
import { api, exportUrl } from '@/lib/api'
import { useAppStore } from '@/lib/store'

interface Props {
  rpsId: string
}

export function RpsDetailView({ rpsId }: Props) {
  const { setView } = useAppStore()
  const queryClient = useQueryClient()

  const [tab, setTab] = useState('identitas')
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [exporting, setExporting] = useState<'docx' | 'pdf' | null>(null)

  const { data: rps, isLoading, isError, error } = useQuery({
    queryKey: ['rps', rpsId],
    queryFn: () => api.getRps(rpsId),
    enabled: !!rpsId,
  })

  const deleteMut = useMutation({
    mutationFn: () => api.deleteRps(rpsId),
    onSuccess: () => {
      toast.success('RPS berhasil dihapus')
      queryClient.invalidateQueries({ queryKey: ['rps'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      setDeleteOpen(false)
      setView('rps-list')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // Quick status change mutation — updates RPS status to draft/final/revisi
  const statusMut = useMutation({
    mutationFn: (newStatus: RpsStatus) =>
      api.updateRps(rpsId, { status: newStatus }),
    onSuccess: (updated) => {
      toast.success(`Status RPS diubah ke: ${updated.status === 'final' ? 'Final' : updated.status === 'revisi' ? 'Revisi' : 'Draft'}`)
      queryClient.invalidateQueries({ queryKey: ['rps', rpsId] })
      queryClient.invalidateQueries({ queryKey: ['rps'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleExport = async (format: 'docx' | 'pdf') => {
    setExporting(format)
    try {
      const url = exportUrl(rpsId, format)
      const a = document.createElement('a')
      a.href = url
      a.download = ''
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      toast.success(`Mengekspor ${format.toUpperCase()}... mohon tunggu`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal export')
    } finally {
      setTimeout(() => setExporting(null), 3000)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (isError || !rps) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive font-medium">Gagal memuat RPS</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Terjadi kesalahan'}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => setView('rps-list')}>
            <ArrowLeft className="size-4 mr-2" /> Kembali ke Daftar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Breadcrumb className="mb-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => setView('dashboard')} className="cursor-pointer">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink onClick={() => setView('rps-list')} className="cursor-pointer">
                Daftar RPS
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="line-clamp-1 max-w-[300px]">{rps.judul}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </motion.div>

      {/* Header card */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start gap-3">
                <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <FileText className="size-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold tracking-tight">{rps.judul}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm">
                    {/* Quick status change dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="inline-flex items-center gap-1.5 rounded-full border-0 cursor-pointer transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1">
                          <StatusBadge status={rps.status} />
                          <ChevronDown className="size-3 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuLabel className="text-xs">Ubah Status RPS</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => statusMut.mutate('draft')}
                          disabled={statusMut.isPending || rps.status === 'draft'}
                          className="gap-2 cursor-pointer"
                        >
                          <CircleDot className="size-4 text-amber-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Draft</p>
                            <p className="text-xs text-muted-foreground">Masih dalam penyusunan</p>
                          </div>
                          {rps.status === 'draft' && <CheckCircle2 className="size-4 text-emerald-500" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => statusMut.mutate('final')}
                          disabled={statusMut.isPending || rps.status === 'final'}
                          className="gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="size-4 text-emerald-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Final</p>
                            <p className="text-xs text-muted-foreground">Siap digunakan</p>
                          </div>
                          {rps.status === 'final' && <CheckCircle2 className="size-4 text-emerald-500" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => statusMut.mutate('revisi')}
                          disabled={statusMut.isPending || rps.status === 'revisi'}
                          className="gap-2 cursor-pointer"
                        >
                          <AlertCircle className="size-4 text-rose-500" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Revisi</p>
                            <p className="text-xs text-muted-foreground">Perlu perbaikan</p>
                          </div>
                          {rps.status === 'revisi' && <CheckCircle2 className="size-4 text-emerald-500" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Badge variant="secondary" className="font-mono">
                      {rps.mataKuliah.kode}
                    </Badge>
                    <span className="text-muted-foreground">{rps.mataKuliah.nama}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-2">
                <span className="flex items-center gap-1">
                  <BookOpen className="size-3.5" /> {rps.mataKuliah.sks} SKS · Semester {rps.mataKuliah.semester}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" /> {rps.dosen.nama}
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="size-3.5" /> T.A. {rps.tahunAjaran} ({rps.semester})
                </span>
                {rps.kelas && <span className="font-mono">Kelas {rps.kelas}</span>}
                <Badge variant="outline" className="text-[10px]">{rps.kurikulum}</Badge>
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="outline" className="text-[10px]">
                  {rps.cpmk.length} CPMK
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {rps.pertemuan.length}/{rps.mingguPertemuan} Pertemuan
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {rps.referensi.length} Referensi
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {rps.penilaian.length} Komponen Nilai
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('docx')}
                disabled={exporting !== null}
              >
                {exporting === 'docx' ? (
                  <Loader2 className="size-4 mr-1 animate-spin" />
                ) : (
                  <Download className="size-4 mr-1" />
                )}
                DOCX
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={exporting !== null}
              >
                {exporting === 'pdf' ? (
                  <Loader2 className="size-4 mr-1 animate-spin" />
                ) : (
                  <FileDown className="size-4 mr-1" />
                )}
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4 mr-1" /> Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setView('rps-list')}>
                <ArrowLeft className="size-4 mr-1" /> Kembali
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto scrollbar-thin">
          <TabsList className="w-full max-w-max">
            <TabsTrigger value="identitas">Identitas</TabsTrigger>
            <TabsTrigger value="cpmk">
              CPMK
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {rps.cpmk.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pertemuan">
              Rencana Mingguan
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {rps.pertemuan.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="penilaian">
              Penilaian
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {rps.penilaian.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="referensi">
              Referensi
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {rps.referensi.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Sparkles className="size-3.5 mr-1" /> Preview
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="identitas" className="mt-4">
          <IdentitasTab rps={rps} />
        </TabsContent>
        <TabsContent value="cpmk" className="mt-4">
          <CpmkTab rps={rps} />
        </TabsContent>
        <TabsContent value="pertemuan" className="mt-4">
          <PertemuanTab rps={rps} />
        </TabsContent>
        <TabsContent value="penilaian" className="mt-4">
          <PenilaianTab rps={rps} />
        </TabsContent>
        <TabsContent value="referensi" className="mt-4">
          <ReferensiTab rps={rps} />
        </TabsContent>
        <TabsContent value="preview" className="mt-4">
          <PreviewTab rps={rps} />
        </TabsContent>
      </Tabs>

      <RpsFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        rps={{
          ...rps,
          mataKuliah: rps.mataKuliah,
          dosen: rps.dosen,
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus RPS?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{rps.judul}</strong>? Seluruh CPMK,
              pertemuan, referensi, dan komponen penilaian akan ikut terhapus. Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => deleteMut.mutate()}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? 'Menghapus...' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
