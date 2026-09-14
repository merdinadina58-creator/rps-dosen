'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api, type RpsDetail } from '@/lib/api'

interface Props {
  rps: RpsDetail
}

export function IdentitasTab({ rps }: Props) {
  // Use rps.id as key to remount when switching RPS, but here we just init from rps
  return <IdentitasTabInner key={rps.id} rps={rps} />
}

function IdentitasTabInner({ rps }: Props) {
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    judul: rps.judul,
    tahunAjaran: rps.tahunAjaran,
    semester: rps.semester,
    kelas: rps.kelas ?? '',
    deskripsi: rps.deskripsi ?? '',
    cpl: rps.cpl ?? '',
    mingguPertemuan: rps.mingguPertemuan,
    status: rps.status,
    kurikulum: rps.kurikulum,
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      api.updateRps(rps.id, {
        ...form,
        kelas: form.kelas || null,
      }),
    onSuccess: () => {
      toast.success('Identitas RPS disimpan')
      queryClient.invalidateQueries({ queryKey: ['rps', rps.id] })
      queryClient.invalidateQueries({ queryKey: ['rps', 'list'] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Identitas Mata Kuliah</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="judul">Judul RPS</Label>
          <Input
            id="judul"
            value={form.judul}
            onChange={(e) => setForm((f) => ({ ...f, judul: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tahun">Tahun Ajaran</Label>
            <Input
              id="tahun"
              value={form.tahunAjaran}
              onChange={(e) => setForm((f) => ({ ...f, tahunAjaran: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sem">Semester</Label>
            <Select
              value={form.semester}
              onValueChange={(v) => setForm((f) => ({ ...f, semester: v }))}
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
              onChange={(e) => setForm((f) => ({ ...f, kelas: e.target.value }))}
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
                setForm((f) => ({ ...f, mingguPertemuan: Number(e.target.value) || 16 }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
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
              onValueChange={(v) => setForm((f) => ({ ...f, kurikulum: v }))}
            >
              <SelectTrigger id="kurikulum">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MBKM">MBKM</SelectItem>
                <SelectItem value="KKNI">KKNI</SelectItem>
                <SelectItem value="Kurikulum 2013">Kurikulum 2013</SelectItem>
                <SelectItem value="Lainnya">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="deskripsi">Deskripsi Mata Kuliah</Label>
          <Textarea
            id="deskripsi"
            rows={4}
            value={form.deskripsi}
            onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
            placeholder="Deskripsi singkat mata kuliah..."
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="cpl">Capaian Pembelajaran Lulusan (CPL)</Label>
          <Textarea
            id="cpl"
            rows={4}
            value={form.cpl}
            onChange={(e) => setForm((f) => ({ ...f, cpl: e.target.value }))}
            placeholder="CPL mata kuliah..."
          />
        </div>

        <div className="flex justify-end">
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : (
              <Save className="size-4 mr-2" />
            )}
            Simpan Perubahan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
