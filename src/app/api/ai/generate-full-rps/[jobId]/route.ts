import { NextResponse } from 'next/server'
import { getJob, deleteJob } from '@/lib/ai-job-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic' // always fresh — never cached

/**
 * Poll endpoint for async AI generation status.
 * Client calls this every 2-3s after POST /api/ai/generate-full-rps returns a jobId.
 *
 * Response shape:
 *   - pending/running: { status, progress, progressLabel }
 *   - done: { status: 'done', progress: 100, result: {...} }
 *   - error: { status: 'error', error: '...' }
 *   - not found: 404 { error: 'Job not found or expired' }
 *
 * Done jobs are auto-deleted after being read once to free memory.
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
