import { NextResponse } from 'next/server'
import { getJob, deleteJob } from '@/lib/ai-job-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // always fresh — never cached

/**
 * Generic AI job status endpoint (shared by all async AI endpoints).
 * Client polls this every 2-3s after any POST /api/ai/generate-* returns a jobId.
 *
 * Works for: generate-full-rps, generate-cpmk, generate-pertemuan, generate-referensi.
 * All endpoints use the same in-memory job store (src/lib/ai-job-store.ts).
 *
 * Response shape:
 *   - pending/running: { status, progress, progressLabel }
 *   - done: { status: 'done', progress: 100, result: {...} }
 *   - error: { status: 'error', error: '...' }
 *   - not found: 404 { error: 'Job not found or expired' }
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  const job = getJob(jobId)

  if (!job) {
    return NextResponse.json(
      { status: 'error', error: 'Job tidak ditemukan atau sudah kedaluwarsa' },
      { status: 404 }
    )
  }

  const response: Record<string, unknown> = {
    status: job.status,
    progress: job.progress,
    progressLabel: job.progressLabel,
  }

  if (job.status === 'done' && job.result) {
    response.result = job.result
    // Clean up — client has the result now
    deleteJob(jobId)
  } else if (job.status === 'error') {
    response.error = job.error
    deleteJob(jobId)
  }

  return NextResponse.json(response)
}
