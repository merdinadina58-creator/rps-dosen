import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const rps = await db.rps.findUnique({
      where: { id },
      include: {
        mataKuliah: true,
        dosen: true,
        cpmk: {
          orderBy: { urutan: 'asc' },
          include: {
            subCpmk: { orderBy: { urutan: 'asc' } },
          },
        },
        pertemuan: {
          orderBy: { urutan: 'asc' },
          include: {
            cpmk: { include: { cpmk: true } },
            subCpmk: { include: { subCpmk: true } },
          },
        },
        referensi: { orderBy: { urutan: 'asc' } },
        penilaian: { orderBy: { urutan: 'asc' } },
      },
    })

    if (!rps) {
      return NextResponse.json({ error: 'RPS tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(rps)
  } catch (error) {
    console.error('GET /api/rps/[id] error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data RPS' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      judul,
      tahunAjaran,
      semester,
      kelas,
      deskripsi,
      cpl,
      mingguPertemuan,
      status,
      kurikulum,
      mataKuliahId,
      dosenId,
    } = body

    const existing = await db.rps.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'RPS tidak ditemukan' }, { status: 404 })
    }

    const rps = await db.rps.update({
      where: { id },
      data: {
        judul: judul ?? existing.judul,
        tahunAjaran: tahunAjaran ?? existing.tahunAjaran,
        semester: semester ?? existing.semester,
        kelas: kelas ?? null,
        deskripsi: deskripsi ?? null,
        cpl: cpl ?? null,
        mingguPertemuan:
          mingguPertemuan != null ? Number(mingguPertemuan) : existing.mingguPertemuan,
        status: status ?? existing.status,
        kurikulum: kurikulum ?? existing.kurikulum,
        mataKuliahId: mataKuliahId ?? existing.mataKuliahId,
        dosenId: dosenId ?? existing.dosenId,
      },
    })
    return NextResponse.json(rps)
  } catch (error) {
    console.error('PUT /api/rps/[id] error:', error)
    return NextResponse.json({ error: 'Gagal memperbarui RPS' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const existing = await db.rps.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'RPS tidak ditemukan' }, { status: 404 })
    }

    await db.rps.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/rps/[id] error:', error)
    return NextResponse.json({ error: 'Gagal menghapus RPS' }, { status: 500 })
  }
}
