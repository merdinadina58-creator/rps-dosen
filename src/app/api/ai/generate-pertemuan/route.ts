import { NextRequest, NextResponse } from 'next/server'
import { generatePertemuan, type GeneratePertemuanInput } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<GeneratePertemuanInput>

    const { namaMataKuliah, deskripsi, sks, cpmkList, subCpmkList, jumlahPertemuan } = body

    if (!namaMataKuliah || !deskripsi || sks == null || !Array.isArray(cpmkList) || !Array.isArray(subCpmkList)) {
      return NextResponse.json(
        { error: 'namaMataKuliah, deskripsi, sks, cpmkList, subCpmkList wajib diisi' },
        { status: 400 }
      )
    }

    const result = await generatePertemuan({
      namaMataKuliah,
      deskripsi,
      sks: Number(sks),
      cpmkList,
      subCpmkList,
      jumlahPertemuan: jumlahPertemuan ? Number(jumlahPertemuan) : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('POST /api/ai/generate-pertemuan error:', error)
    const message =
      error instanceof Error ? error.message : 'Gagal generate pertemuan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
