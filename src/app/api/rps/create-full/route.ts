import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { GenerateFullRpsResult } from '@/lib/ai'

export const runtime = 'nodejs'

interface CreateFullRpsBody {
  // Identitas RPS
  mataKuliahId: string
  dosenId: string
  tahunAjaran: string
  semester: string
  kelas?: string | null
  judul: string
  kurikulum?: string
  status?: string
  // Konten hasil generate AI
  generated: GenerateFullRpsResult
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateFullRpsBody

    // Validasi
    if (!body.mataKuliahId || !body.dosenId || !body.tahunAjaran || !body.semester || !body.judul) {
      return NextResponse.json(
        { error: 'mataKuliahId, dosenId, tahunAjaran, semester, dan judul wajib diisi' },
        { status: 400 }
      )
    }
    if (!body.generated || !body.generated.cpmk || body.generated.cpmk.length === 0) {
      return NextResponse.json(
        { error: 'Data hasil generate AI tidak lengkap' },
        { status: 400 }
      )
    }

    // Verify mata kuliah & dosen exist
    const [mataKuliah, dosen] = await Promise.all([
      db.mataKuliah.findUnique({ where: { id: body.mataKuliahId } }),
      db.dosen.findUnique({ where: { id: body.dosenId } }),
    ])
    if (!mataKuliah) {
      return NextResponse.json({ error: 'Mata kuliah tidak ditemukan' }, { status: 404 })
    }
    if (!dosen) {
      return NextResponse.json({ error: 'Dosen tidak ditemukan' }, { status: 404 })
    }

    // Create RPS + all relations in a transaction
    const created = await db.$transaction(async (tx) => {
      // 1. Create RPS
      const rps = await tx.rps.create({
        data: {
          judul: body.judul,
          tahunAjaran: body.tahunAjaran,
          semester: body.semester,
          kelas: body.kelas ?? null,
          mataKuliahId: body.mataKuliahId,
          dosenId: body.dosenId,
          deskripsi: body.generated.deskripsi || null,
          cpl: body.generated.cpl || null,
          mingguPertemuan: body.generated.pertemuan.length || 16,
          status: body.status || 'draft',
          kurikulum: body.kurikulum || 'MBKM',
        },
      })

      // 2. Create CPMK + Sub-CPMK
      for (let i = 0; i < body.generated.cpmk.length; i++) {
        const c = body.generated.cpmk[i]
        const cpmk = await tx.cpmk.create({
          data: {
            rpsId: rps.id,
            kode: c.kode,
            deskripsi: c.deskripsi,
            urutan: i + 1,
          },
        })
        if (c.subCpmk && c.subCpmk.length > 0) {
          await tx.subCpmk.createMany({
            data: c.subCpmk.map((s, j) => ({
              cpmkId: cpmk.id,
              kode: s.kode,
              deskripsi: s.deskripsi,
              urutan: j + 1,
            })),
          })
        }
      }

      // 3. Create Pertemuan
      if (body.generated.pertemuan.length > 0) {
        const sortedP = [...body.generated.pertemuan].sort((a, b) => a.mingguKe - b.mingguKe)
        for (let i = 0; i < sortedP.length; i++) {
          const p = sortedP[i]
          await tx.pertemuan.create({
            data: {
              rpsId: rps.id,
              mingguKe: p.mingguKe,
              materi: p.materi || null,
              metode: p.metode || null,
              aktivitasDosen: p.aktivitasDosen || null,
              aktivitasMhs: p.aktivitasMhs || null,
              pengalamanBelajar: p.pengalamanBelajar || null,
              indikatorPenilaian: p.indikatorPenilaian || null,
              bobotPenilaian: Number(p.bobotPenilaian) || 0,
              estimasiWaktu: p.estimasiWaktu || '150 menit',
              urutan: i + 1,
            },
          })
        }
      }

      // 4. Create Komponen Penilaian
      if (body.generated.penilaian.length > 0) {
        for (let i = 0; i < body.generated.penilaian.length; i++) {
          const p = body.generated.penilaian[i]
          await tx.komponenPenilaian.create({
            data: {
              rpsId: rps.id,
              nama: p.nama,
              bobot: Number(p.bobot) || 0,
              bentuk: p.bentuk || null,
              keterangan: p.keterangan || null,
              urutan: i + 1,
            },
          })
        }
      }

      // 5. Create Referensi
      if (body.generated.referensi.length > 0) {
        // urutkan: utama dulu
        const sorted = [...body.generated.referensi].sort(
          (a, b) => Number(b.isUtama) - Number(a.isUtama)
        )
        for (let i = 0; i < sorted.length; i++) {
          const r = sorted[i]
          await tx.referensi.create({
            data: {
              rpsId: rps.id,
              jenis: r.jenis || 'buku',
              judul: r.judul,
              pengarang: r.pengarang || null,
              penerbit: r.penerbit || null,
              tahun: r.tahun || null,
              url: r.url || null,
              isUtama: !!r.isUtama,
              urutan: i + 1,
            },
          })
        }
      }

      return rps
    })

    // Return with relations for immediate use
    const fullRps = await db.rps.findUnique({
      where: { id: created.id },
      include: {
        mataKuliah: true,
        dosen: true,
        _count: { select: { cpmk: true, pertemuan: true, referensi: true, penilaian: true } },
      },
    })

    return NextResponse.json(fullRps, { status: 201 })
  } catch (error) {
    console.error('Create full RPS error:', error)
    const message = error instanceof Error ? error.message : 'Gagal membuat RPS'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
