import { NextRequest, NextResponse } from 'next/server'
import { generateReferensi, type GenerateReferensiInput } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<GenerateReferensiInput>

    const { namaMataKuliah, deskripsi, prodi } = body

    if (!namaMataKuliah || !deskripsi || !prodi) {
      return NextResponse.json(
        { error: 'namaMataKuliah, deskripsi, prodi wajib diisi' },
        { status: 400 }
      )
    }

    const result = await generateReferensi({
      namaMataKuliah,
      deskripsi,
      prodi,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('POST /api/ai/generate-referensi error:', error)
    const message =
      error instanceof Error ? error.message : 'Gagal generate referensi'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
