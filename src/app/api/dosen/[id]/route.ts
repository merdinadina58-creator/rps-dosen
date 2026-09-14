import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const dosen = await db.dosen.findUnique({
      where: { id },
      include: {
        rps: {
          include: { mataKuliah: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { rps: true } },
      },
    })

    if (!dosen) {
      return NextResponse.json({ error: 'Dosen tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(dosen)
  } catch (error) {
    console.error('GET /api/dosen/[id] error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data dosen' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { nama, nip, email, telepon, prodi, jabatan } = body

    const existing = await db.dosen.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Dosen tidak ditemukan' }, { status: 404 })
    }

    const dosen = await db.dosen.update({
      where: { id },
      data: {
        nama: nama ?? existing.nama,
        nip: nip ?? null,
        email: email ?? null,
        telepon: telepon ?? null,
        prodi: prodi ?? existing.prodi,
        jabatan: jabatan ?? null,
      },
    })
    return NextResponse.json(dosen)
  } catch (error) {
    console.error('PUT /api/dosen/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui dosen' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const existing = await db.dosen.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Dosen tidak ditemukan' }, { status: 404 })
    }

    await db.dosen.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/dosen/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus dosen' }, { status: 500 })
  }
}
