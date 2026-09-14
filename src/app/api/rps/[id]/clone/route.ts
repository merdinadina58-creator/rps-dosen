import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

interface CloneBody {
  tahunAjaran: string
  semester: string
  kelas?: string | null
  judul?: string // optional custom judul; if not provided, auto-derive
}

/**
 * Clone an existing RPS to create a new one for the next semester.
 * Copies ALL relations: CPMK + Sub-CPMK, Pertemuan, Referensi, Komponen Penilaian.
 * The new RPS starts with status="draft" so the dosen can review/adjust before finalizing.
 *
 * Why: Dosen often need to create RPS for a new semester based on last semester's.
 * Cloning saves 30-60 minutes of manual re-entry vs creating from scratch.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceRpsId } = await params
    const body = (await request.json()) as CloneBody

    if (!body.tahunAjaran || !body.semester) {
      return NextResponse.json(
        { error: 'tahunAjaran dan semester wajib diisi' },
        { status: 400 }
      )
    }

    // Load source RPS with ALL relations
    const source = await db.rps.findUnique({
      where: { id: sourceRpsId },
      include: {
        mataKuliah: true,
        dosen: true,
        cpmk: { include: { subCpmk: true }, orderBy: { urutan: 'asc' } },
        pertemuan: { orderBy: { urutan: 'asc' } },
        referensi: { orderBy: { urutan: 'asc' } },
        penilaian: { orderBy: { urutan: 'asc' } },
      },
    })

    if (!source) {
      return NextResponse.json({ error: 'RPS sumber tidak ditemukan' }, { status: 404 })
    }

    // Derive judul if not provided
    const mkNama = source.mataKuliah.nama
    const judul =
      body.judul?.trim() ||
      `RPS ${mkNama} - Semester ${body.semester} ${body.tahunAjaran}`

    // Create new RPS + all relations in a single transaction
    const cloned = await db.$transaction(async (tx) => {
      // 1. Create the new RPS shell
      const newRps = await tx.rps.create({
        data: {
          judul,
          tahunAjaran: body.tahunAjaran.trim(),
          semester: body.semester,
          kelas: body.kelas ?? null,
          mataKuliahId: source.mataKuliahId,
          dosenId: source.dosenId,
          deskripsi: source.deskripsi,
          cpl: source.cpl,
          mingguPertemuan: source.mingguPertemuan,
          status: 'draft', // always start as draft
          kurikulum: source.kurikulum,
        },
      })

      // 2. Copy CPMK + Sub-CPMK
      for (const cpmk of source.cpmk) {
        const newCpmk = await tx.cpmk.create({
          data: {
            rpsId: newRps.id,
            kode: cpmk.kode,
            deskripsi: cpmk.deskripsi,
            bobot: cpmk.bobot,
            urutan: cpmk.urutan,
          },
        })
        if (cpmk.subCpmk.length > 0) {
          await tx.subCpmk.createMany({
            data: cpmk.subCpmk.map((s) => ({
              cpmkId: newCpmk.id,
              kode: s.kode,
              deskripsi: s.deskripsi,
              urutan: s.urutan,
            })),
          })
        }
      }

      // 3. Copy Pertemuan
      if (source.pertemuan.length > 0) {
        for (const p of source.pertemuan) {
          await tx.pertemuan.create({
            data: {
              rpsId: newRps.id,
              mingguKe: p.mingguKe,
              subCpmkUtama: p.subCpmkUtama,
              materi: p.materi,
              metode: p.metode,
              aktivitasDosen: p.aktivitasDosen,
              aktivitasMhs: p.aktivitasMhs,
              pengalamanBelajar: p.pengalamanBelajar,
              indikatorPenilaian: p.indikatorPenilaian,
              bobotPenilaian: p.bobotPenilaian,
              estimasiWaktu: p.estimasiWaktu,
              urutan: p.urutan,
            },
          })
        }
      }

      // 4. Copy Referensi
      if (source.referensi.length > 0) {
        for (const r of source.referensi) {
          await tx.referensi.create({
            data: {
              rpsId: newRps.id,
              jenis: r.jenis,
              judul: r.judul,
              pengarang: r.pengarang,
              penerbit: r.penerbit,
              tahun: r.tahun,
              isbn: r.isbn,
              url: r.url,
              isUtama: r.isUtama,
              urutan: r.urutan,
            },
          })
        }
      }

      // 5. Copy Komponen Penilaian
      if (source.penilaian.length > 0) {
        for (const p of source.penilaian) {
          await tx.komponenPenilaian.create({
            data: {
              rpsId: newRps.id,
              nama: p.nama,
              bobot: p.bobot,
              bentuk: p.bentuk,
              keterangan: p.keterangan,
              urutan: p.urutan,
            },
          })
        }
      }

      return newRps
    })

    // Return with relations for immediate UI use
    const fullCloned = await db.rps.findUnique({
      where: { id: cloned.id },
      include: {
        mataKuliah: true,
        dosen: true,
        _count: { select: { cpmk: true, pertemuan: true, referensi: true, penilaian: true } },
      },
    })

    return NextResponse.json(fullCloned, { status: 201 })
  } catch (error) {
    console.error('Clone RPS error:', error)
    const message = error instanceof Error ? error.message : 'Gagal meng-clone RPS'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
