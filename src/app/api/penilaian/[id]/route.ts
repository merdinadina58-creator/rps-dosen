import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { nama, bobot, bentuk, keterangan, urutan } = body

    const existing = await db.komponenPenilaian.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Komponen penilaian tidak ditemukan' }, { status: 404 })
    }

    const penilaian = await db.komponenPenilaian.update({
      where: { id },
      data: {
        nama: nama ?? existing.nama,
        bobot: bobot != null ? Number(bobot) : existing.bobot,
        bentuk: bentuk ?? null,
        keterangan: keterangan ?? null,
        urutan: urutan != null ? Number(urutan) : existing.urutan,
      },
    })
    return NextResponse.json(penilaian)
  } catch (error) {
    console.error('PUT /api/penilaian/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui komponen penilaian' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const existing = await db.komponenPenilaian.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Komponen penilaian tidak ditemukan' }, { status: 404 })
    }

    await db.komponenPenilaian.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/penilaian/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus komponen penilaian' }, { status: 500 })
  }
}
