import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { kode, deskripsi, urutan } = body

    const existing = await db.subCpmk.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Sub-CPMK tidak ditemukan' }, { status: 404 })
    }

    const subCpmk = await db.subCpmk.update({
      where: { id },
      data: {
        kode: kode ?? existing.kode,
        deskripsi: deskripsi ?? existing.deskripsi,
        urutan: urutan != null ? Number(urutan) : existing.urutan,
      },
    })
    return NextResponse.json(subCpmk)
  } catch (error) {
    console.error('PUT /api/sub-cpmk/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui Sub-CPMK' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const existing = await db.subCpmk.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Sub-CPMK tidak ditemukan' }, { status: 404 })
    }

    await db.subCpmk.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/sub-cpmk/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus Sub-CPMK' }, { status: 500 })
  }
}
