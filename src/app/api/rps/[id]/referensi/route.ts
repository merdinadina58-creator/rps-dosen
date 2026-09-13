import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const referensi = await db.referensi.findMany({
      where: { rpsId: id },
      orderBy: [{ isUtama: 'desc' }, { urutan: 'asc' }],
    })
    return NextResponse.json(referensi)
  } catch (error) {
    console.error('GET /api/rps/[id]/referensi error:', error)
    return NextResponse.json({ error: 'Gagal mengambil referensi' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { jenis, judul, pengarang, penerbit, tahun, isbn, url, isUtama, urutan } = body

    if (!judul) {
      return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 })
    }

    const rps = await db.rps.findUnique({ where: { id } })
    if (!rps) {
      return NextResponse.json({ error: 'RPS tidak ditemukan' }, { status: 404 })
    }

    let nextUrutan = urutan
    if (nextUrutan == null) {
      const last = await db.referensi.aggregate({
        where: { rpsId: id },
        _max: { urutan: true },
      })
      nextUrutan = (last._max.urutan ?? 0) + 1
    }

    const referensi = await db.referensi.create({
      data: {
        rpsId: id,
        jenis: jenis || 'buku',
        judul,
        pengarang: pengarang || null,
        penerbit: penerbit || null,
        tahun: tahun || null,
        isbn: isbn || null,
        url: url || null,
        isUtama: Boolean(isUtama),
        urutan: Number(nextUrutan),
      },
    })
    return NextResponse.json(referensi, { status: 201 })
  } catch (error) {
    console.error('POST /api/rps/[id]/referensi error:', error)
    return NextResponse.json({ error: 'Gagal membuat referensi' }, { status: 500 })
  }
}
