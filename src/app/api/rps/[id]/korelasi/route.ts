import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

// GET: list Korelasi CPL -> Sub-CPMK for an RPS
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const rps = await db.rps.findUnique({ where: { id }, select: { id: true } })
    if (!rps) {
      return NextResponse.json({ error: 'RPS tidak ditemukan' }, { status: 404 })
    }
    const korelasi = await db.korelasiCplSubCpmk.findMany({
      where: { rpsId: id },
      orderBy: { urutan: 'asc' },
      include: { cplProdi: true },
    })
    return NextResponse.json(korelasi)
  } catch (error) {
    console.error('GET /api/rps/[id]/korelasi error:', error)
    return NextResponse.json({ error: 'Gagal mengambil Korelasi' }, { status: 500 })
  }
}

// POST: create a new Korelasi entry
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { cplProdiId, subCpmkKode, subCpmkId, bobot, jumlahMinggu, urutan } = body

    if (!subCpmkKode && !subCpmkId) {
      return NextResponse.json(
        { error: 'subCpmkKode atau subCpmkId wajib diisi' },
        { status: 400 }
      )
    }

    const rps = await db.rps.findUnique({ where: { id }, select: { id: true } })
    if (!rps) {
      return NextResponse.json({ error: 'RPS tidak ditemukan' }, { status: 404 })
    }

    // Validate cplProdiId if provided
    if (cplProdiId) {
      const cpl = await db.cplProdi.findUnique({ where: { id: cplProdiId } })
      if (!cpl || cpl.rpsId !== id) {
        return NextResponse.json(
          { error: 'CPL Prodi tidak ditemukan pada RPS ini' },
          { status: 400 }
        )
      }
    }

    let nextUrutan = urutan
    if (nextUrutan == null) {
      const last = await db.korelasiCplSubCpmk.aggregate({
        where: { rpsId: id },
        _max: { urutan: true },
      })
      nextUrutan = (last._max.urutan ?? 0) + 1
    }

    const created = await db.korelasiCplSubCpmk.create({
      data: {
        rpsId: id,
        cplProdiId: cplProdiId || null,
        subCpmkId: subCpmkId || null,
        subCpmkKode: subCpmkKode || null,
        bobot: bobot ?? null,
        jumlahMinggu: Number(jumlahMinggu) || 0,
        urutan: Number(nextUrutan),
      },
      include: { cplProdi: true },
    })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST /api/rps/[id]/korelasi error:', error)
    return NextResponse.json({ error: 'Gagal membuat Korelasi' }, { status: 500 })
  }
}
