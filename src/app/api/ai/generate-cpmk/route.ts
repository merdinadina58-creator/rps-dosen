import { NextResponse } from 'next/server'
import { generateCpmk, type GenerateCpmkInput } from '@/lib/ai'
import { createJob, updateJob, generateJobId } from '@/lib/ai-job-store'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * ASYNC: POST returns jobId immediately. Client polls GET /api/ai/job/[jobId].
 * Background: generateCpmk runs, updates job store with progress, stores result when done.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<GenerateCpmkInput>

    const { namaMataKuliah, deskripsi, sks, prodi, semester, jumlahCpmk } = body

    if (!namaMataKuliah || !deskripsi || !prodi || sks == null || semester == null) {
      return NextResponse.json(
        { error: 'namaMataKuliah, deskripsi, sks, prodi, semester wajib diisi' },
        { status: 400 }
      )
    }

    const input: GenerateCpmkInput = {
      namaMataKuliah,
      deskripsi,
      sks: Number(sks),
      prodi,
      semester: Number(semester),
      jumlahCpmk: jumlahCpmk ? Number(jumlahCpmk) : undefined,
    }

    const jobId = generateJobId()
    createJob(jobId)
    updateJob(jobId, { status: 'running', progress: 10, progressLabel: 'Merancang CPMK & Sub-CPMK...' })

    void generateCpmk(input)
      .then((result) => {
        updateJob(jobId, {
          status: 'done',
          progress: 100,
          progressLabel: 'Selesai',
          result,
        })
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Gagal generate CPMK'
        updateJob(jobId, {
          status: 'error',
          error: message,
          progressLabel: 'Gagal: ' + message,
        })
      })

    return NextResponse.json({ jobId, status: 'pending' }, { status: 202 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memulai generate CPMK'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
