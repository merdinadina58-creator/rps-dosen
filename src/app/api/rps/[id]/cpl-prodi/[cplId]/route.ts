import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string; cplId: string }>
}

// PUT: update a CPL Prodi entry
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id, cplId } = await params
    const body = await req.json()
    const { kode, deskripsi, urutan } = body

    const existing = await db.cplProdi.findUnique({ where: { id: cplId } })
    if (!existing || existing.rpsId !== id) {
      return NextResponse.json({ error: 'CPL Prodi tidak ditemukan' }, { status: 404 })
    }

    const updated = await db.cplProdi.update({
      where: { id: cplId },
      data: {
        kode: kode ?? existing.kode,
        deskripsi: deskripsi ?? existing.deskripsi,
        urutan: urutan != null ? Number(urutan) : existing.urutan,
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/rps/[id]/cpl-prodi/[cplId] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui CPL Prodi' }, { status: 500 })
  }
}

// DELETE: remove a CPL Prodi entry (cascades korelasi.cplProdiId to null)
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, cplId } = await params
    const existing = await db.cplProdi.findUnique({ where: { id: cplId } })
    if (!existing || existing.rpsId !== id) {
      return NextResponse.json({ error: 'CPL Prodi tidak ditemukan' }, { status: 404 })
    }
    await db.cplProdi.delete({ where: { id: cplId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/rps/[id]/cpl-prodi/[cplId] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus CPL Prodi' }, { status: 500 })
  }
}
