import { NextRequest, NextResponse } from 'next/server'
import { askAssistant } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { question?: string; context?: string }

    if (!body.question || typeof body.question !== 'string') {
      return NextResponse.json(
        { error: 'question wajib diisi' },
        { status: 400 }
      )
    }

    const answer = await askAssistant(body.question, body.context)

    return NextResponse.json({ answer })
  } catch (error) {
    console.error('POST /api/ai/assistant error:', error)
    const message =
      error instanceof Error ? error.message : 'Gagal menghubungi AI assistant'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
