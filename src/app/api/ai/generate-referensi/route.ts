import { NextResponse } from 'next/server'
import { generateReferensi, type GenerateReferensiInput } from '@/lib/ai'
import { createJob, updateJob, generateJobId } from '@/lib/ai-job-store'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * ASYNC: POST returns jobId immediately. Client polls GET /api/ai/job/[jobId].
 * Background: generateReferensi runs, updates job store, stores result when done.
 * Has built-in fallback (see generateReferensi in ai.ts) if AI fails repeatedly.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<GenerateReferensiInput>

    const { namaMataKuliah, deskripsi, prodi } = body

    if (!namaMataKuliah || !deskripsi || !prodi) {
      return NextResponse.json(
        { error: 'namaMataKuliah, deskripsi, prodi wajib diisi' },
        { status: 400 }
      )
    }

    const input: GenerateReferensiInput = { namaMataKuliah, deskripsi, prodi }

    const jobId = generateJobId()
    createJob(jobId)
    updateJob(jobId, { status: 'running', progress: 10, progressLabel: 'Mengumpulkan referensi bahan pustaka...' })

    void generateReferensi(input)
      .then((result) => {
        updateJob(jobId, {
          status: 'done',
          progress: 100,
          progressLabel: 'Selesai',
          result,
        })
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Gagal generate referensi'
        updateJob(jobId, {
          status: 'error',
          error: message,
          progressLabel: 'Gagal: ' + message,
        })
      })

    return NextResponse.json({ jobId, status: 'pending' }, { status: 202 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memulai generate referensi'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
