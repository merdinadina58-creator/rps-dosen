import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
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

    const cpmk = await db.cpmk.findUnique({ where: { id } })
    if (!cpmk) {
      return NextResponse.json({ error: 'CPMK tidak ditemukan' }, { status: 404 })
    }

    let nextUrutan = urutan
    if (nextUrutan == null) {
      const last = await db.subCpmk.aggregate({
        where: { cpmkId: id },
        _max: { urutan: true },
      })
      nextUrutan = (last._max.urutan ?? 0) + 1
    }

    const subCpmk = await db.subCpmk.create({
      data: {
        cpmkId: id,
        kode,
        deskripsi,
        urutan: Number(nextUrutan),
      },
    })
    return NextResponse.json(subCpmk, { status: 201 })
  } catch (error) {
    console.error('POST /api/cpmk/[id]/sub-cpmk error:', error)
    return NextResponse.json({ error: 'Gagal membuat Sub-CPMK' }, { status: 500 })
  }
}
