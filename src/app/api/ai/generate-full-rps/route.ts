import { NextResponse } from 'next/server'
import { generateFullRps, type GenerateFullRpsInput } from '@/lib/ai'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateFullRpsInput

    if (!body.namaMataKuliah || !body.prodi || !body.deskripsiMataKuliah) {
      return NextResponse.json(
        { error: 'namaMataKuliah, deskripsiMataKuliah, dan prodi wajib diisi' },
        { status: 400 }
      )
    }

    const result = await generateFullRps(body)

    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal generate RPS'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
