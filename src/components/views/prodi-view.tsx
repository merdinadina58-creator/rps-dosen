'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GraduationCap, FileText, Users, BookOpen, Scale } from 'lucide-react'
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { motion } from 'framer-motion'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/status-badge'
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
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'

const PRODI_COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#f43f5e', '#14b8a6']

export function ProdiView() {
  const { openRps } = useAppStore()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
  })

  const { data: rpsList = [], isLoading: rpsLoading } = useQuery({
    queryKey: ['rps', 'list'],
    queryFn: () => api.listRps(),
  })

  const { data: dosenList = [] } = useQuery({
    queryKey: ['dosen'],
    queryFn: api.listDosen,
  })

  const { data: mkList = [] } = useQuery({
    queryKey: ['mata-kuliah'],
    queryFn: () => api.listMataKuliah(),
  })

  const allProdi = useMemo(() => {
    return stats?.prodiStats.map((p) => p.prodi) ?? []
  }, [stats])

  const [selectedProdi, setSelectedProdi] = useState<string>('all')

  const filteredRps = useMemo(() => {
    return rpsList.filter((r) => selectedProdi === 'all' || r.mataKuliah.prodi === selectedProdi)
  }, [rpsList, selectedProdi])

  const filteredDosen = useMemo(() => {
    return dosenList.filter((d) => selectedProdi === 'all' || d.prodi === selectedProdi)
  }, [dosenList, selectedProdi])

  const filteredMk = useMemo(() => {
    return mkList.filter((m) => selectedProdi === 'all' || m.prodi === selectedProdi)
  }, [mkList, selectedProdi])

  const totalSks = useMemo(
    () => filteredMk.reduce((s, m) => s + m.sks, 0),
    [filteredMk]
  )

  // RPS per mata kuliah
  const rpsPerMk = useMemo(() => {
    const map = new Map<string, { nama: string; kode: string; count: number }>()
    for (const r of filteredRps) {
      const key = r.mataKuliah.kode
      const existing = map.get(key)
      if (existing) existing.count++
      else map.set(key, { nama: r.mataKuliah.nama, kode: r.mataKuliah.kode, count: 1 })
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [filteredRps])

  const cards = [
    {
      title: 'Total RPS',
      value: filteredRps.length,
      icon: FileText,
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    },
    {
      title: 'Total Dosen',
      value: filteredDosen.length,
      icon: Users,
      color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    },
    {
      title: 'Mata Kuliah',
      value: filteredMk.length,
      icon: BookOpen,
      color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    },
    {
      title: 'Total SKS',
      value: totalSks,
      icon: Scale,
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    },
  ]

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="size-6 text-primary" />
            Program Studi
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ringkasan agregat per program studi
          </p>
        </div>
        <Select value={selectedProdi} onValueChange={setSelectedProdi}>
          <SelectTrigger className="w-full md:w-72">
            <SelectValue placeholder="Pilih prodi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Prodi</SelectItem>
            {allProdi.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">{c.title}</p>
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16 mt-2" />
                    ) : (
                      <p className="text-3xl font-bold mt-2">{c.value}</p>
                    )}
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

      {/* Charts + Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">RPS per Mata Kuliah</CardTitle>
            <CardDescription>
              {selectedProdi === 'all' ? 'Seluruh prodi' : selectedProdi}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rpsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : rpsPerMk.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10 text-center">Belum ada data.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(260, rpsPerMk.length * 36)}>
                <BarChart
                  data={rpsPerMk}
                  layout="vertical"
                  margin={{ left: 20, right: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="kode"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value} RPS`, 'Jumlah']}
                  />
                  <Bar dataKey="count" name="Jumlah RPS" radius={[0, 6, 6, 0]}>
                    {rpsPerMk.map((_, i) => (
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
            <CardTitle className="text-base">Dosen di Prodi Ini</CardTitle>
            <CardDescription>{filteredDosen.length} dosen</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto scrollbar-thin">
              {filteredDosen.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">Belum ada dosen.</p>
              ) : (
                <ul className="divide-y">
                  {filteredDosen.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 p-3">
                      <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                        {d.nama
                          .split(' ')
                          .slice(0, 2)
                          .map((w) => w[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{d.nama}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.jabatan || '-'} · {d.prodi}
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {d._count?.rps ?? 0} RPS
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RPS Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daftar RPS</CardTitle>
          <CardDescription>
            {filteredRps.length} RPS {selectedProdi === 'all' ? 'seluruh prodi' : `di ${selectedProdi}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {rpsLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredRps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Belum ada RPS.</p>
          ) : (
            <div className="max-h-[60vh] overflow-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-muted z-10">
                  <TableRow>
                    <TableHead>Judul RPS</TableHead>
                    <TableHead>Mata Kuliah</TableHead>
                    <TableHead>Dosen</TableHead>
                    <TableHead>T.A.</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRps.map((r) => (
                    <TableRow
                      key={r.id}
                      className="cursor-pointer hover:bg-accent/40"
                      onClick={() => openRps(r.id)}
                    >
                      <TableCell className="font-medium text-sm max-w-xs truncate">
                        {r.judul}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-mono text-[10px]">
                            {r.mataKuliah.kode}
                          </Badge>
                          <span className="text-sm">{r.mataKuliah.nama}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{r.dosen.nama}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.tahunAjaran} {r.semester}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={r.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
