'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusBadge } from '@/components/status-badge'
import { Download, FileDown, Loader2, CheckCircle2 } from 'lucide-react'
import { validateRpsCompleteness } from '@/lib/rps-validation'
import type { RpsDetail } from '@/lib/api'

interface Props {
  rps: RpsDetail
  onExport?: (format: 'docx' | 'pdf') => void
  exporting?: 'docx' | 'pdf' | null
}

export function PreviewTab({ rps, onExport, exporting }: Props) {
  const totalBobot = rps.penilaian.reduce((s, p) => s + p.bobot, 0)
  const totalBobotPertemuan = rps.pertemuan.reduce((s, p) => s + p.bobotPenilaian, 0)
  const bukuUtama = rps.referensi.filter((r) => r.isUtama)
  const bukuPendukung = rps.referensi.filter((r) => !r.isUtama)

  const validation = validateRpsCompleteness(rps)
  const errorCount = validation.issues.filter((i) => i.severity === 'error').length
  const canDownload = validation.isValid

  const fmtDate = (d: string | null | undefined) => {
    if (!d) return '-'
    const date = new Date(d)
    if (Number.isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Preview Dokumen RPS (OBE)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Header Institusi */}
        <div className="text-center py-4 border-b">
          {rps.universitas && (
            <p className="text-sm font-bold uppercase tracking-wide">{rps.universitas}</p>
          )}
          {rps.fakultas && (
            <p className="text-sm text-muted-foreground">{rps.fakultas}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Program Studi {rps.mataKuliah.prodi}
          </p>
          <h2 className="text-xl font-bold mt-3">RENCANA PEMBELAJARAN SEMESTER</h2>
          <p className="text-muted-foreground mt-1">(RPS)</p>
          <div className="flex flex-wrap justify-center gap-2 mt-3 text-xs text-muted-foreground">
            {rps.kodeDokumen && <span>Kode Dok: <strong>{rps.kodeDokumen}</strong></span>}
            <span>·</span>
            <span>T.A. {rps.tahunAjaran}</span>
            <span>·</span>
            <span>Semester {rps.semester}</span>
            {rps.tglPenyusunan && (
              <>
                <span>·</span>
                <span>Tgl Penyusunan: {fmtDate(rps.tglPenyusunan)}</span>
              </>
            )}
          </div>
          <div className="mt-3 flex justify-center">
            <StatusBadge status={rps.status} />
          </div>
        </div>

        {/* Otorisasi/Pengesahan */}
        <div>
          <h3 className="font-semibold mb-2">A. Otorisasi / Pengesahan</h3>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-center p-2 border-r">Dosen Pengembang RPS</th>
                  <th className="text-center p-2 border-r">Koordinator RMK</th>
                  <th className="text-center p-2">Kaprodi</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border-r text-center align-top min-h-[60px]">
                    <p className="font-semibold">{rps.otorisasiDosenPengembang || '-'}</p>
                    <p className="text-xs text-muted-foreground mt-2">__________________</p>
                    <p className="text-xs text-muted-foreground">NIDN/NIP</p>
                  </td>
                  <td className="p-3 border-r text-center align-top">
                    <p className="font-semibold">{rps.otorisasiKoordinatorRmk || '-'}</p>
                    <p className="text-xs text-muted-foreground mt-2">__________________</p>
                    <p className="text-xs text-muted-foreground">NIDN/NIP</p>
                  </td>
                  <td className="p-3 text-center align-top">
                    <p className="font-semibold">{rps.otorisasiKaprodi || '-'}</p>
                    <p className="text-xs text-muted-foreground mt-2">__________________</p>
                    <p className="text-xs text-muted-foreground">NIDN/NIP</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Identitas */}
        <div>
          <h3 className="font-semibold mb-2">B. Identitas Mata Kuliah</h3>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <PreviewRow label="Nama Mata Kuliah" value={rps.mataKuliah.nama} />
                <PreviewRow label="Kode MK" value={rps.mataKuliah.kode} mono />
                <PreviewRow label="Rumpun MK" value={rps.mataKuliah.rumpunMk || '-'} />
                <PreviewRow
                  label="Bobot SKS"
                  value={`${rps.mataKuliah.sks} SKS (T=${rps.mataKuliah.sksTeori}, P=${rps.mataKuliah.sksPraktek})`}
                />
                <PreviewRow
                  label="Semester"
                  value={`${rps.mataKuliah.semester} (${rps.semester})`}
                />
                <PreviewRow label="Program Studi" value={rps.mataKuliah.prodi} />
                <PreviewRow label="Kelas" value={rps.kelas || '-'} />
                <PreviewRow label="Dosen Pengampu" value={rps.dosen.nama} />
                <PreviewRow label="NIP/NIDN" value={rps.dosen.nip || '-'} mono />
                <PreviewRow
                  label="Mata Kuliah Syarat"
                  value={rps.mataKuliahSyarat || rps.mataKuliah.prasyarat || '-'}
                />
                <PreviewRow label="Kurikulum" value={rps.kurikulum} />
                <PreviewRow label="Jumlah Pertemuan" value={`${rps.mingguPertemuan} kali`} />
              </tbody>
            </table>
          </div>
        </div>

        {/* CPL Prodi */}
        <div>
          <h3 className="font-semibold mb-2">C. Capaian Pembelajaran Lulusan (CPL) Prodi</h3>
          {rps.cplProdi.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Belum ada CPL Prodi terstruktur. Lihat CPL legacy di bawah.
            </p>
          ) : (
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-2 border-r w-20">Kode</th>
                  <th className="text-left p-2">Deskripsi CPL</th>
                </tr>
              </thead>
              <tbody>
                {rps.cplProdi.map((cpl) => (
                  <tr key={cpl.id} className="border-t">
                    <td className="p-2 border-r font-mono text-xs">{cpl.kode}</td>
                    <td className="p-2">{cpl.deskripsi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {rps.cpl && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap mt-2">
              <span className="text-xs text-muted-foreground">CPL (legacy):</span>
              <br />
              {rps.cpl}
            </p>
          )}
        </div>

        {/* CPMK */}
        <div>
          <h3 className="font-semibold mb-2">D. CPMK</h3>
          {rps.cpmk.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Belum ada CPMK.</p>
          ) : (
            <ol className="space-y-2 text-sm list-decimal ml-5">
              {rps.cpmk.map((c) => (
                <li key={c.id} className="space-y-1">
                  <span className="font-mono font-semibold">{c.kode}.</span>{' '}
                  {c.deskripsi}
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Sub-CPMK */}
        <div>
          <h3 className="font-semibold mb-2">E. Sub-CPMK</h3>
          {rps.cpmk.every((c) => c.subCpmk.length === 0) ? (
            <p className="text-sm text-muted-foreground italic">Belum ada Sub-CPMK.</p>
          ) : (
            <ol className="space-y-1 text-sm list-decimal ml-5">
              {rps.cpmk.flatMap((c) => c.subCpmk).map((s) => (
                <li key={s.id}>
                  <span className="font-mono font-semibold">{s.kode}.</span> {s.deskripsi}
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Korelasi */}
        {rps.korelasi.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">
              F. Korelasi CPL terhadap Sub-CPMK
            </h3>
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 border-r">Sub-CPMK</th>
                    {rps.cplProdi.map((cpl) => (
                      <th key={cpl.id} className="text-center p-2 border-r">
                        {cpl.kode}
                      </th>
                    ))}
                    <th className="text-center p-2 border-r">Bobot</th>
                    <th className="text-center p-2">Jumlah Mgg</th>
                  </tr>
                </thead>
                <tbody>
                  {rps.korelasi.map((k) => {
                    const cplKode =
                      k.cplProdi?.kode ?? rps.cplProdi.find((c) => c.id === k.cplProdiId)?.kode
                    return (
                      <tr key={k.id} className="border-t">
                        <td className="p-2 border-r font-mono">{k.subCpmkKode || '-'}</td>
                        {rps.cplProdi.map((cpl) => (
                          <td
                            key={cpl.id}
                            className="p-2 border-r text-center font-mono"
                          >
                            {cplKode === cpl.kode ? (k.bobot || '✓') : ''}
                          </td>
                        ))}
                        <td className="p-2 border-r text-center font-mono">
                          {k.bobot || '-'}
                        </td>
                        <td className="p-2 text-center">{k.jumlahMinggu}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Deskripsi Singkat & Bahan Kajian */}
        {(rps.deskripsiSingkat || rps.bahanKajian) && (
          <div className="space-y-4">
            {rps.deskripsiSingkat && (
              <div>
                <h3 className="font-semibold mb-2">G. Deskripsi Singkat</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {rps.deskripsiSingkat}
                </p>
              </div>
            )}
            {rps.bahanKajian && (
              <div>
                <h3 className="font-semibold mb-2">H. Bahan Kajian</h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {rps.bahanKajian}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Deskripsi lengkap (legacy, kept for compatibility) */}
        {rps.deskripsi && (
          <div>
            <h3 className="font-semibold mb-2">I. Deskripsi Mata Kuliah</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {rps.deskripsi}
            </p>
          </div>
        )}

        {/* Rencana Pembelajaran Mingguan (OBE) */}
        <div>
          <h3 className="font-semibold mb-2">
            J. Rencana Pembelajaran Mingguan (OBE)
          </h3>
          {rps.pertemuan.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Belum ada pertemuan.</p>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 border-r">Mgg</th>
                    <th className="text-left p-2 border-r">Sub-CPMK</th>
                    <th className="text-left p-2 border-r">Kemampuan Akhir</th>
                    <th className="text-left p-2 border-r">Indikator</th>
                    <th className="text-left p-2 border-r">Teknik &amp; Kriteria</th>
                    <th className="text-center p-2 border-r">TM/Daring</th>
                    <th className="text-left p-2 border-r">Materi</th>
                    <th className="text-center p-2">Bobot</th>
                  </tr>
                </thead>
                <tbody>
                  {rps.pertemuan.map((p) => (
                    <tr key={p.id} className="border-t align-top">
                      <td className="p-2 border-r text-center font-medium">{p.mingguKe}</td>
                      <td className="p-2 border-r font-mono text-[10px]">
                        {p.subCpmkUtama || '-'}
                      </td>
                      <td className="p-2 border-r whitespace-pre-line">
                        {p.kemampuanAkhir || '-'}
                      </td>
                      <td className="p-2 border-r whitespace-pre-line">
                        {p.indikator || '-'}
                      </td>
                      <td className="p-2 border-r whitespace-pre-line">
                        {p.teknikPenilaian && <p><strong>{p.teknikPenilaian}</strong></p>}
                        {p.kriteriaPenilaian && <p className="text-muted-foreground">{p.kriteriaPenilaian}</p>}
                        {!p.teknikPenilaian && !p.kriteriaPenilaian && '-'}
                      </td>
                      <td className="p-2 border-r text-center">
                        {p.tmDaring || '-'}
                      </td>
                      <td className="p-2 border-r whitespace-pre-line">
                        {p.materi || '-'}
                      </td>
                      <td className="p-2 text-center font-mono">
                        {p.bobotPenilaian}%
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-muted/40 font-semibold border-t">
                    <td colSpan={7} className="p-2 text-right border-r">
                      TOTAL
                    </td>
                    <td className="p-2 text-center font-mono">{totalBobotPertemuan}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Komponen Penilaian */}
        <div>
          <h3 className="font-semibold mb-2">K. Komponen Penilaian</h3>
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
          <h3 className="font-semibold mb-2">L. Referensi / Bahan Pustaka</h3>
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

        {/* Media Pembelajaran & Team Teaching */}
        {(rps.mediaSoftware || rps.mediaHardware || rps.teamTeaching) && (
          <div className="space-y-3">
            <h3 className="font-semibold mb-2">M. Media Pembelajaran &amp; Lain-lain</h3>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {rps.mediaSoftware && (
                    <PreviewRow label="Media Software" value={rps.mediaSoftware} />
                  )}
                  {rps.mediaHardware && (
                    <PreviewRow label="Media Hardware" value={rps.mediaHardware} />
                  )}
                  <PreviewRow
                    label="Team Teaching"
                    value={rps.teamTeaching ? 'Ya' : 'Tidak'}
                  />
                </tbody>
              </table>
            </div>
          </div>
        )}

        <Separator />

        {/* Download section — only available after reviewing preview */}
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${canDownload ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'}`}>
                {canDownload ? <CheckCircle2 className="size-5" /> : <Loader2 className="size-5" />}
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {canDownload ? 'RPS siap diunduh!' : 'RPS belum lengkap'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {canDownload
                    ? 'Dokumen sudah ditinjau. Pilih format untuk mengunduh.'
                    : `${errorCount} masalah harus diperbaiki sebelum download (lihat tab terkait)`}
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onExport?.('docx')}
                disabled={!canDownload || exporting !== null}
                className="bg-background"
              >
                {exporting === 'docx' ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : (
                  <Download className="size-4 mr-1.5" />
                )}
                DOCX
              </Button>
              <Button
                size="sm"
                onClick={() => onExport?.('pdf')}
                disabled={!canDownload || exporting !== null}
                className="bg-primary hover:bg-primary/90"
              >
                {exporting === 'pdf' ? (
                  <Loader2 className="size-4 mr-1.5 animate-spin" />
                ) : (
                  <FileDown className="size-4 mr-1.5" />
                )}
                PDF
              </Button>
            </div>
          </div>
          {!canDownload && (
            <div className="mt-3 pt-3 border-t border-amber-500/20">
              <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                ⚠️ {errorCount} error mencegah download:
              </p>
              <ul className="mt-1 space-y-0.5">
                {validation.issues.filter((i) => i.severity === 'error').slice(0, 3).map((issue, i) => (
                  <li key={i} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                    <span className="shrink-0">•</span>
                    <span>{issue.message}</span>
                  </li>
                ))}
                {errorCount > 3 && (
                  <li className="text-xs text-amber-600 dark:text-amber-400 italic">
                    + {errorCount - 3} error lainnya...
                  </li>
                )}
              </ul>
            </div>
          )}
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
