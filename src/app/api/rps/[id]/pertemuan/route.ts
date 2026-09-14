import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const pertemuan = await db.pertemuan.findMany({
      where: { rpsId: id },
      orderBy: { urutan: 'asc' },
      include: {
        cpmk: { include: { cpmk: true } },
        subCpmk: { include: { subCpmk: true } },
      },
    })
    return NextResponse.json(pertemuan)
  } catch (error) {
    console.error('GET /api/rps/[id]/pertemuan error:', error)
    return NextResponse.json({ error: 'Gagal mengambil pertemuan' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      mingguKe,
      materi,
      metode,
      aktivitasDosen,
      aktivitasMhs,
      pengalamanBelajar,
      indikatorPenilaian,
      bobotPenilaian,
      estimasiWaktu,
      urutan,
      subCpmkUtama,
    } = body

    if (mingguKe == null) {
      return NextResponse.json({ error: 'mingguKe wajib diisi' }, { status: 400 })
    }

    const rps = await db.rps.findUnique({ where: { id } })
    if (!rps) {
      return NextResponse.json({ error: 'RPS tidak ditemukan' }, { status: 404 })
    }

    let nextUrutan = urutan
    if (nextUrutan == null) {
      const last = await db.pertemuan.aggregate({
        where: { rpsId: id },
        _max: { urutan: true },
      })
      nextUrutan = (last._max.urutan ?? 0) + 1
    }

    const pertemuan = await db.pertemuan.create({
      data: {
        rpsId: id,
        mingguKe: Number(mingguKe),
        materi: materi || null,
        metode: metode || null,
        aktivitasDosen: aktivitasDosen || null,
        aktivitasMhs: aktivitasMhs || null,
        pengalamanBelajar: pengalamanBelajar || null,
        indikatorPenilaian: indikatorPenilaian || null,
        bobotPenilaian: bobotPenilaian != null ? Number(bobotPenilaian) : 0,
        estimasiWaktu: estimasiWaktu || null,
        subCpmkUtama: subCpmkUtama || null,
        urutan: Number(nextUrutan),
      },
    })
    return NextResponse.json(pertemuan, { status: 201 })
  } catch (error) {
    console.error('POST /api/rps/[id]/pertemuan error:', error)
    return NextResponse.json({ error: 'Gagal membuat pertemuan' }, { status: 500 })
  }
}
