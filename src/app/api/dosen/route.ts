import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const dosen = await db.dosen.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { rps: true } },
      },
    })
    return NextResponse.json(dosen)
  } catch (error) {
    console.error('GET /api/dosen error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data dosen' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nama, nip, email, telepon, prodi, jabatan } = body

    if (!nama || !prodi) {
      return NextResponse.json(
        { error: 'Nama dan prodi wajib diisi' },
        { status: 400 }
      )
    }

    const dosen = await db.dosen.create({
      data: {
        nama,
        nip: nip || null,
        email: email || null,
        telepon: telepon || null,
        prodi,
        jabatan: jabatan || null,
      },
    })
    return NextResponse.json(dosen, { status: 201 })
  } catch (error) {
    console.error('POST /api/dosen error:', error)
    const message =
      error instanceof Error && error.message.includes('Unique')
        ? 'NIP atau email sudah terdaftar'
        : 'Gagal membuat dosen'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
