'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { api, type RpsDetail } from '@/lib/api'

interface Props {
  rps: RpsDetail
}

export function IdentitasTab({ rps }: Props) {
  return <IdentitasTabInner key={rps.id} rps={rps} />
}

function toDateInput(d: string | null | undefined): string {
  if (!d) return ''
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function IdentitasTabInner({ rps }: Props) {
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    judul: rps.judul,
    tahunAjaran: rps.tahunAjaran,
    semester: rps.semester,
    kelas: rps.kelas ?? '',
    deskripsi: rps.deskripsi ?? '',
    deskripsiSingkat: rps.deskripsiSingkat ?? '',
    bahanKajian: rps.bahanKajian ?? '',
    cpl: rps.cpl ?? '',
    mediaSoftware: rps.mediaSoftware ?? '',
    mediaHardware: rps.mediaHardware ?? '',
    teamTeaching: rps.teamTeaching,
    mataKuliahSyarat: rps.mataKuliahSyarat ?? '',
    universitas: rps.universitas ?? '',
    fakultas: rps.fakultas ?? '',
    kodeDokumen: rps.kodeDokumen ?? '',
    tglPenyusunan: toDateInput(rps.tglPenyusunan),
    otorisasiDosenPengembang: rps.otorisasiDosenPengembang ?? '',
    otorisasiKoordinatorRmk: rps.otorisasiKoordinatorRmk ?? '',
    otorisasiKaprodi: rps.otorisasiKaprodi ?? '',
    mingguPertemuan: rps.mingguPertemuan,
    status: rps.status,
    kurikulum: rps.kurikulum,
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updateRps(rps.id, {
        ...form,
        kelas: form.kelas || null,
        tglPenyusunan: form.tglPenyusunan || null,
      }),
    onSuccess: () => {
      toast.success('Identitas RPS disimpan')
      queryClient.invalidateQueries({ queryKey: ['rps', rps.id] })
      queryClient.invalidateQueries({ queryKey: ['rps', 'list'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identitas Mata Kuliah</CardTitle>
          <CardDescription>Informasi dasar mata kuliah &amp; RPS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="judul">Judul RPS</Label>
            <Input
              id="judul"
              value={form.judul}
              onChange={(e) => set('judul', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tahun">Tahun Ajaran</Label>
              <Input
                id="tahun"
                value={form.tahunAjaran}
                onChange={(e) => set('tahunAjaran', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sem">Semester</Label>
              <Select
                value={form.semester}
                onValueChange={(v) => set('semester', v)}
              >
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
            <div className="grid gap-2">
              <Label htmlFor="kelas">Kelas</Label>
              <Input
                id="kelas"
                value={form.kelas}
                onChange={(e) => set('kelas', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="minggu">Jumlah Pertemuan</Label>
              <Input
                id="minggu"
                type="number"
                min={1}
                max={32}
                value={form.mingguPertemuan}
                onChange={(e) =>
                  set('mingguPertemuan', Number(e.target.value) || 16)
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set('status', v)}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="revisi">Revisi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kurikulum">Kurikulum</Label>
              <Select
                value={form.kurikulum}
                onValueChange={(v) => set('kurikulum', v)}
              >
                <SelectTrigger id="kurikulum">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OBE">OBE</SelectItem>
                  <SelectItem value="MBKM">MBKM</SelectItem>
                  <SelectItem value="KKNI">KKNI</SelectItem>
                  <SelectItem value="Kurikulum 2013">Kurikulum 2013</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Institusi & Otorisasi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Institusi &amp; Pengesahan</CardTitle>
          <CardDescription>
            Informasi institusi serta otorisasi penyusun RPS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="universitas">Universitas</Label>
              <Input
                id="universitas"
                placeholder="e.g. Universitas Nias Raya"
                value={form.universitas}
                onChange={(e) => set('universitas', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fakultas">Fakultas</Label>
              <Input
                id="fakultas"
                placeholder="e.g. Fakultas Keguruan dan Ilmu Pendidikan"
                value={form.fakultas}
                onChange={(e) => set('fakultas', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kodeDokumen">Kode Dokumen</Label>
              <Input
                id="kodeDokumen"
                placeholder="e.g. RPS-MK-001"
                value={form.kodeDokumen}
                onChange={(e) => set('kodeDokumen', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tglPenyusunan">Tanggal Penyusunan</Label>
              <Input
                id="tglPenyusunan"
                type="date"
                value={form.tglPenyusunan}
                onChange={(e) => set('tglPenyusunan', e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm font-medium mb-3">Otorisasi / Pengesahan</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="otor1">Dosen Pengembang RPS</Label>
                <Input
                  id="otor1"
                  placeholder="Nama dosen pengembang"
                  value={form.otorisasiDosenPengembang}
                  onChange={(e) => set('otorisasiDosenPengembang', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="otor2">Koordinator RMK</Label>
                <Input
                  id="otor2"
                  placeholder="Nama koordinator RMK"
                  value={form.otorisasiKoordinatorRmk}
                  onChange={(e) => set('otorisasiKoordinatorRmk', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="otor3">Kaprodi</Label>
                <Input
                  id="otor3"
                  placeholder="Nama kaprodi"
                  value={form.otorisasiKaprodi}
                  onChange={(e) => set('otorisasiKaprodi', e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deskripsi & Bahan Kajian */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Deskripsi &amp; Bahan Kajian</CardTitle>
          <CardDescription>Uraian mata kuliah sesuai template OBE</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="deskripsi">Deskripsi Mata Kuliah (lengkap)</Label>
            <Textarea
              id="deskripsi"
              rows={4}
              value={form.deskripsi}
              onChange={(e) => set('deskripsi', e.target.value)}
              placeholder="Deskripsi lengkap mata kuliah..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="deskripsiSingkat">Deskripsi Singkat</Label>
            <Textarea
              id="deskripsiSingkat"
              rows={2}
              value={form.deskripsiSingkat}
              onChange={(e) => set('deskripsiSingkat', e.target.value)}
              placeholder="Deskripsi singkat (1-2 kalimat)..."
            />
            <p className="text-xs text-muted-foreground">
              Ringkasan singkat untuk header dokumen RPS.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bahanKajian">Bahan Kajian</Label>
            <Textarea
              id="bahanKajian"
              rows={3}
              value={form.bahanKajian}
              onChange={(e) => set('bahanKajian', e.target.value)}
              placeholder="Pokok-pokok materi yang dibahas dalam mata kuliah..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cpl">Capaian Pembelajaran Lulusan (CPL)</Label>
            <Textarea
              id="cpl"
              rows={3}
              value={form.cpl}
              onChange={(e) => set('cpl', e.target.value)}
              placeholder="CPL mata kuliah (legacy)..."
            />
            <p className="text-xs text-muted-foreground">
              Catatan: untuk OBE terstruktur, gunakan tab CPMK &mdash; bagian CPL
              Prodi.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Media, Team Teaching, Prasyarat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Media Pembelajaran &amp; Lain-lain
          </CardTitle>
          <CardDescription>
            Software/hardware pendukung, team teaching, mata kuliah syarat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="mediaSoftware">Media Pembelajaran - Software</Label>
              <Textarea
                id="mediaSoftware"
                rows={3}
                value={form.mediaSoftware}
                onChange={(e) => set('mediaSoftware', e.target.value)}
                placeholder="e.g. VS Code, XAMPP, Figma, Zoom, LMS..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mediaHardware">Media Pembelajaran - Hardware</Label>
              <Textarea
                id="mediaHardware"
                rows={3}
                value={form.mediaHardware}
                onChange={(e) => set('mediaHardware', e.target.value)}
                placeholder="e.g. Laptop, Proyektor, Whiteboard, Lab Komputer..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="teamTeaching" className="text-sm font-medium">
                Team Teaching
              </Label>
              <p className="text-xs text-muted-foreground">
                Centang bila mata kuliah ini diajar lebih dari 1 dosen.
              </p>
            </div>
            <Switch
              id="teamTeaching"
              checked={form.teamTeaching}
              onCheckedChange={(v) => set('teamTeaching', v)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mataKuliahSyarat">Mata Kuliah Syarat</Label>
            <Input
              id="mataKuliahSyarat"
              value={form.mataKuliahSyarat}
              onChange={(e) => set('mataKuliahSyarat', e.target.value)}
              placeholder="e.g. Algoritma Pemrograman, Kalkulus I..."
            />
            <p className="text-xs text-muted-foreground">
              Mata kuliah yang sebaiknya (atau wajib) sudah ditempuh sebelum
              mengambil mata kuliah ini.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Save className="size-4 mr-2" />
          )}
          Simpan Perubahan
        </Button>
      </div>
    </div>
  )
}
