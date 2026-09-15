import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET: list CPL Prodi for an RPS
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const rps = await db.rps.findUnique({ where: { id }, select: { id: true } })
    if (!rps) {
      return NextResponse.json({ error: 'RPS tidak ditemukan' }, { status: 404 })
    }
    const cplProdi = await db.cplProdi.findMany({
      where: { rpsId: id },
      orderBy: { urutan: 'asc' },
      include: { korelasi: true },
    })
    return NextResponse.json(cplProdi)
  } catch (error) {
    console.error('GET /api/rps/[id]/cpl-prodi error:', error)
    return NextResponse.json({ error: 'Gagal mengambil CPL Prodi' }, { status: 500 })
  }
}

// POST: create a new CPL Prodi entry
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { kode, deskripsi, urutan } = body

    if (!kode || !deskripsi) {
      return NextResponse.json(
        { error: 'kode dan deskripsi CPL wajib diisi' },
        { status: 400 }
      )
    }

    const rps = await db.rps.findUnique({ where: { id }, select: { id: true } })
    if (!rps) {
      return NextResponse.json({ error: 'RPS tidak ditemukan' }, { status: 404 })
    }

    let nextUrutan = urutan
    if (nextUrutan == null) {
      const last = await db.cplProdi.aggregate({
        where: { rpsId: id },
        _max: { urutan: true },
      })
      nextUrutan = (last._max.urutan ?? 0) + 1
    }

    const created = await db.cplProdi.create({
      data: {
        rpsId: id,
        kode,
        deskripsi,
        urutan: Number(nextUrutan),
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST /api/rps/[id]/cpl-prodi error:', error)
    return NextResponse.json({ error: 'Gagal membuat CPL Prodi' }, { status: 500 })
  }
}
