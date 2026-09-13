'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Sparkles,
  Wand2,
  Loader2,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Target,
  CalendarDays,
  ClipboardList,
  Library,
  Save,
  RotateCcw,
  AlertCircle,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { api, type FullRpsGenerated, type MataKuliah } from '@/lib/api'

interface AutoGenerateRpsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (id: string) => void
}

type Step = 'input' | 'generating' | 'preview'

const GENERATING_STEPS = [
  { label: 'Menganalisis informasi mata kuliah', icon: BookOpen },
  { label: 'Menyusun deskripsi, CPL & komponen penilaian', icon: ClipboardList },
  { label: 'Merancang CPMK & Sub-CPMK', icon: Target },
  { label: 'Menyusun rencana 16 pertemuan mingguan', icon: CalendarDays },
  { label: 'Mengumpulkan referensi bahan pustaka', icon: Library },
  { label: 'Menyusun dokumen RPS final', icon: CheckCircle2 },
]

export function AutoGenerateRpsDialog({ open, onOpenChange, onCreated }: AutoGenerateRpsDialogProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>('input')

  // Form state
  const [mode, setMode] = useState<'existing' | 'custom'>('existing')
  const [mataKuliahId, setMataKuliahId] = useState('')
  const [dosenId, setDosenId] = useState('')
  const [tahunAjaran, setTahunAjaran] = useState('2024/2025')
  const [semester, setSemester] = useState('Ganjil')
  const [kelas, setKelas] = useState('')
  const [jumlahCpmk, setJumlahCpmk] = useState('4')

  // Custom mata kuliah input
  const [customNama, setCustomNama] = useState('')
  const [customKode, setCustomKode] = useState('')
  const [customSks, setCustomSks] = useState('3')
  const [customProdi, setCustomProdi] = useState('Teknik Informatika')
  const [customSemester, setCustomSemester] = useState('3')
  const [customDeskripsi, setCustomDeskripsi] = useState('')

  // Progress animation state
  const [progressIdx, setProgressIdx] = useState(0)

  // Generated result
  const [generated, setGenerated] = useState<FullRpsGenerated | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Collapsible sections in preview
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['deskripsi', 'cpmk'])
  )

  const { data: mataKuliahList = [] } = useQuery({
    queryKey: ['mata-kuliah'],
    queryFn: () => api.listMataKuliah(),
  })
  const { data: dosenList = [] } = useQuery({
    queryKey: ['dosen'],
    queryFn: api.listDosen,
  })

  const selectedMk: MataKuliah | undefined = mataKuliahList.find((m) => m.id === mataKuliahId)

  const generateMutation = useMutation({
    mutationFn: async () => {
      // Build input based on mode
      let input: Parameters<typeof api.generateFullRps>[0]
      if (mode === 'existing') {
        if (!selectedMk) throw new Error('Pilih mata kuliah terlebih dahulu')
        input = {
          namaMataKuliah: selectedMk.nama,
          kodeMataKuliah: selectedMk.kode,
          deskripsiMataKuliah: selectedMk.deskripsi || `${selectedMk.nama} (${selectedMk.sks} SKS) - Semester ${selectedMk.semester}, Prodi ${selectedMk.prodi}`,
          sks: selectedMk.sks,
          prodi: selectedMk.prodi,
          semester: selectedMk.semester,
          prasyarat: selectedMk.prasyarat || undefined,
          jumlahCpmk: Number(jumlahCpmk) || 4,
          jumlahPertemuan: 16,
        }
      } else {
        if (!customNama.trim() || !customDeskripsi.trim()) {
          throw new Error('Nama mata kuliah dan deskripsi wajib diisi untuk mode kustom')
        }
        input = {
          namaMataKuliah: customNama.trim(),
          kodeMataKuliah: customKode.trim() || undefined,
          deskripsiMataKuliah: customDeskripsi.trim(),
          sks: Number(customSks) || 3,
          prodi: customProdi.trim() || 'Teknik Informatika',
          semester: Number(customSemester) || 3,
          jumlahCpmk: Number(jumlahCpmk) || 4,
          jumlahPertemuan: 16,
        }
      }
      return api.generateFullRps(input)
    },
    onMutate: () => {
      setError(null)
      setGenerated(null)
      setProgressIdx(0)
      setStep('generating')
      // Animate progress steps while waiting (chained calls take ~30-45s total)
      const interval = setInterval(() => {
        setProgressIdx((prev) => (prev < GENERATING_STEPS.length - 2 ? prev + 1 : prev))
      }, 6000)
      // Store interval to clear later
      ;(generateMutation as unknown as { _interval?: number })._interval = interval
    },
    onSuccess: (data) => {
      const interval = (generateMutation as unknown as { _interval?: number })._interval
      if (interval) clearInterval(interval)
      setProgressIdx(GENERATING_STEPS.length - 1)
      setGenerated(data)
      // Small delay for final step animation
      setTimeout(() => setStep('preview'), 600)
      toast.success('RPS berhasil dibuat oleh AI!')
    },
    onError: (e: Error) => {
      const interval = (generateMutation as unknown as { _interval?: number })._interval
      if (interval) clearInterval(interval)
      setError(e.message)
      setStep('input')
      toast.error(e.message)
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!generated) throw new Error('Belum ada hasil generate')
      if (!dosenId) throw new Error('Pilih dosen pengampu')

      // Determine mata kuliah id
      let mkId = mataKuliahId
      if (mode === 'custom') {
        // Create mata kuliah first if custom mode
        const newMk = await api.createMataKuliah({
          kode: customKode.trim() || `MK-${Date.now().toString().slice(-6)}`,
          nama: customNama.trim(),
          sks: Number(customSks) || 3,
          semester: Number(customSemester) || 3,
          prodi: customProdi.trim() || 'Teknik Informatika',
          deskripsi: customDeskripsi.trim(),
        })
        mkId = newMk.id
      }
      if (!mkId) throw new Error('Mata kuliah belum dipilih')

      // Build judul
      const mkName = mode === 'existing' ? selectedMk?.nama : customNama.trim()
      const judul = `RPS ${mkName} - Semester ${semester} ${tahunAjaran}`

      return api.createFullRps({
        mataKuliahId: mkId,
        dosenId,
        tahunAjaran: tahunAjaran.trim(),
        semester,
        kelas: kelas.trim() || null,
        judul,
        generated,
      })
    },
    onSuccess: (rps) => {
      toast.success('RPS lengkap berhasil disimpan!')
      queryClient.invalidateQueries({ queryKey: ['rps'] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
      queryClient.invalidateQueries({ queryKey: ['mata-kuliah'] })
      handleClose()
      onCreated?.(rps.id)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  function handleClose() {
    setStep('input')
    setGenerated(null)
    setError(null)
    setProgressIdx(0)
    onOpenChange(false)
  }

  function toggleSection(key: string) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const totalBobotPenilaian = generated?.penilaian.reduce((s, p) => s + p.bobot, 0) ?? 0
  const totalBobotPertemuan = generated?.pertemuan.reduce((s, p) => s + p.bobotPenilaian, 0) ?? 0

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[720px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Wand2 className="size-4" />
            </span>
            Generate RPS Otomatis dengan AI
          </DialogTitle>
          <DialogDescription>
            AI akan menyusun RPS lengkap (deskripsi, CPL, CPMK, 16 pertemuan, penilaian, referensi) dalam sekali klik.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* ===== STEP 1: INPUT ===== */}
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-y-auto pr-1"
            >
              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setMode('existing')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    mode === 'existing'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <BookOpen className="size-4 mb-1 text-primary" />
                  <p className="text-sm font-medium">Pilih Mata Kuliah</p>
                  <p className="text-xs text-muted-foreground">Dari daftar yang sudah ada</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    mode === 'custom'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <Sparkles className="size-4 mb-1 text-primary" />
                  <p className="text-sm font-medium">Input Kustom</p>
                  <p className="text-xs text-muted-foreground">Isi info mata kuliah baru</p>
                </button>
              </div>

              {mode === 'existing' ? (
                <div className="space-y-3">
                  <div className="grid gap-1.5">
                    <Label>Mata Kuliah</Label>
                    <Select value={mataKuliahId} onValueChange={setMataKuliahId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih mata kuliah" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {mataKuliahList.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <span className="font-mono text-xs mr-2">{m.kode}</span>
                            {m.nama} ({m.sks} SKS)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedMk && (
                    <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                      <p><span className="text-muted-foreground">Prodi:</span> {selectedMk.prodi}</p>
                      <p><span className="text-muted-foreground">Semester:</span> {selectedMk.semester}</p>
                      {selectedMk.deskripsi && (
                        <p className="text-muted-foreground line-clamp-2">{selectedMk.deskripsi}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1.5 col-span-2">
                      <Label htmlFor="cnama">Nama Mata Kuliah</Label>
                      <Input id="cnama" value={customNama} onChange={(e) => setCustomNama(e.target.value)} placeholder="Contoh: Algoritma & Pemrograman" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="ckode">Kode</Label>
                      <Input id="ckode" value={customKode} onChange={(e) => setCustomKode(e.target.value)} placeholder="IF-101" />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="csks">SKS</Label>
                      <Input id="csks" type="number" min={1} max={8} value={customSks} onChange={(e) => setCustomSks(e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="cprodi">Program Studi</Label>
                      <Input id="cprodi" value={customProdi} onChange={(e) => setCustomProdi(e.target.value)} />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="csem">Semester</Label>
                      <Input id="csem" type="number" min={1} max={14} value={customSemester} onChange={(e) => setCustomSemester(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="cdesc">Deskripsi Mata Kuliah</Label>
                    <Textarea
                      id="cdesc"
                      value={customDeskripsi}
                      onChange={(e) => setCustomDeskripsi(e.target.value)}
                      rows={3}
                      placeholder="Jelaskan singkat tentang mata kuliah ini, apa yang akan dipelajari mahasiswa..."
                    />
                  </div>
                </div>
              )}

              <div className="h-px bg-border my-4" />

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="adosen">Dosen Pengampu</Label>
                  <Select value={dosenId} onValueChange={setDosenId}>
                    <SelectTrigger id="adosen">
                      <SelectValue placeholder="Pilih dosen" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {dosenList.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="acpmk">Jumlah CPMK</Label>
                  <Select value={jumlahCpmk} onValueChange={setJumlahCpmk}>
                    <SelectTrigger id="acpmk">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 4, 5, 6].map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} CPMK</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="ata">Tahun Ajaran</Label>
                  <Input id="ata" value={tahunAjaran} onChange={(e) => setTahunAjaran(e.target.value)} placeholder="2024/2025" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="asem">Semester</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger id="asem"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ganjil">Ganjil</SelectItem>
                      <SelectItem value="Genap">Genap</SelectItem>
                      <SelectItem value="Pendek">Pendek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5 col-span-2">
                  <Label htmlFor="akelas">Kelas (opsional)</Label>
                  <Input id="akelas" value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="Contoh: TI-3A" />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== STEP 2: GENERATING ===== */}
          {step === 'generating' && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-12 gap-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  className="size-20 rounded-full border-4 border-primary/20 border-t-primary"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="size-8 text-primary" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">AI sedang menyusun RPS Anda...</p>
                <p className="text-sm text-muted-foreground mt-1">Mohon tunggu, ini biasanya 15-30 detik</p>
              </div>
              <div className="w-full max-w-md space-y-2">
                {GENERATING_STEPS.map((s, i) => {
                  const Icon = s.icon
                  const isDone = i < progressIdx
                  const isActive = i === progressIdx
                  return (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: isDone || isActive ? 1 : 0.3 }}
                      className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                        isDone ? 'bg-emerald-500/10' : isActive ? 'bg-primary/10' : ''
                      }`}
                    >
                      <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                        isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}>
                        {isDone ? <CheckCircle2 className="size-4" /> : <Icon className="size-4" />}
                      </div>
                      <span className={`text-sm ${isDone || isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                        {s.label}
                      </span>
                      {isActive && <Loader2 className="size-3.5 animate-spin ml-auto" />}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ===== STEP 3: PREVIEW ===== */}
          {step === 'preview' && generated && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 overflow-hidden flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">RPS berhasil dibuat AI!</p>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                    {generated.cpmk.length} CPMK · {generated.pertemuan.length} pertemuan · {generated.penilaian.length} komponen penilaian · {generated.referensi.length} referensi
                  </p>
                </div>
              </div>

              <ScrollArea className="flex-1 max-h-[55vh] pr-3">
                <div className="space-y-2">
                  {/* Deskripsi & CPL */}
                  <Collapsible open={openSections.has('deskripsi')} onOpenChange={() => toggleSection('deskripsi')}>
                    <PreviewSection title="Deskripsi & CPL" icon={Target} count={undefined}>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="font-medium text-xs text-muted-foreground uppercase mb-1">Deskripsi Mata Kuliah</p>
                          <p className="leading-relaxed">{generated.deskripsi}</p>
                        </div>
                        <div>
                          <p className="font-medium text-xs text-muted-foreground uppercase mb-1">Capaian Pembelajaran Lulusan (CPL)</p>
                          <p className="leading-relaxed">{generated.cpl}</p>
                        </div>
                      </div>
                    </PreviewSection>
                  </Collapsible>

                  {/* CPMK */}
                  <Collapsible open={openSections.has('cpmk')} onOpenChange={() => toggleSection('cpmk')}>
                    <PreviewSection title="CPMK & Sub-CPMK" icon={Target} count={generated.cpmk.length}>
                      <div className="space-y-3">
                        {generated.cpmk.map((c) => (
                          <div key={c.kode} className="border-l-2 border-primary/40 pl-3">
                            <p className="text-sm font-medium">
                              <Badge variant="secondary" className="mr-2 font-mono">{c.kode}</Badge>
                              {c.deskripsi}
                            </p>
                            <ul className="mt-1.5 ml-1 space-y-1">
                              {c.subCpmk.map((s) => (
                                <li key={s.kode} className="text-xs text-muted-foreground flex gap-2">
                                  <span className="font-mono shrink-0">{s.kode}</span>
                                  <span>{s.deskripsi}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </PreviewSection>
                  </Collapsible>

                  {/* Pertemuan */}
                  <Collapsible open={openSections.has('pertemuan')} onOpenChange={() => toggleSection('pertemuan')}>
                    <PreviewSection title="Rencana Pertemuan Mingguan" icon={CalendarDays} count={generated.pertemuan.length}>
                      <div className="space-y-2">
                        <div className={`text-xs font-medium ${totalBobotPertemuan === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          Total bobot penilaian: {totalBobotPertemuan}% {totalBobotPertemuan !== 100 && '(sebaiknya 100%)'}
                        </div>
                        {generated.pertemuan.map((p) => (
                          <div key={p.mingguKe} className="flex gap-2 text-sm border rounded-lg p-2">
                            <Badge variant="outline" className="font-mono shrink-0">Mgg {p.mingguKe}</Badge>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium line-clamp-1">{p.materi}</p>
                              <p className="text-xs text-muted-foreground">{p.metode} · {p.estimasiWaktu} · Bobot {p.bobotPenilaian}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </PreviewSection>
                  </Collapsible>

                  {/* Penilaian */}
                  <Collapsible open={openSections.has('penilaian')} onOpenChange={() => toggleSection('penilaian')}>
                    <PreviewSection title="Komponen Penilaian" icon={ClipboardList} count={generated.penilaian.length}>
                      <div className="space-y-1.5">
                        <div className={`text-xs font-medium ${totalBobotPenilaian === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          Total bobot: {totalBobotPenilaian}% {totalBobotPenilaian !== 100 && '(sebaiknya 100%)'}
                        </div>
                        {generated.penilaian.map((p, i) => (
                          <div key={i} className="flex items-center justify-between text-sm border rounded-lg p-2">
                            <div>
                              <span className="font-medium">{p.nama}</span>
                              <span className="text-xs text-muted-foreground ml-2">({p.bentuk})</span>
                            </div>
                            <Badge variant="secondary">{p.bobot}%</Badge>
                          </div>
                        ))}
                      </div>
                    </PreviewSection>
                  </Collapsible>

                  {/* Referensi */}
                  <Collapsible open={openSections.has('referensi')} onOpenChange={() => toggleSection('referensi')}>
                    <PreviewSection title="Referensi / Bahan Pustaka" icon={Library} count={generated.referensi.length}>
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Buku Utama</p>
                        {generated.referensi.filter((r) => r.isUtama).map((r, i) => (
                          <ReferensiItem key={`u${i}`} r={r} />
                        ))}
                        <p className="text-xs font-medium text-muted-foreground uppercase mt-3">Pendukung</p>
                        {generated.referensi.filter((r) => !r.isUtama).map((r, i) => (
                          <ReferensiItem key={`p${i}`} r={r} />
                        ))}
                      </div>
                    </PreviewSection>
                  </Collapsible>
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer / Actions */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t mt-2">
          {step === 'input' && (
            <>
              <Button variant="outline" onClick={handleClose}>Batal</Button>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending || (mode === 'existing' && !mataKuliahId) || (mode === 'custom' && (!customNama.trim() || !customDeskripsi.trim()))}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
              >
                <Wand2 className="size-4 mr-2" /> Generate RPS dengan AI
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('input')}>
                <RotateCcw className="size-4 mr-2" /> Ulangi
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !dosenId}
              >
                {saveMutation.isPending ? (
                  <><Loader2 className="size-4 mr-2 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save className="size-4 mr-2" /> Simpan RPS Lengkap</>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PreviewSection({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  count?: number
  children: React.ReactNode
}) {
  return (
    <div className="border rounded-lg bg-card">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-accent/40 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <span className="font-medium text-sm">{title}</span>
          {count !== undefined && (
            <Badge variant="secondary" className="text-xs">{count}</Badge>
          )}
        </div>
        <ChevronDown className="size-4 text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3 pt-1 border-t">
        <div className="pt-3">{children}</div>
      </CollapsibleContent>
    </div>
  )
}

function ReferensiItem({ r }: { r: FullRpsGenerated['referensi'][number] }) {
  return (
    <div className="text-sm border rounded-lg p-2">
      <p className="font-medium leading-tight">{r.judul}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {[r.pengarang, r.penerbit, r.tahun].filter(Boolean).join(', ')}
        <Badge variant="outline" className="ml-2 text-[10px] capitalize">{r.jenis}</Badge>
      </p>
      {r.url && <p className="text-xs text-primary truncate mt-0.5">{r.url}</p>}
    </div>
  )
}
