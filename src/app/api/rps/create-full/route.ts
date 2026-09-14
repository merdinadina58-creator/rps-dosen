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
  // Optional institusi/otorisasi (from manual input)
  universitas?: string
  fakultas?: string
  kodeDokumen?: string
  tglPenyusunan?: string
  otorisasiDosenPengembang?: string
  otorisasiKoordinatorRmk?: string
  otorisasiKaprodi?: string
  // Konten hasil generate AI
  generated: GenerateFullRpsResult
}

const nullIfEmpty = (v: unknown): string | null =>
  v == null || (typeof v === 'string' && v.trim() === '') ? null : String(v)

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
      // 1. Create RPS with OBE fields
      const rps = await tx.rps.create({
        data: {
          judul: body.judul,
          tahunAjaran: body.tahunAjaran,
          semester: body.semester,
          kelas: body.kelas ?? null,
          mataKuliahId: body.mataKuliahId,
          dosenId: body.dosenId,
          deskripsi: nullIfEmpty(body.generated.deskripsi),
          deskripsiSingkat: nullIfEmpty(body.generated.deskripsiSingkat),
          bahanKajian: nullIfEmpty(body.generated.bahanKajian),
          cpl: nullIfEmpty(body.generated.cpl),
          mediaSoftware: nullIfEmpty(body.generated.mediaSoftware),
          mediaHardware: nullIfEmpty(body.generated.mediaHardware),
          teamTeaching: false,
          universitas: nullIfEmpty(body.universitas),
          fakultas: nullIfEmpty(body.fakultas),
          kodeDokumen: nullIfEmpty(body.kodeDokumen),
          tglPenyusunan:
            body.tglPenyusunan != null && body.tglPenyusunan !== ''
              ? new Date(body.tglPenyusunan)
              : new Date(),
          otorisasiDosenPengembang: nullIfEmpty(body.otorisasiDosenPengembang) ?? dosen.nama,
          otorisasiKoordinatorRmk: nullIfEmpty(body.otorisasiKoordinatorRmk),
          otorisasiKaprodi: nullIfEmpty(body.otorisasiKaprodi),
          mingguPertemuan: body.generated.pertemuan.length || 16,
          status: body.status || 'draft',
          kurikulum: body.kurikulum || 'OBE',
        },
      })

      // 2. Create CPMK + Sub-CPMK (track IDs for korelasi mapping)
      const cplProdiIdMap = new Map<string, string>()
      const subCpmkIdMap = new Map<string, string>()

      // 2a. Create CPL Prodi records
      if (body.generated.cplProdi && body.generated.cplProdi.length > 0) {
        for (let i = 0; i < body.generated.cplProdi.length; i++) {
          const cpl = body.generated.cplProdi[i]
          const createdCpl = await tx.cplProdi.create({
            data: {
              rpsId: rps.id,
              kode: cpl.kode,
              deskripsi: cpl.deskripsi,
              urutan: i + 1,
            },
          })
          cplProdiIdMap.set(cpl.kode, createdCpl.id)
        }
      }

      // 2b. Create CPMK + Sub-CPMK
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
          for (let j = 0; j < c.subCpmk.length; j++) {
            const s = c.subCpmk[j]
            const sub = await tx.subCpmk.create({
              data: {
                cpmkId: cpmk.id,
                kode: s.kode,
                deskripsi: s.deskripsi,
                urutan: j + 1,
              },
            })
            subCpmkIdMap.set(s.kode, sub.id)
          }
        }
      }

      // 2c. Create Korelasi CPL -> Sub-CPMK
      if (body.generated.korelasi && body.generated.korelasi.length > 0) {
        for (let i = 0; i < body.generated.korelasi.length; i++) {
          const k = body.generated.korelasi[i]
          const cplProdiId = cplProdiIdMap.get(k.cplKode) ?? null
          const subCpmkId = subCpmkIdMap.get(k.subCpmkKode) ?? null
          await tx.korelasiCplSubCpmk.create({
            data: {
              rpsId: rps.id,
              cplProdiId,
              subCpmkId,
              subCpmkKode: k.subCpmkKode,
              bobot: k.bobot,
              jumlahMinggu: Number(k.jumlahMinggu) || 0,
              urutan: i + 1,
            },
          })
        }
      }

      // 3. Create Pertemuan with OBE fields
      if (body.generated.pertemuan.length > 0) {
        const sortedP = [...body.generated.pertemuan].sort((a, b) => a.mingguKe - b.mingguKe)
        for (let i = 0; i < sortedP.length; i++) {
          const p = sortedP[i]
          await tx.pertemuan.create({
            data: {
              rpsId: rps.id,
              mingguKe: p.mingguKe,
              subCpmkUtama: nullIfEmpty(p.subCpmkKode),
              kemampuanAkhir: nullIfEmpty(p.kemampuanAkhir),
              indikator: nullIfEmpty(p.indikator),
              teknikPenilaian: nullIfEmpty(p.teknikPenilaian),
              kriteriaPenilaian: nullIfEmpty(p.kriteriaPenilaian),
              tmDaring: nullIfEmpty(p.tmDaring),
              materi: nullIfEmpty(p.materi),
              metode: nullIfEmpty(p.metode),
              aktivitasDosen: nullIfEmpty(p.aktivitasDosen),
              aktivitasMhs: nullIfEmpty(p.aktivitasMhs),
              pengalamanBelajar: nullIfEmpty(p.pengalamanBelajar),
              indikatorPenilaian: nullIfEmpty(p.indikatorPenilaian),
              bobotPenilaian: Number(p.bobotPenilaian) || 0,
              estimasiWaktu: nullIfEmpty(p.estimasiWaktu) ?? '150 menit',
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
              bentuk: nullIfEmpty(p.bentuk),
              keterangan: nullIfEmpty(p.keterangan),
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
              pengarang: nullIfEmpty(r.pengarang),
              penerbit: nullIfEmpty(r.penerbit),
              tahun: nullIfEmpty(r.tahun),
              url: nullIfEmpty(r.url),
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
