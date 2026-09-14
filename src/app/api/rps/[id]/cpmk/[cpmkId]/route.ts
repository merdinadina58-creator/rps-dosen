import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string; cpmkId: string }>
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id, cpmkId } = await params
    const body = await req.json()
    const { kode, deskripsi, urutan, bobot } = body

    const existing = await db.cpmk.findFirst({
      where: { id: cpmkId, rpsId: id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'CPMK tidak ditemukan' }, { status: 404 })
    }

    const cpmk = await db.cpmk.update({
      where: { id: cpmkId },
      data: {
        kode: kode ?? existing.kode,
        deskripsi: deskripsi ?? existing.deskripsi,
        urutan: urutan != null ? Number(urutan) : existing.urutan,
        bobot: bobot != null ? Number(bobot) : existing.bobot,
      },
      include: { subCpmk: { orderBy: { urutan: 'asc' } } },
    })
    return NextResponse.json(cpmk)
  } catch (error) {
    console.error('PUT /api/rps/[id]/cpmk/[cpmkId] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui CPMK' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, cpmkId } = await params
    const existing = await db.cpmk.findFirst({
      where: { id: cpmkId, rpsId: id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'CPMK tidak ditemukan' }, { status: 404 })
    }

    // Cascade handled by Prisma onDelete: Cascade for subCpmk, PertemuanCpmk
    await db.cpmk.delete({ where: { id: cpmkId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/rps/[id]/cpmk/[cpmkId] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus CPMK' }, { status: 500 })
  }
}
