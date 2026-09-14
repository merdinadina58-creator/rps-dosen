import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const prodi = searchParams.get('prodi')

    const mataKuliah = await db.mataKuliah.findMany({
      where: prodi ? { prodi } : undefined,
      orderBy: [{ prodi: 'asc' }, { kode: 'asc' }],
      include: {
        _count: { select: { rps: true } },
      },
    })
    return NextResponse.json(mataKuliah)
  } catch (error) {
    console.error('GET /api/mata-kuliah error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data mata kuliah' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { kode, nama, sks, semester, prodi, deskripsi, prasyarat } = body

    if (!kode || !nama || !prodi || sks == null || semester == null) {
      return NextResponse.json(
        { error: 'Kode, nama, sks, semester, dan prodi wajib diisi' },
        { status: 400 }
      )
    }

    const mk = await db.mataKuliah.create({
      data: {
        kode,
        nama,
        sks: Number(sks),
        semester: Number(semester),
        prodi,
        deskripsi: deskripsi || null,
        prasyarat: prasyarat || null,
      },
    })
    return NextResponse.json(mk, { status: 201 })
  } catch (error) {
    console.error('POST /api/mata-kuliah error:', error)
    const message =
      error instanceof Error && error.message.includes('Unique')
        ? 'Kode mata kuliah sudah ada'
        : 'Gagal membuat mata kuliah'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
