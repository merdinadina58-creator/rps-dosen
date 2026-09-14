import { NextResponse } from 'next/server'
import { generatePertemuan, type GeneratePertemuanInput } from '@/lib/ai'
import { createJob, updateJob, generateJobId } from '@/lib/ai-job-store'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * ASYNC: POST returns jobId immediately. Client polls GET /api/ai/job/[jobId].
 * Background: generatePertemuan runs (splits into 2 calls: weeks 1-8 and 9-16),
 * updates job store with progress, stores result when done.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<GeneratePertemuanInput>

    const { namaMataKuliah, deskripsi, sks, cpmkList, subCpmkList, jumlahPertemuan } = body

    if (!namaMataKuliah || !deskripsi || sks == null || !Array.isArray(cpmkList) || !Array.isArray(subCpmkList)) {
      return NextResponse.json(
        { error: 'namaMataKuliah, deskripsi, sks, cpmkList, subCpmkList wajib diisi' },
        { status: 400 }
      )
    }

    const input: GeneratePertemuanInput = {
      namaMataKuliah,
      deskripsi,
      sks: Number(sks),
      cpmkList,
      subCpmkList,
      jumlahPertemuan: jumlahPertemuan ? Number(jumlahPertemuan) : undefined,
    }

    const jobId = generateJobId()
    createJob(jobId)
    updateJob(jobId, { status: 'running', progress: 10, progressLabel: 'Menyusun rencana pertemuan minggu 1-8...' })

    void generatePertemuan(input)
      .then((result) => {
        updateJob(jobId, {
          status: 'done',
          progress: 100,
          progressLabel: 'Selesai',
          result,
        })
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Gagal generate pertemuan'
        updateJob(jobId, {
          status: 'error',
          error: message,
          progressLabel: 'Gagal: ' + message,
        })
      })

    return NextResponse.json({ jobId, status: 'pending' }, { status: 202 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal memulai generate pertemuan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
