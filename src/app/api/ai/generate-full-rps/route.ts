import { NextResponse } from 'next/server'
import { generateFullRps, type GenerateFullRpsInput } from '@/lib/ai'
import { createJob, updateJob, generateJobId } from '@/lib/ai-job-store'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes — background work runs beyond request lifecycle

/**
 * ASYNC generation: POST returns a jobId immediately (< 100ms).
 * The actual AI generation runs in the background and updates the job store.
 * Client polls GET /api/ai/generate-full-rps/[jobId] for status.
 *
 * This avoids 502 Bad Gateway from the preview environment's proxy which times out
 * on requests longer than ~30-60s. Each individual HTTP request here is fast.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateFullRpsInput

    if (!body.namaMataKuliah || !body.prodi || !body.deskripsiMataKuliah) {
      return NextResponse.json(
        { error: 'namaMataKuliah, deskripsiMataKuliah, dan prodi wajib diisi' },
        { status: 400 }
      )
    }

    const jobId = generateJobId()
    createJob(jobId)

    // Fire-and-forget: run generation in the background.
    // Errors are captured into the job store so the client can see them.
    void generateFullRps(body, (update) => {
      updateJob(jobId, {
        status: 'running',
        progress: update.progress,
        progressLabel: update.label,
      })
    })
      .then((result) => {
        updateJob(jobId, {
          status: 'done',
          progress: 100,
          progressLabel: 'Selesai',
          result,
        })
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Gagal generate RPS'
        updateJob(jobId, {
          status: 'error',
          error: message,
          progressLabel: 'Gagal: ' + message,
        })
      })

    return NextResponse.json({ jobId, status: 'pending' }, { status: 202 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memulai generate RPS'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
