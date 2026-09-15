import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string; korId: string }>
}

// PUT: update a Korelasi entry
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id, korId } = await params
    const body = await req.json()
    const { cplProdiId, subCpmkKode, subCpmkId, bobot, jumlahMinggu, urutan } = body

    const existing = await db.korelasiCplSubCpmk.findUnique({ where: { id: korId } })
    if (!existing || existing.rpsId !== id) {
      return NextResponse.json({ error: 'Korelasi tidak ditemukan' }, { status: 404 })
    }

    // Validate cplProdiId if provided and not null
    if (cplProdiId) {
      const cpl = await db.cplProdi.findUnique({ where: { id: cplProdiId } })
      if (!cpl || cpl.rpsId !== id) {
        return NextResponse.json(
          { error: 'CPL Prodi tidak ditemukan pada RPS ini' },
          { status: 400 }
        )
      }
    }

    const updated = await db.korelasiCplSubCpmk.update({
      where: { id: korId },
      data: {
        cplProdiId: cplProdiId !== undefined ? (cplProdiId || null) : existing.cplProdiId,
        subCpmkId: subCpmkId !== undefined ? (subCpmkId || null) : existing.subCpmkId,
        subCpmkKode: subCpmkKode !== undefined ? (subCpmkKode || null) : existing.subCpmkKode,
        bobot: bobot !== undefined ? (bobot || null) : existing.bobot,
        jumlahMinggu:
          jumlahMinggu != null ? Number(jumlahMinggu) : existing.jumlahMinggu,
        urutan: urutan != null ? Number(urutan) : existing.urutan,
      },
      include: { cplProdi: true },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/rps/[id]/korelasi/[korId] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui Korelasi' }, { status: 500 })
  }
}

// DELETE: remove a Korelasi entry
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id, korId } = await params
    const existing = await db.korelasiCplSubCpmk.findUnique({ where: { id: korId } })
    if (!existing || existing.rpsId !== id) {
      return NextResponse.json({ error: 'Korelasi tidak ditemukan' }, { status: 404 })
    }
    await db.korelasiCplSubCpmk.delete({ where: { id: korId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/rps/[id]/korelasi/[korId] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus Korelasi' }, { status: 500 })
  }
}
