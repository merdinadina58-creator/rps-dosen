import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, { params }: Params) {
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

    const existing = await db.pertemuan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Pertemuan tidak ditemukan' }, { status: 404 })
    }

    const pertemuan = await db.pertemuan.update({
      where: { id },
      data: {
        mingguKe: mingguKe != null ? Number(mingguKe) : existing.mingguKe,
        materi: materi ?? null,
        metode: metode ?? null,
        aktivitasDosen: aktivitasDosen ?? null,
        aktivitasMhs: aktivitasMhs ?? null,
        pengalamanBelajar: pengalamanBelajar ?? null,
        indikatorPenilaian: indikatorPenilaian ?? null,
        bobotPenilaian:
          bobotPenilaian != null ? Number(bobotPenilaian) : existing.bobotPenilaian,
        estimasiWaktu: estimasiWaktu ?? null,
        urutan: urutan != null ? Number(urutan) : existing.urutan,
        subCpmkUtama: subCpmkUtama ?? null,
      },
    })
    return NextResponse.json(pertemuan)
  } catch (error) {
    console.error('PUT /api/pertemuan/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui pertemuan' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const existing = await db.pertemuan.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Pertemuan tidak ditemukan' }, { status: 404 })
    }

    await db.pertemuan.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/pertemuan/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus pertemuan' }, { status: 500 })
  }
}
