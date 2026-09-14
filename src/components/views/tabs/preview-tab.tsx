'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/status-badge'
import type { RpsDetail } from '@/lib/api'

interface Props {
  rps: RpsDetail
}

export function PreviewTab({ rps }: Props) {
  const totalBobot = rps.penilaian.reduce((s, p) => s + p.bobot, 0)
  const bukuUtama = rps.referensi.filter((r) => r.isUtama)
  const bukuPendukung = rps.referensi.filter((r) => !r.isUtama)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preview Dokumen RPS</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cover */}
        <div className="text-center py-4">
          <h2 className="text-xl font-bold">RENCANA PEMBELAJARAN SEMESTER</h2>
          <p className="text-muted-foreground mt-1">(RPS)</p>
          <p className="text-sm text-muted-foreground mt-2">
            Kurikulum {rps.kurikulum} · T.A. {rps.tahunAjaran}
          </p>
          <div className="mt-3 flex justify-center">
            <StatusBadge status={rps.status} />
          </div>
        </div>

        <Separator />

        {/* Identitas */}
        <div>
          <h3 className="font-semibold mb-2">A. Identitas Mata Kuliah</h3>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <PreviewRow label="Nama Mata Kuliah" value={rps.mataKuliah.nama} />
                <PreviewRow label="Kode" value={rps.mataKuliah.kode} mono />
                <PreviewRow label="Bobot SKS" value={`${rps.mataKuliah.sks} SKS`} />
                <PreviewRow
                  label="Semester"
                  value={`${rps.mataKuliah.semester} (${rps.semester})`}
                />
                <PreviewRow label="Program Studi" value={rps.mataKuliah.prodi} />
                <PreviewRow label="Kelas" value={rps.kelas || '-'} />
                <PreviewRow label="Dosen Pengampu" value={rps.dosen.nama} />
                <PreviewRow label="NIP/NIDN" value={rps.dosen.nip || '-'} mono />
                <PreviewRow label="Mata Kuliah Prasyarat" value={rps.mataKuliah.prasyarat || '-'} />
                <PreviewRow label="Kurikulum" value={rps.kurikulum} />
              </tbody>
            </table>
          </div>
        </div>

        {/* Deskripsi */}
        <div>
          <h3 className="font-semibold mb-2">B. Deskripsi Mata Kuliah</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {rps.deskripsi || rps.mataKuliah.deskripsi || '-'}
          </p>
        </div>

        {/* CPL */}
        <div>
          <h3 className="font-semibold mb-2">C. Capaian Pembelajaran Lulusan (CPL)</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {rps.cpl || '-'}
          </p>
        </div>

        {/* CPMK */}
        <div>
          <h3 className="font-semibold mb-2">D. Capaian Pembelajaran Mata Kuliah (CPMK)</h3>
          {rps.cpmk.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Belum ada CPMK.</p>
          ) : (
            <ol className="space-y-3 text-sm">
              {rps.cpmk.map((c) => (
                <li key={c.id}>
                  <p>
                    <span className="font-mono font-semibold">{c.kode}.</span> {c.deskripsi}
                  </p>
                  {c.subCpmk.length > 0 && (
                    <ul className="ml-6 mt-1 space-y-0.5">
                      {c.subCpmk.map((s) => (
                        <li key={s.id} className="text-sm">
                          <span className="font-mono text-muted-foreground">{s.kode}.</span>{' '}
                          {s.deskripsi}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Rencana Mingguan */}
        <div>
          <h3 className="font-semibold mb-2">E. Rencana Pembelajaran Mingguan</h3>
          {rps.pertemuan.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Belum ada pertemuan.</p>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 border-r">Mgg</th>
                    <th className="text-left p-2 border-r">Materi</th>
                    <th className="text-left p-2 border-r">Metode</th>
                    <th className="text-left p-2 border-r">Aktivitas Dosen</th>
                    <th className="text-left p-2 border-r">Aktivitas Mhs</th>
                    <th className="text-center p-2 border-r">Bobot</th>
                    <th className="text-left p-2">Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {rps.pertemuan.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2 border-r text-center font-medium">{p.mingguKe}</td>
                      <td className="p-2 border-r">{p.materi || '-'}</td>
                      <td className="p-2 border-r">{p.metode || '-'}</td>
                      <td className="p-2 border-r">{p.aktivitasDosen || '-'}</td>
                      <td className="p-2 border-r">{p.aktivitasMhs || '-'}</td>
                      <td className="p-2 border-r text-center font-mono">{p.bobotPenilaian}%</td>
                      <td className="p-2">{p.estimasiWaktu || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Penilaian */}
        <div>
          <h3 className="font-semibold mb-2">F. Komponen Penilaian</h3>
          {rps.penilaian.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Belum ada komponen penilaian.</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 border-r w-10">No</th>
                    <th className="text-left p-2 border-r">Komponen</th>
                    <th className="text-left p-2 border-r">Bentuk</th>
                    <th className="text-center p-2 w-20">Bobot</th>
                  </tr>
                </thead>
                <tbody>
                  {rps.penilaian.map((p, i) => (
                    <tr key={p.id} className="border-t">
                      <td className="p-2 border-r text-center">{i + 1}</td>
                      <td className="p-2 border-r">{p.nama}</td>
                      <td className="p-2 border-r">{p.bentuk || '-'}</td>
                      <td className="p-2 text-center font-mono">{p.bobot}%</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/40 font-semibold border-t">
                    <td colSpan={3} className="p-2 text-right border-r">TOTAL</td>
                    <td className="p-2 text-center font-mono">{totalBobot}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Referensi */}
        <div>
          <h3 className="font-semibold mb-2">G. Referensi / Bahan Pustaka</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1">Buku Utama:</p>
              {bukuUtama.length === 0 ? (
                <p className="text-sm text-muted-foreground italic ml-4">-</p>
              ) : (
                <ol className="ml-4 text-sm space-y-1">
                  {bukuUtama.map((r, i) => (
                    <li key={r.id}>
                      {i + 1}.{' '}
                      {r.pengarang && <span className="italic">{r.pengarang}. </span>}
                      <span className="font-medium">{r.judul}. </span>
                      <span className="text-muted-foreground">
                        {[r.penerbit, r.tahun].filter(Boolean).join(', ')}.
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Buku Pendukung / Sumber Lain:</p>
              {bukuPendukung.length === 0 ? (
                <p className="text-sm text-muted-foreground italic ml-4">-</p>
              ) : (
                <ol className="ml-4 text-sm space-y-1">
                  {bukuPendukung.map((r, i) => (
                    <li key={r.id}>
                      {i + 1}.{' '}
                      {r.pengarang && <span className="italic">{r.pengarang}. </span>}
                      <span className="font-medium">{r.judul}. </span>
                      <span className="text-muted-foreground">
                        {[r.penerbit, r.tahun].filter(Boolean).join(', ')}.
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PreviewRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <tr className="border-b last:border-0">
      <td className="p-2 bg-muted/40 font-medium w-1/3 align-top">{label}</td>
      <td className={`p-2 ${mono ? 'font-mono' : ''}`}>{value}</td>
    </tr>
  )
}
