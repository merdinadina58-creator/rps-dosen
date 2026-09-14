import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const cpmk = await db.cpmk.findMany({
      where: { rpsId: id },
      orderBy: { urutan: 'asc' },
      include: { subCpmk: { orderBy: { urutan: 'asc' } } },
    })
    return NextResponse.json(cpmk)
  } catch (error) {
    console.error('GET /api/rps/[id]/cpmk error:', error)
    return NextResponse.json({ error: 'Gagal mengambil CPMK' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { kode, deskripsi, urutan } = body

    if (!kode || !deskripsi) {
      return NextResponse.json(
        { error: 'Kode dan deskripsi wajib diisi' },
        { status: 400 }
      )
    }

    const rps = await db.rps.findUnique({ where: { id } })
    if (!rps) {
      return NextResponse.json({ error: 'RPS tidak ditemukan' }, { status: 404 })
    }

    // Determine next urutan if not provided
    let nextUrutan = urutan
    if (nextUrutan == null) {
      const last = await db.cpmk.aggregate({
        where: { rpsId: id },
        _max: { urutan: true },
      })
      nextUrutan = (last._max.urutan ?? 0) + 1
    }

    const cpmk = await db.cpmk.create({
      data: {
        rpsId: id,
        kode,
        deskripsi,
        urutan: Number(nextUrutan),
      },
      include: { subCpmk: true },
    })
    return NextResponse.json(cpmk, { status: 201 })
  } catch (error) {
    console.error('POST /api/rps/[id]/cpmk error:', error)
    return NextResponse.json({ error: 'Gagal membuat CPMK' }, { status: 500 })
  }
}
