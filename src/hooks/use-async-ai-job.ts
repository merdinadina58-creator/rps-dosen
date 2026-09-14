'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'

interface AiJobStatus {
  status: 'pending' | 'running' | 'done' | 'error'
  progress: number
  progressLabel: string
  result?: unknown
  error?: string
}

interface UseAsyncAiJobOptions<T> {
  /** Called when the job completes successfully. Receives the result object. */
  onSuccess?: (result: T) => void
  /** Called when the job fails. Receives the error message. */
  onError?: (error: string) => void
}

interface UseAsyncAiJobResult<T> {
  /** Start the job. Returns the jobId, or null if startFn threw. */
  mutate: (startFn: () => Promise<{ jobId: string }>) => Promise<void>
  /** Whether a job is currently running (started + not done/error). */
  isPending: boolean
  /** Current progress 0-100 from the server. */
  progress: number
  /** Current progress label from the server. */
  progressLabel: string
  /** The result when the job is done. */
  data: T | null
  /** The error message if the job failed. */
  error: string | null
  /** Reset state (e.g. when closing a dialog). */
  reset: () => void
}

/**
 * Reusable hook for async AI job pattern.
 *
 * Why: All AI endpoints (generate-cpmk, generate-pertemuan, generate-referensi,
 * generate-full-rps) now return a jobId immediately (HTTP 202) and run in the
 * background. The client must poll GET /api/ai/job/[jobId] for status.
 *
 * This hook encapsulates the polling logic so per-tab components can use it
 * as a drop-in replacement for useMutation:
 *
 * @example
 * const aiGen = useAsyncAiJob<{ cpmk: CpmkItem[] }>({
 *   onSuccess: (data) => setAiResult(data.cpmk),
 *   onError: (msg) => toast.error(msg),
 * })
 *
 * <Button onClick={() => aiGen.mutate(() => api.generateCpmk(input))} disabled={aiGen.isPending}>
 *   {aiGen.isPending ? `Generating... ${aiGen.progress}%` : 'Generate AI'}
 * </Button>
 */
export function useAsyncAiJob<T = unknown>(
  options: UseAsyncAiJobOptions<T> = {}
): UseAsyncAiJobResult<T> {
  const { onSuccess, onError } = options
  const [isPending, setIsPending] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => stopPolling, [stopPolling])

  const reset = useCallback(() => {
    stopPolling()
    setIsPending(false)
    setProgress(0)
    setProgressLabel('')
    setData(null)
    setError(null)
  }, [stopPolling])

  const mutate = useCallback(
    async (startFn: () => Promise<{ jobId: string }>) => {
      // Reset state
      stopPolling()
      setError(null)
      setData(null)
      setProgress(0)
      setProgressLabel('Memulai...')
      setIsPending(true)

      try {
        // 1. Start job → get jobId (returns immediately, < 200ms)
        const { jobId } = await startFn()

        // 2. Poll for status every 2.5s
        await new Promise<void>((resolve, reject) => {
          const poll = async () => {
            try {
              const job: AiJobStatus = await api.getAiJobStatus(jobId)
              setProgress(job.progress)
              setProgressLabel(job.progressLabel)

              if (job.status === 'done' && job.result) {
                stopPolling()
                setData(job.result as T)
                onSuccess?.(job.result as T)
                resolve()
              } else if (job.status === 'error') {
                stopPolling()
                const msg = job.error || 'Gagal generate'
                setError(msg)
                onError?.(msg)
                reject(new Error(msg))
              }
              // pending / running → continue polling
            } catch (e) {
              // Network error during poll — retry next tick unless it's a deliberate reject
              if (e instanceof Error && e.message && !e.message.includes('Gagal')) {
                // transient network error, will retry
                return
              }
              reject(e)
            }
          }

          // Poll immediately, then every 2.5s
          void poll()
          pollRef.current = setInterval(poll, 2500)

          // Safety timeout: 4 minutes
          timeoutRef.current = setTimeout(() => {
            stopPolling()
            const msg = 'Generate timeout — silakan coba lagi'
            setError(msg)
            onError?.(msg)
            reject(new Error(msg))
          }, 240000)
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Gagal generate'
        setError(msg)
        onError?.(msg)
      } finally {
        setIsPending(false)
      }
    },
    [onSuccess, onError, stopPolling]
  )

  return { mutate, isPending, progress, progressLabel, data, error, reset }
}
