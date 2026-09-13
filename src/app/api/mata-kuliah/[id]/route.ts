import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const mk = await db.mataKuliah.findUnique({
      where: { id },
      include: {
        rps: {
          include: { dosen: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { rps: true } },
      },
    })

    if (!mk) {
      return NextResponse.json({ error: 'Mata kuliah tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(mk)
  } catch (error) {
    console.error('GET /api/mata-kuliah/[id] error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data mata kuliah' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { kode, nama, sks, semester, prodi, deskripsi, prasyarat } = body

    const existing = await db.mataKuliah.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Mata kuliah tidak ditemukan' }, { status: 404 })
    }

    const mk = await db.mataKuliah.update({
      where: { id },
      data: {
        kode: kode ?? existing.kode,
        nama: nama ?? existing.nama,
        sks: sks != null ? Number(sks) : existing.sks,
        semester: semester != null ? Number(semester) : existing.semester,
        prodi: prodi ?? existing.prodi,
        deskripsi: deskripsi ?? null,
        prasyarat: prasyarat ?? null,
      },
    })
    return NextResponse.json(mk)
  } catch (error) {
    console.error('PUT /api/mata-kuliah/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui mata kuliah' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const existing = await db.mataKuliah.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Mata kuliah tidak ditemukan' }, { status: 404 })
    }

    await db.mataKuliah.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/mata-kuliah/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus mata kuliah' }, { status: 500 })
  }
}
