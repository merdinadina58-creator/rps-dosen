import { NextRequest, NextResponse } from 'next/server'
import { generateRpsDocxOBE, generateRpsDocx, convertDocxToPdf, loadRpsForExport } from '@/lib/export'

interface Params {
  params: Promise<{ id: string }>
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '')
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const format = (searchParams.get('format') || 'docx').toLowerCase()

    if (format !== 'docx' && format !== 'pdf') {
      return NextResponse.json(
        { error: 'format harus docx atau pdf' },
        { status: 400 }
      )
    }

    // Verify RPS exists & load for naming
    const data = await loadRpsForExport(id)
    const filename = sanitizeFilename(`RPS-${data.mataKuliah.kode}-${data.mataKuliah.nama}`)

    // Try OBE template-filling (Python) first — gives exact template match
    // Fall back to docx-js (Node.js) if Python not available (e.g., on Vercel serverless)
    let docxBuffer: Buffer
    try {
      docxBuffer = await generateRpsDocxOBE(id)
    } catch (obeError) {
      console.log('[Export] OBE template approach failed, falling back to docx-js:', obeError instanceof Error ? obeError.message : obeError)
      docxBuffer = await generateRpsDocx(id)
    }

    if (format === 'docx') {
      return new NextResponse(docxBuffer, {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${filename}.docx"`,
        },
      })
    }

    // PDF
    const pdfBuffer = await convertDocxToPdf(docxBuffer, filename)
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}.pdf"`,
      },
    })
  } catch (error) {
    console.error('GET /api/rps/[id]/export error:', error)
    const message =
      error instanceof Error ? error.message : 'Gagal export RPS'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
