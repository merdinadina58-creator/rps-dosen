import { NextRequest, NextResponse } from 'next/server'
import { generateCpmk, type GenerateCpmkInput } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<GenerateCpmkInput>

    const {
      namaMataKuliah,
      deskripsi,
      sks,
      prodi,
      semester,
      jumlahCpmk,
    } = body

    if (!namaMataKuliah || !deskripsi || !prodi || sks == null || semester == null) {
      return NextResponse.json(
        { error: 'namaMataKuliah, deskripsi, sks, prodi, semester wajib diisi' },
        { status: 400 }
      )
    }

    const result = await generateCpmk({
      namaMataKuliah,
      deskripsi,
      sks: Number(sks),
      prodi,
      semester: Number(semester),
      jumlahCpmk: jumlahCpmk ? Number(jumlahCpmk) : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('POST /api/ai/generate-cpmk error:', error)
    const message =
      error instanceof Error ? error.message : 'Gagal generate CPMK'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
