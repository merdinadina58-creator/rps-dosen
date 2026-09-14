'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts'
import {
  FileText,
  CheckCircle2,
  FileEdit,
  Users,
  BookOpen,
  Sparkles,
  ArrowRight,
  CalendarDays,
  Wand2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/status-badge'
import { AutoGenerateRpsDialog } from '@/components/auto-generate-rps-dialog'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { motion } from 'framer-motion'
import { useState } from 'react'

const STATUS_COLORS: Record<string, string> = {
  draft: '#f59e0b',
  final: '#10b981',
  revisi: '#f43f5e',
}

const PRODI_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#f43f5e', '#14b8a6']

export function DashboardView() {
  const { setView, openRps } = useAppStore()
  const [autoGenOpen, setAutoGenOpen] = useState(false)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
  })

  const { data: rpsList, isLoading: rpsLoading } = useQuery({
    queryKey: ['rps', 'recent'],
    queryFn: () => api.listRps(),
  })

  const recentRps = (rpsList ?? []).slice(0, 5)

  const totalRps = stats?.totals.rps ?? 0
  const finalCount = stats?.rpsByStatus.find((s) => s.status === 'final')?.count ?? 0
  const draftCount = stats?.rpsByStatus.find((s) => s.status === 'draft')?.count ?? 0

  const cards = [
    {
      title: 'Total RPS',
      value: totalRps,
      icon: FileText,
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
      sub: 'seluruh dokumen RPS',
    },
    {
      title: 'RPS Final',
      value: finalCount,
      icon: CheckCircle2,
      color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
      sub: 'siap digunakan',
    },
    {
      title: 'RPS Draft',
      value: draftCount,
      icon: FileEdit,
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      sub: 'perlu penyelesaian',
    },
    {
      title: 'Total Dosen',
      value: stats?.totals.dosen ?? 0,
      icon: Users,
      color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
      sub: 'dosen pengampu',
    },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ringkasan sistem manajemen Rencana Pembelajaran Semester
        </p>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, idx) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{c.title}</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16 mt-2" />
                    ) : (
                      <p className="text-3xl font-bold mt-2">{c.value}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${c.color}`}>
                    <c.icon className="size-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Hero banner - Generate AI */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-lg"
      >
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <div className="flex items-start gap-4">
            <div className="size-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
              <Wand2 className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Generate RPS Lengkap Otomatis dengan AI</h2>
              <p className="text-sm text-white/90 mt-1 max-w-xl">
                Pilih mata kuliah, lalu AI menyusun seluruh RPS untuk Anda — deskripsi, CPL, CPMK, Sub-CPMK, 16 pertemuan mingguan, komponen penilaian, hingga referensi. Selesai dalam sekali klik, bukan input manual.
              </p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={() => setAutoGenOpen(true)}
            className="bg-white text-emerald-700 hover:bg-white/90 shrink-0 font-semibold"
          >
            <Wand2 className="size-4 mr-2" /> Mulai Generate
          </Button>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setView('rps-list')} className="bg-primary hover:bg-primary/90">
          <FileText className="size-4 mr-2" /> Lihat Daftar RPS
        </Button>
        <Button variant="outline" onClick={() => setView('ai-assistant')}>
          <Sparkles className="size-4 mr-2" /> Buka AI Assistant
        </Button>
        <Button variant="outline" onClick={() => setView('prodi')}>
          <BookOpen className="size-4 mr-2" /> Lihat Prodi
        </Button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">RPS per Program Studi</CardTitle>
            <CardDescription>Distribusi dokumen RPS di setiap prodi</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats?.rpsByProdi ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="prodi"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tick={{ fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="count" name="Jumlah RPS" radius={[6, 6, 0, 0]}>
                    {(stats?.rpsByProdi ?? []).map((_, i) => (
                      <Cell key={i} fill={PRODI_COLORS[i % PRODI_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">RPS berdasarkan Status</CardTitle>
            <CardDescription>Status dokumen RPS</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={stats?.rpsByStatus ?? []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                  >
                    {(stats?.rpsByStatus ?? []).map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent RPS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">RPS Terbaru</CardTitle>
            <CardDescription>5 RPS yang terakhir dibuat atau diperbarui</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setView('rps-list')}>
            Lihat semua <ArrowRight className="size-3.5 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {rpsLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentRps.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Belum ada RPS. Buat RPS pertama Anda sekarang.
            </div>
          ) : (
            <ul className="divide-y border-t">
              {recentRps.map((rps) => (
                <li
                  key={rps.id}
                  className="flex items-center gap-3 p-3 hover:bg-accent/40 transition-colors cursor-pointer"
                  onClick={() => openRps(rps.id)}
                >
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{rps.judul}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="font-mono">{rps.mataKuliah.kode}</Badge>
                      <span className="truncate">{rps.mataKuliah.nama}</span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" /> {rps.tahunAjaran} {rps.semester}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={rps.status} />
                  <ArrowRight className="size-4 text-muted-foreground shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AutoGenerateRpsDialog
        open={autoGenOpen}
        onOpenChange={setAutoGenOpen}
        onCreated={(id) => openRps(id)}
      />
    </div>
  )
}
