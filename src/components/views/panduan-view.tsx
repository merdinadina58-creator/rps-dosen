'use client'

import { motion } from 'framer-motion'
import {
  HelpCircle,
  LayoutDashboard,
  FileText,
  Wand2,
  Target,
  CalendarDays,
  ClipboardList,
  Library,
  Eye,
  Copy,
  Download,
  Sparkles,
  Users,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  Lightbulb,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'

export function PanduanView() {
  const { setView } = useAppStore()

  const sections = [
    {
      id: 'intro',
      icon: HelpCircle,
      title: 'Pengenalan',
      color: 'text-primary',
      content: (
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            <strong>RPS Dosen</strong> adalah sistem manajemen Rencana Pembelajaran Semester
            untuk dosen perguruan tinggi Indonesia. Aplikasi ini membantu dosen menyusun,
            mengelola, dan mengekspor dokumen RPS sesuai standar SN-Dikti, KKNI, dan kurikulum MBKM.
          </p>
          <p>
            Dengan AI integration, Anda dapat <strong>generate RPS lengkap otomatis</strong> dalam
            sekali klik — termasuk deskripsi, CPL, CPMK, 16 pertemuan mingguan, komponen penilaian,
            dan referensi. Tidak perlu input manual seperti di Word.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
            <FeatureCard icon={Wand2} label="Generate AI" desc="Otomatis 1 klik" />
            <FeatureCard icon={Download} label="Export" desc="Word & PDF" />
            <FeatureCard icon={Copy} label="Clone" desc="Copy ke semester baru" />
            <FeatureCard icon={Sparkles} label="AI Chat" desc="Tanya jawab RPS" />
          </div>
        </div>
      ),
    },
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      title: '1. Dashboard',
      color: 'text-emerald-600',
      content: (
        <div className="space-y-3 text-sm">
          <p>Dashboard adalah halaman utama yang menampilkan ringkasan sistem:</p>
          <ul className="space-y-1.5 ml-4">
            <li>📊 <strong>Statistik:</strong> Total RPS, RPS Final, RPS Draft, Total Dosen</li>
            <li>📈 <strong>Grafik:</strong> Distribusi RPS per Program Studi dan per Status</li>
            <li>📋 <strong>RPS Terbaru:</strong> 5 RPS yang terakhir dibuat/diubah</li>
            <li>⚡ <strong>Quick Actions:</strong> Tombol cepat Generate AI, Lihat RPS, AI Assistant</li>
          </ul>
          <InfoBox type="tip">
            Klik "Generate RPS dengan AI" untuk mulai membuat RPS baru otomatis.
          </InfoBox>
        </div>
      ),
    },
    {
      id: 'generate-ai',
      icon: Wand2,
      title: '2. Generate RPS dengan AI (Fitur Utama)',
      color: 'text-emerald-600',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            Fitur unggulan: AI menyusun <strong>SELURUH RPS</strong> untuk Anda dalam sekali klik.
            Tersedia di Dashboard dan Daftar RPS.
          </p>
          <StepList
            steps={[
              'Klik tombol "Generate RPS dengan AI" (warna hijau gradient)',
              'Pilih mode: "Pilih Mata Kuliah" (dari daftar) atau "Input Kustom" (mata kuliah baru)',
              'Pilih Dosen Pengampu dan tentukan Jumlah CPMK (3-6)',
              'Isi Tahun Ajaran, Semester, dan Kelas',
              <span key="ws">Aktifkan toggle <strong>"Akses Internet untuk Info Terkini"</strong> (disarankan ON) — AI akan mencari referensi & silabus terbaru dari internet</span>,
              'Klik "Generate RPS dengan AI"',
              'Tunggu ~50-70 detik. Progress bar real-time menampilkan status tiap langkah',
              'Preview hasil lengkap (collapsible sections untuk semua komponen)',
              'Klik "Simpan RPS Lengkap" untuk menyimpan ke database',
            ]}
          />
          <InfoBox type="info">
            Dengan Web Search ON, referensi yang dihasilkan adalah <strong>buku nyata</strong> dari
            internet (Google Books, ResearchGate, repository universitas) — bukan halusinasi AI.
          </InfoBox>
        </div>
      ),
    },
    {
      id: 'rps-detail',
      icon: FileText,
      title: '3. RPS Detail — 6 Tab Editor',
      color: 'text-blue-600',
      content: (
        <div className="space-y-3 text-sm">
          <p>Buka RPS dari Daftar RPS. Di halaman detail, ada 6 tab untuk mengedit:</p>
          <div className="space-y-2">
            <TabItem icon={FileText} name="Identitas" desc="Judul, tahun ajaran, semester, kelas, deskripsi, CPL, kurikulum" />
            <TabItem icon={Target} name="CPMK" desc="CPMK + Sub-CPMK. Tombol Generate AI untuk buat otomatis" />
            <TabItem icon={CalendarDays} name="Rencana Mingguan" desc="16 pertemuan (materi, metode, aktivitas, bobot). Generate AI tersedia" />
            <TabItem icon={ClipboardList} name="Penilaian" desc="Komponen penilaian (Kehadiran, Tugas, UTS, UAS). Total bobot harus 100%" />
            <TabItem icon={Library} name="Referensi" desc="Buku utama & pendukung. Generate AI dengan deep search tersedia" />
            <TabItem icon={Eye} name="Preview" desc="Preview dokumen + tombol Download DOCX/PDF" />
          </div>
          <InfoBox type="tip">
            Setiap tab CPMK/Pertemuan/Referensi punya tombol <strong>"Generate AI"</strong> untuk
            generate ulang komponen tersebut saja (tanpa generate full RPS).
          </InfoBox>
        </div>
      ),
    },
    {
      id: 'status',
      icon: CheckCircle2,
      title: '4. Status RPS (Draft / Final / Revisi)',
      color: 'text-amber-600',
      content: (
        <div className="space-y-3 text-sm">
          <p>Setiap RPS punya 3 status yang bisa diubah kapan saja:</p>
          <div className="grid grid-cols-3 gap-2">
            <StatusCard color="amber" label="Draft" desc="Masih dalam penyusunan" />
            <StatusCard color="emerald" label="Final" desc="Siap digunakan" />
            <StatusCard color="rose" label="Revisi" desc="Perlu perbaikan" />
          </div>
          <StepList
            steps={[
              'Buka RPS detail',
              'Klik badge status di header (Draft/Final/Revisi) + icon chevron',
              'Pilih status baru dari dropdown menu',
              'Status langsung berubah + toast notifikasi',
            ]}
          />
          <InfoBox type="warning">
            <strong>Validasi Final:</strong> Saat set ke "Final", sistem cek kelengkapan RPS.
            Jika belum lengkap (misal: belum ada CPMK, bobot ≠ 100%), muncul dialog daftar masalah.
            Anda bisa "Lengkapi dulu" atau "Tetap Set Final" (force).
          </InfoBox>
        </div>
      ),
    },
    {
      id: 'clone',
      icon: Copy,
      title: '5. Clone RPS ke Semester Baru',
      color: 'text-primary',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            Clone = copy RPS beserta <strong>semua isi</strong> (CPMK, 16 pertemuan, penilaian,
            referensi) ke RPS baru untuk semester berikutnya. Hemat 30-60 menit vs buat dari awal.
          </p>
          <StepList
            steps={[
              'Buka RPS yang ingin di-clone',
              'Klik tombol "Clone" di header (icon Copy)',
              'Dialog muncul — ubah Tahun Ajaran & Semester ke semester baru',
              'Judul auto-derive (bisa override manual)',
              'Klik "Clone RPS"',
              'RPS baru dibuat (status: Draft) + auto-navigate ke RPS baru',
              'Review, sesuaikan jika perlu, lalu set ke Final',
            ]}
          />
          <InfoBox type="info">
            Yang tersalin: CPMK+Sub-CPMK, 16 Pertemuan, Penilaian, Referensi, Deskripsi, CPL.
            Yang diubah: Tahun Ajaran, Semester, Kelas, Judul. Status selalu Draft.
          </InfoBox>
        </div>
      ),
    },
    {
      id: 'export',
      icon: Download,
      title: '6. Export ke Word (DOCX) & PDF',
      color: 'text-purple-600',
      content: (
        <div className="space-y-3 text-sm">
          <p>Download RPS sebagai dokumen Word (.docx) atau PDF.</p>
          <InfoBox type="warning">
            <strong>Wajib Preview dulu!</strong> Sebelum bisa download, Anda harus:
            <ol className="list-decimal ml-5 mt-1 space-y-0.5">
              <li>Buka tab <strong>Preview</strong> (tinjau dokumen)</li>
              <li>Pastikan RPS <strong>lengkap</strong> (tidak ada error)</li>
              <li>Klik tombol DOCX/PDF di bagian bawah Preview</li>
            </ol>
            Jika RPS belum lengkap, tombol download disabled + muncul daftar error.
          </InfoBox>
          <p>Dokumen yang dihasilkan berisi:</p>
          <ul className="list-disc ml-5 space-y-0.5">
            <li>Cover page (judul, kurikulum, tahun ajaran)</li>
            <li>Tabel identitas mata kuliah (10 baris)</li>
            <li>Deskripsi & CPL</li>
            <li>Daftar CPMK + Sub-CPMK</li>
            <li>Tabel rencana 16 pertemuan (7 kolom)</li>
            <li>Tabel komponen penilaian + total bobot</li>
            <li>Daftar referensi (buku utama + pendukung)</li>
            <li>Header & footer dengan nomor halaman</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'ai-assistant',
      icon: Sparkles,
      title: '7. AI Assistant (Chat)',
      color: 'text-cyan-600',
      content: (
        <div className="space-y-3 text-sm">
          <p>
            Chat dengan AI untuk bertanya seputar RPS, CPMK, asesmen, metode pembelajaran,
            standar SN-Dikti/KKNI/MBKM, dll.
          </p>
          <StepList
            steps={[
              'Klik "AI Assistant" di sidebar',
              'Ketik pertanyaan di input box (atau klik suggested question chips)',
              'Enter untuk kirim',
              'AI merespons dalam ~5-10 detik dengan jawaban lengkap (markdown)',
            ]}
          />
          <p>Contoh pertanyaan yang bisa diajukan:</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs">"Apa itu CPMK?"</Badge>
            <Badge variant="secondary" className="text-xs">"Bagaimana menyusun Sub-CPMK?"</Badge>
            <Badge variant="secondary" className="text-xs">"Standar bobot UTS/UAS?"</Badge>
            <Badge variant="secondary" className="text-xs">"Perbedaan MBKM dan KKNI?"</Badge>
            <Badge variant="secondary" className="text-xs">"Metode pembelajaran efektif?"</Badge>
          </div>
        </div>
      ),
    },
    {
      id: 'master-data',
      icon: Users,
      title: '8. Master Data (Dosen & Mata Kuliah)',
      color: 'text-indigo-600',
      content: (
        <div className="space-y-3 text-sm">
          <p>Kelola data dosen dan mata kuliah sebelum membuat RPS.</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="size-4 text-indigo-600" />
                <strong className="text-sm">Dosen</strong>
              </div>
              <p className="text-xs text-muted-foreground">
                Nama, NIP, email, telepon, prodi, jabatan. Tambah/Edit/Hapus.
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="size-4 text-indigo-600" />
                <strong className="text-sm">Mata Kuliah</strong>
              </div>
              <p className="text-xs text-muted-foreground">
                Kode, nama, SKS, semester, prodi, prasyarat, deskripsi.
              </p>
            </div>
          </div>
          <InfoBox type="tip">
            Master data diperlukan sebelum generate RPS — pilih dosen & mata kuliah dari daftar.
          </InfoBox>
        </div>
      ),
    },
    {
      id: 'prodi',
      icon: GraduationCap,
      title: '9. Dashboard Program Studi',
      color: 'text-teal-600',
      content: (
        <div className="space-y-3 text-sm">
          <p>View agregat untuk koordinator prodi — lihat semua RPS di satu prodi.</p>
          <ul className="list-disc ml-5 space-y-0.5">
            <li>Filter per Program Studi</li>
            <li>Statistik: total RPS, dosen, mata kuliah, total SKS</li>
            <li>Tabel semua RPS di prodi tersebut (status, dosen, mata kuliah)</li>
            <li>Daftar dosen di prodi tersebut dengan jumlah RPS masing-masing</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'tips',
      icon: Lightbulb,
      title: '10. Tips & Best Practices',
      color: 'text-yellow-600',
      content: (
        <div className="space-y-2.5 text-sm">
          <TipItem
            num="1"
            text="Selalu aktifkan 'Akses Internet' saat Generate AI — referensi jadi 100% real (bukan halusinasi)."
          />
          <TipItem num="2" text="Gunakan Clone untuk semester baru, bukan buat dari awal. Hemat 30-60 menit." />
          <TipItem num="3" text="Generate AI per-tab (CPMK/Pertemuan/Referensi) untuk refresh komponen tertentu tanpa generate ulang full RPS." />
          <TipItem num="4" text="Pastikan total bobot penilaian = 100% sebelum set Final atau download." />
          <TipItem num="5" text="Status Draft = masih editing. Final = siap dipakai. Revisi = perlu perbaikan." />
          <TipItem num="6" text="Preview tab wajib dibuka sebelum download — sistem akan redirect otomatis." />
          <TipItem num="7" text="AI Assistant bisa jawab pertanyaan seputar RPS, CPMK, SN-Dikti, MBKM, dll." />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <HelpCircle className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Panduan Penggunaan</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Panduan lengkap penggunaan RPS Dosen Management System
            </p>
          </div>
        </div>
      </motion.div>

      <Card>
        <CardContent className="p-0">
          <Accordion type="single" defaultValue="intro" collapsible className="w-full">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <AccordionItem key={section.id} value={section.id} className="border-b last:border-0">
                  <AccordionTrigger className="px-4 hover:no-underline hover:bg-accent/40">
                    <div className="flex items-center gap-3 text-left">
                      <div className={`size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 ${section.color}`}>
                        <Icon className="size-4" />
                      </div>
                      <span className="font-semibold text-sm">{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-1">
                    {section.content}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Quick navigation */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="size-4 text-primary" />
            Mulai Cepat
          </CardTitle>
          <CardDescription>
            Baru di aplikasi ini? Ikuti 3 langkah berikut:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <QuickStartStep
            num="1"
            title="Lengkapi Master Data"
            desc="Tambahkan data Dosen & Mata Kuliah di menu Master Data"
            action={() => setView('dosen')}
            actionLabel="Buka Dosen"
          />
          <Separator />
          <QuickStartStep
            num="2"
            title="Generate RPS dengan AI"
            desc="Pilih mata kuliah, AI susun RPS lengkap otomatis dalam 1 klik"
            action={() => setView('rps-list')}
            actionLabel="Buka Daftar RPS"
          />
          <Separator />
          <QuickStartStep
            num="3"
            title="Review & Download"
            desc="Buka tab Preview, pastikan lengkap, lalu download DOCX/PDF"
            action={() => setView('panduan')}
            actionLabel="Tutup Panduan"
          />
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">FAQ (Frequently Asked Questions)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <FaqItem
            q="Berapa lama Generate AI RPS?"
            a="Sekitar 50-70 detik. Dengan Web Search ON, tambahan ~5 detik untuk cari referensi real. Progress bar real-time menampilkan status tiap langkah."
          />
          <FaqItem
            q="Apakah referensi dari AI real atau fiktif?"
            a="Dengan toggle 'Akses Internet' ON, referensi diambil langsung dari hasil web search (Google Books, ResearchGate, repository universitas) — 100% real. Jika OFF, AI menggunakan pengetahuan training yang mungkin kurang akurat."
          />
          <FaqItem
            q="Kenapa tidak bisa download DOCX/PDF?"
            a="Download butuh 2 syarat: (1) Sudah buka tab Preview, (2) RPS lengkap (bobot = 100%, ada CPMK, pertemuan, dll). Sistem akan tampilkan apa yang masih kurang."
          />
          <FaqItem
            q="Apa beda Generate AI di dialog vs per-tab?"
            a="Dialog 'Generate RPS dengan AI' = generate SELURUH RPS sekaligus. Tombol 'Generate AI' per-tab (di tab CPMK/Pertemuan/Referensi) = generate ulang komponen tersebut saja."
          />
          <FaqItem
            q="Bisa edit RPS yang sudah di-generate AI?"
            a="Ya! Setelah disimpan, semua komponen bisa diedit manual di tab masing-masing (CPMK, Pertemuan, Penilaian, Referensi)."
          />
          <FaqItem
            q="Apa itu Clone RPS?"
            a="Clone = copy RPS beserta semua isi ke semester baru. Misal: RPS semester ganjil 2024/2025 di-clone jadi RPS semester genap 2025/2026. Hemat waktu vs buat dari awal."
          />
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground pb-4">
        © 2024 RPS Dosen Management System · Dibuat untuk dosen perguruan tinggi Indonesia
      </div>
    </div>
  )
}

// ===== Helper Components =====

function FeatureCard({ icon: Icon, label, desc }: { icon: React.ElementType; label: string; desc: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <Icon className="size-5 mx-auto text-primary mb-1" />
      <p className="text-xs font-medium">{label}</p>
      <p className="text-[10px] text-muted-foreground">{desc}</p>
    </div>
  )
}

function StepList({ steps }: { steps: React.ReactNode[] }) {
  return (
    <ol className="space-y-1.5 ml-1">
      {steps.map((step, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm">
          <span className="size-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            {i + 1}
          </span>
          <span className="flex-1">{step}</span>
        </li>
      ))}
    </ol>
  )
}

function InfoBox({ type, children }: { type: 'tip' | 'info' | 'warning'; children: React.ReactNode }) {
  const styles = {
    tip: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300',
  }
  const icons = { tip: Lightbulb, info: Sparkles, warning: AlertTriangle }
  const Icon = icons[type]
  return (
    <div className={`rounded-lg border p-3 text-xs ${styles[type]}`}>
      <div className="flex items-start gap-2">
        <Icon className="size-4 shrink-0 mt-0.5" />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}

function TabItem({ icon: Icon, name, desc }: { icon: React.ElementType; name: string; desc: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border p-2">
      <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

function StatusCard({ color, label, desc }: { color: string; label: string; desc: string }) {
  const colors: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    rose: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200',
  }
  return (
    <div className={`rounded-lg p-3 text-center ${colors[color]}`}>
      <p className="font-bold text-sm">{label}</p>
      <p className="text-[10px] mt-0.5 opacity-80">{desc}</p>
    </div>
  )
}

function TipItem({ num, text }: { num: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="size-5 rounded-full bg-yellow-500/20 text-yellow-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {num}
      </span>
      <span className="flex-1">{text}</span>
    </div>
  )
}

function QuickStartStep({
  num,
  title,
  desc,
  action,
  actionLabel,
}: {
  num: string
  title: string
  desc: string
  action: () => void
  actionLabel: string
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="size-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0">
        {num}
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button
        onClick={action}
        className="text-xs font-medium text-primary hover:underline shrink-0"
      >
        {actionLabel} →
      </button>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="font-medium text-sm flex items-start gap-2">
        <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-0.5 rotate-[-90deg]" />
        {q}
      </p>
      <p className="text-xs text-muted-foreground mt-1.5 ml-6 leading-relaxed">{a}</p>
    </div>
  )
}
