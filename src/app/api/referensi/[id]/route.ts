import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { jenis, judul, pengarang, penerbit, tahun, isbn, url, isUtama, urutan } = body

    const existing = await db.referensi.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Referensi tidak ditemukan' }, { status: 404 })
    }

    const referensi = await db.referensi.update({
      where: { id },
      data: {
        jenis: jenis ?? existing.jenis,
        judul: judul ?? existing.judul,
        pengarang: pengarang ?? null,
        penerbit: penerbit ?? null,
        tahun: tahun ?? null,
        isbn: isbn ?? null,
        url: url ?? null,
        isUtama: isUtama != null ? Boolean(isUtama) : existing.isUtama,
        urutan: urutan != null ? Number(urutan) : existing.urutan,
      },
    })
    return NextResponse.json(referensi)
  } catch (error) {
    console.error('PUT /api/referensi/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui referensi' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const existing = await db.referensi.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Referensi tidak ditemukan' }, { status: 404 })
    }

    await db.referensi.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/referensi/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus referensi' }, { status: 500 })
  }
}
