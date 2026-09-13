/**
 * In-memory job store for async AI generation tasks.
 * Stores job status & result so the client can poll via GET endpoint.
 *
 * Why: The /api/ai/generate-full-rps endpoint takes 50-70s (chained AI calls).
 * The preview environment's gateway/proxy returns 502 Bad Gateway if a request
 * takes longer than its timeout (~30-60s). By making generation async:
 *   - POST returns a jobId immediately (< 100ms) → no gateway timeout
 *   - Client polls GET /status/[jobId] every 3s → each poll is fast (< 50ms)
 *   - Background work continues uninterrupted in the Node.js process
 *
 * Jobs auto-expire after 10 minutes to prevent memory leaks.
 */

export type JobStatus = 'pending' | 'running' | 'done' | 'error'

export interface AiJob {
  id: string
  status: JobStatus
  progress: number // 0..100
  progressLabel: string
  result?: unknown
  error?: string
  createdAt: number
  updatedAt: number
}

const JOBS = new Map<string, AiJob>()
const TTL_MS = 10 * 60 * 1000 // 10 minutes

// Prune expired jobs every 2 minutes
let pruneTimer: ReturnType<typeof setInterval> | null = null
function ensurePruner() {
  if (pruneTimer) return
  pruneTimer = setInterval(
    () => {
      const now = Date.now()
      for (const [id, job] of JOBS) {
        if (now - job.updatedAt > TTL_MS) {
          JOBS.delete(id)
        }
      }
    },
    2 * 60 * 1000
  )
  // Don't keep the process alive just for this timer
  if (pruneTimer && typeof pruneTimer.unref === 'function') {
    pruneTimer.unref()
  }
}

export function createJob(id: string): AiJob {
  ensurePruner()
  const job: AiJob = {
    id,
    status: 'pending',
    progress: 0,
    progressLabel: 'Memulai...',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  JOBS.set(id, job)
  return job
}

export function getJob(id: string): AiJob | undefined {
  return JOBS.get(id)
}

export function updateJob(
  id: string,
  patch: Partial<Omit<AiJob, 'id' | 'createdAt'>>
): AiJob | undefined {
  const job = JOBS.get(id)
  if (!job) return undefined
  Object.assign(job, patch, { updatedAt: Date.now() })
  return job
}

export function deleteJob(id: string): boolean {
  return JOBS.delete(id)
}

/**
 * Generate a short unique job ID.
 */
export function generateJobId(): string {
  return `job_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
