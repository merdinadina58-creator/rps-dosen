import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const dosenId = searchParams.get('dosenId')
    const prodi = searchParams.get('prodi')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (dosenId) where.dosenId = dosenId
    if (prodi) where.mataKuliah = { prodi }

    const rps = await db.rps.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        mataKuliah: true,
        dosen: true,
        _count: {
          select: {
            cpmk: true,
            pertemuan: true,
            referensi: true,
            penilaian: true,
          },
        },
      },
    })
    return NextResponse.json(rps)
  } catch (error) {
    console.error('GET /api/rps error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data RPS' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      judul,
      tahunAjaran,
      semester,
      kelas,
      mataKuliahId,
      dosenId,
      deskripsi,
      cpl,
      mingguPertemuan,
      status,
      kurikulum,
    } = body

    if (!judul || !tahunAjaran || !semester || !mataKuliahId || !dosenId) {
      return NextResponse.json(
        { error: 'Judul, tahun ajaran, semester, mata kuliah, dan dosen wajib diisi' },
        { status: 400 }
      )
    }

    const rps = await db.rps.create({
      data: {
        judul,
        tahunAjaran,
        semester,
        kelas: kelas || null,
        mataKuliahId,
        dosenId,
        deskripsi: deskripsi || null,
        cpl: cpl || null,
        mingguPertemuan: mingguPertemuan ? Number(mingguPertemuan) : 16,
        status: status || 'draft',
        kurikulum: kurikulum || 'MBKM',
      },
      include: {
        mataKuliah: true,
        dosen: true,
      },
    })
    return NextResponse.json(rps, { status: 201 })
  } catch (error) {
    console.error('POST /api/rps error:', error)
    return NextResponse.json({ error: 'Gagal membuat RPS' }, { status: 500 })
  }
}
