import ZAI from 'z-ai-web-dev-sdk'

/**
 * AI Service for RPS Assistant
 * Uses z-ai-web-dev-sdk (backend only)
 * Helps lecturers generate CPMK, Sub-CPMK, weekly plans, references, etc.
 */

let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create()
  }
  return zaiInstance
}

/**
 * Wrap an AI completion call with retry-on-429 logic.
 * The z-ai API rate-limits concurrent requests; if we hit 429 we back off and retry.
 */
async function createWithRetry(
  messages: Array<{ role: 'assistant' | 'user'; content: string }>,
  retries = 3
): Promise<string> {
  const zai = await getZAI()
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const completion = await zai.chat.completions.create({
        messages,
        thinking: { type: 'disabled' },
      })
      return completion.choices[0]?.message?.content || ''
    } catch (err) {
      lastError = err
      const msg = err instanceof Error ? err.message : String(err)
      // Retry on 429 (rate limit) or network errors
      if (/429|Too many requests|fetch failed|ECONNRESET/i.test(msg) && attempt < retries) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt + 1) * 1000
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
      throw err
    }
  }
  throw lastError
}

export interface GenerateCpmkInput {
  namaMataKuliah: string
  deskripsi: string
  sks: number
  prodi: string
  semester: number
  jumlahCpmk?: number
}

export interface CpmkItem {
  kode: string
  deskripsi: string
  subCpmk: Array<{
    kode: string
    deskripsi: string
  }>
}

export interface GenerateCpmkResult {
  cpmk: CpmkItem[]
}

/**
 * Generate CPMK & Sub-CPMK berdasarkan informasi mata kuliah
 */
export async function generateCpmk(input: GenerateCpmkInput): Promise<GenerateCpmkResult> {
  const zai = await getZAI()
  const jumlah = input.jumlahCpmk || 4

  const systemPrompt = `Anda adalah ahli pendidikan tinggi Indonesia yang ahli menyusun RPS (Rencana Pembelajaran Semester) sesuai standar SN-Dikti dan KKNI. Anda membantu dosen menyusun CPMK (Capaian Pembelajaran Mata Kuliah) dan Sub-CPMK yang baik, terukur, dan sesuai taksonomi Bloom.`

  const userPrompt = `Buatkan ${jumlah} CPMK lengkap dengan Sub-CPMK (2-3 sub per CPMK) untuk mata kuliah berikut:

Nama Mata Kuliah: ${input.namaMataKuliah}
Deskripsi: ${input.deskripsi}
SKS: ${input.sks}
Program Studi: ${input.prodi}
Semester: ${input.semester}

Persyaratan:
- CPMK menggunakan kata kerja aktif taksonomi Bloom (mampu menjelaskan, mampu menerapkan, mampu menganalisis, mampu merancang, dll)
- Setiap CPMK harus terukur dan dapat dinilai
- Sub-CPMK adalah penjabaran lebih spesifik dari CPMK
- Gunakan Bahasa Indonesia formal akademik
- Kode CPMK: CPMK1, CPMK2, dst
- Kode Sub-CPMK: Sub-CPMK1.1, Sub-CPMK1.2, dst

WAJIB balas HANYA dalam format JSON valid (tanpa markdown code block, tanpa penjelasan tambahan) dengan struktur:
{
  "cpmk": [
    {
      "kode": "CPMK1",
      "deskripsi": "...",
      "subCpmk": [
        { "kode": "Sub-CPMK1.1", "deskripsi": "..." }
      ]
    }
  ]
}`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const content = completion.choices[0]?.message?.content || ''

  // Try to parse JSON, handle possible code fences
  let cleaned = content.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  }

  try {
    const parsed = JSON.parse(cleaned)
    return { cpmk: parsed.cpmk || [] }
  } catch {
    // Fallback: try to extract JSON object
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        return { cpmk: parsed.cpmk || [] }
      } catch {
        // ignore
      }
    }
    throw new Error('Format respons AI tidak valid. Silakan coba lagi.')
  }
}

export interface GeneratePertemuanInput {
  namaMataKuliah: string
  deskripsi: string
  sks: number
  cpmkList: Array<{ kode: string; deskripsi: string }>
  subCpmkList: Array<{ kode: string; deskripsi: string; cpmkKode: string }>
  jumlahPertemuan?: number
}

export interface PertemuanItem {
  mingguKe: number
  materi: string
  metode: string
  aktivitasDosen: string
  aktivitasMhs: string
  pengalamanBelajar: string
  indikatorPenilaian: string
  bobotPenilaian: number
  estimasiWaktu: string
  subCpmkTerkait: string[]
}

export interface GeneratePertemuanResult {
  pertemuan: PertemuanItem[]
}

/**
 * Generate rencana pertemuan mingguan
 */
export async function generatePertemuan(input: GeneratePertemuanInput): Promise<GeneratePertemuanResult> {
  const zai = await getZAI()
  const jumlah = input.jumlahPertemuan || 16

  const systemPrompt = `Anda adalah ahli pedagogi dan desain pembelajaran di perguruan tinggi Indonesia. Anda membantu dosen menyusun rencana pembelajaran mingguan (16 pertemuan) yang sistematis, efektif, dan sesuai dengan CPMK yang sudah ditetapkan.`

  const userPrompt = `Buatkan rencana ${jumlah} pertemuan untuk mata kuliah berikut:

Nama: ${input.namaMataKuliah}
Deskripsi: ${input.deskripsi}
SKS: ${input.sks}

CPMK:
${input.cpmkList.map((c) => `- ${c.kode}: ${c.deskripsi}`).join('\n')}

Sub-CPMK:
${input.subCpmkList.map((s) => `- ${s.kode} (${s.cpmkKode}): ${s.deskripsi}`).join('\n')}

Persyaratan:
- Distribusikan Sub-CPMK ke pertemuan yang sesuai secara logis
- Pertemuan 1-2: pengantar, konsep dasar
- Pertemuan tengah: materi inti, praktik
- Pertemuan 7-8: UTS (bisa di-gabung atau setelah materi)
- Pertemuan 14-15: presentasi/aplikasi
- Pertemuan 16: UAS / evaluasi akhir
- Metode: ceramah, diskusi, praktikum, demonstrasi, project-based learning, dll
- Bobot penilaian total harus 100% (UTS biasanya 25-30%, UAS 25-30%, tugas 20-30%, kehadiran 5-10%)
- Gunakan Bahasa Indonesia formal akademik

WAJIB balas HANYA dalam format JSON valid (tanpa markdown code block) dengan struktur:
{
  "pertemuan": [
    {
      "mingguKe": 1,
      "materi": "...",
      "metode": "Ceramah & Diskusi",
      "aktivitasDosen": "...",
      "aktivitasMhs": "...",
      "pengalamanBelajar": "...",
      "indikatorPenilaian": "...",
      "bobotPenilaian": 5,
      "estimasiWaktu": "150 menit",
      "subCpmkTerkait": ["Sub-CPMK1.1"]
    }
  ]
}`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const content = completion.choices[0]?.message?.content || ''
  let cleaned = content.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  }

  try {
    const parsed = JSON.parse(cleaned)
    return { pertemuan: parsed.pertemuan || [] }
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        return { pertemuan: parsed.pertemuan || [] }
      } catch {
        // ignore
      }
    }
    throw new Error('Format respons AI tidak valid. Silakan coba lagi.')
  }
}

export interface GenerateReferensiInput {
  namaMataKuliah: string
  deskripsi: string
  prodi: string
}

export interface ReferensiItem {
  jenis: string
  judul: string
  pengarang: string
  penerbit: string
  tahun: string
  isUtama: boolean
}

export interface GenerateReferensiResult {
  referensi: ReferensiItem[]
}

/**
 * Generate saran referensi / bahan pustaka
 */
export async function generateReferensi(input: GenerateReferensiInput): Promise<GenerateReferensiResult> {
  const zai = await getZAI()

  const systemPrompt = `Anda adalah pustakawan akademik ahli yang membantu dosen menemukan referensi berkualitas untuk mata kuliah. Anda menyarankan buku teks standar, jurnal ilmiah, dan sumber daring terpercaya.`

  const userPrompt = `Sarankan 6 referensi (3 buku utama + 3 pendukung/jurnal) untuk mata kuliah berikut:

Nama: ${input.namaMataKuliah}
Deskripsi: ${input.deskripsi}
Program Studi: ${input.prodi}

WAJIB balas HANYA JSON valid (tanpa markdown):
{
  "referensi": [
    {
      "jenis": "buku",
      "judul": "...",
      "pengarang": "...",
      "penerbit": "...",
      "tahun": "2020",
      "isUtama": true
    }
  ]
}`

  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    thinking: { type: 'disabled' },
  })

  const content = completion.choices[0]?.message?.content || ''
  let cleaned = content.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  }

  try {
    const parsed = JSON.parse(cleaned)
    return { referensi: parsed.referensi || [] }
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        return { referensi: parsed.referensi || [] }
      } catch {
        // ignore
      }
    }
    throw new Error('Format respons AI tidak valid. Silakan coba lagi.')
  }
}

/**
 * Tanya AI - general assistant untuk pertanyaan RPS
 */
export async function askAssistant(question: string, context?: string): Promise<string> {
  const zai = await getZAI()

  const systemPrompt = `Anda adalah asisten AI ahli RPS (Rencana Pembelajaran Semester) untuk dosen di Indonesia. Anda membantu menjelaskan konsep RPS, CPMK, Sub-CPMK, asesmen, metode pembelajaran, dan standar SN-Dikti/KKNI/MBKM. Jawab dengan jelas, akurat, dan dalam Bahasa Indonesia formal akademik. Gunakan format markdown untuk readability jika perlu.`

  const messages = [
    { role: 'assistant', content: systemPrompt },
  ] as Array<{ role: 'assistant' | 'user'; content: string }>

  if (context) {
    messages.push({
      role: 'user',
      content: `Konteks RPS saat ini:\n${context}\n\nPertanyaan: ${question}`,
    })
  } else {
    messages.push({ role: 'user', content: question })
  }

  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: 'disabled' },
  })

  return completion.choices[0]?.message?.content || 'Maaf, saya tidak dapat memberikan respons saat ini.'
}

// ===== Generate Full RPS (all components in one go) =====

export interface GenerateFullRpsInput {
  namaMataKuliah: string
  kodeMataKuliah?: string
  deskripsiMataKuliah: string
  sks: number
  prodi: string
  semester: number
  prasyarat?: string
  jumlahCpmk?: number
  jumlahPertemuan?: number
}

export interface FullRpsCpmk {
  kode: string
  deskripsi: string
  subCpmk: Array<{ kode: string; deskripsi: string }>
}

export interface FullRpsPertemuan {
  mingguKe: number
  materi: string
  metode: string
  aktivitasDosen: string
  aktivitasMhs: string
  pengalamanBelajar: string
  indikatorPenilaian: string
  bobotPenilaian: number
  estimasiWaktu: string
}

export interface FullRpsReferensi {
  jenis: string
  judul: string
  pengarang: string
  penerbit: string
  tahun: string
  url: string
  isUtama: boolean
}

export interface FullRpsPenilaian {
  nama: string
  bobot: number
  bentuk: string
  keterangan: string
}

export interface GenerateFullRpsResult {
  deskripsi: string
  cpl: string
  cpmk: FullRpsCpmk[]
  pertemuan: FullRpsPertemuan[]
  penilaian: FullRpsPenilaian[]
  referensi: FullRpsReferensi[]
}

function extractJson(content: string): any {
  let cleaned = content.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  }
  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        // ignore
      }
    }
    throw new Error('Format respons AI tidak valid (bukan JSON). Silakan coba lagi.')
  }
}

export interface ProgressUpdate {
  progress: number // 0..100
  label: string
}

/**
 * Generate SELURUH isi RPS dengan chaining beberapa panggilan AI yang fokus.
 * Lebih reliable & cepat per-step dibanding satu prompt raksasa.
 *
 * Execution: Sequential (deskripsi+CPL+penilaian → CPMK → 16 pertemuan → referensi)
 * untuk menghindari 429 rate-limit dari API saat concurrent requests.
 * Total waktu ~50-70s, berjalan di background via async job pattern (lihat ai-job-store.ts)
 * sehingga tidak menyebabkan 502 gateway timeout.
 */
export async function generateFullRps(
  input: GenerateFullRpsInput,
  onProgress?: (update: ProgressUpdate) => void
): Promise<GenerateFullRpsResult> {
  const jumlahCpmk = input.jumlahCpmk || 4
  const jumlahPertemuan = input.jumlahPertemuan || 16

  const report = (progress: number, label: string) => {
    onProgress?.({ progress, label })
  }

  report(5, 'Menganalisis informasi mata kuliah')

  // ===== Step 1 prompt (deskripsi, CPL, penilaian) =====
  const step1Prompt = `Anda adalah pakar pendidikan tinggi Indonesia yang ahli menyusun RPS sesuai SN-Dikti/KKNI/MBKM.

Buatkan untuk mata kuliah berikut:
Nama: ${input.namaMataKuliah}
${input.kodeMataKuliah ? `Kode: ${input.kodeMataKuliah}` : ''}
SKS: ${input.sks}
Prodi: ${input.prodi}
Semester: ${input.semester}
${input.prasyarat ? `Prasyarat: ${input.prasyarat}` : ''}
Info: ${input.deskripsiMataKuliah}

Hasilkan:
1. DESKRIPSI mata kuliah (2-4 kalimat narasi akademik yang menarik, BUKAN copy-paste info di atas)
2. CPL (1-2 kalimat Capaian Pembelajaran Lulusan yang relevan)
3. PENILAIAN: 4-5 komponen dengan total bobot = 100 (Kehadiran 5-10%, Tugas 15-25%, Proyek 15-25%, UTS 25-30%, UAS 25-30%)

WAJIB balas HANYA JSON valid (tanpa markdown code block):
{
  "deskripsi": "...",
  "cpl": "...",
  "penilaian": [
    { "nama": "Kehadiran", "bobot": 10, "bentuk": "Presensi", "keterangan": "..." }
  ]
}`

  // ===== Step 1: Deskripsi, CPL, Penilaian (sequential to avoid 429 rate limit) =====
  report(10, 'Menyusun deskripsi, CPL & komponen penilaian')

  const step1Raw = extractJson(
    await createWithRetry([
      { role: 'assistant', content: 'Anda adalah pakar pendidikan tinggi Indonesia. Balas HANYA dengan JSON valid.' },
      { role: 'user', content: step1Prompt },
    ])
  )

  // ===== Step 2: CPMK + Sub-CPMK =====
  report(35, 'Merancang CPMK & Sub-CPMK')

  const cpmkResult = await generateCpmk({
    namaMataKuliah: input.namaMataKuliah,
    deskripsi: input.deskripsiMataKuliah,
    sks: input.sks,
    prodi: input.prodi,
    semester: input.semester,
    jumlahCpmk,
  })

  // ===== Step 3: 16 Pertemuan (needs CPMK context) =====
  report(60, 'Menyusun rencana 16 pertemuan mingguan')

  const pertemuanResult = await generatePertemuan({
    namaMataKuliah: input.namaMataKuliah,
    deskripsi: input.deskripsiMataKuliah,
    sks: input.sks,
    cpmkList: cpmkResult.cpmk.map((c) => ({ kode: c.kode, deskripsi: c.deskripsi })),
    subCpmkList: cpmkResult.cpmk.flatMap((c) =>
      c.subCpmk.map((s) => ({ kode: s.kode, deskripsi: s.deskripsi, cpmkKode: c.kode }))
    ),
    jumlahPertemuan,
  })

  // ===== Step 4: Referensi =====
  report(85, 'Mengumpulkan referensi bahan pustaka')

  const referensiResult = await generateReferensi({
    namaMataKuliah: input.namaMataKuliah,
    deskripsi: input.deskripsiMataKuliah,
    prodi: input.prodi,
  })

  report(95, 'Menyusun dokumen RPS final')

  // ===== Gabungkan hasil =====
  const result: GenerateFullRpsResult = {
    deskripsi: String(step1Raw.deskripsi ?? ''),
    cpl: String(step1Raw.cpl ?? ''),
    cpmk: cpmkResult.cpmk,
    pertemuan: pertemuanResult.pertemuan.map((p) => ({
      mingguKe: Number(p.mingguKe) || 0,
      materi: String(p.materi ?? ''),
      metode: String(p.metode ?? ''),
      aktivitasDosen: String(p.aktivitasDosen ?? ''),
      aktivitasMhs: String(p.aktivitasMhs ?? ''),
      pengalamanBelajar: String(p.pengalamanBelajar ?? ''),
      indikatorPenilaian: String(p.indikatorPenilaian ?? ''),
      bobotPenilaian: Number(p.bobotPenilaian) || 0,
      estimasiWaktu: String(p.estimasiWaktu ?? '150 menit'),
    })),
    penilaian: Array.isArray(step1Raw.penilaian)
      ? step1Raw.penilaian.map((p: Record<string, unknown>) => ({
          nama: String(p.nama ?? ''),
          bobot: Number(p.bobot) || 0,
          bentuk: String(p.bentuk ?? ''),
          keterangan: String(p.keterangan ?? ''),
        }))
      : [],
    referensi: referensiResult.referensi.map((r) => ({
      jenis: String(r.jenis ?? 'buku'),
      judul: String(r.judul ?? ''),
      pengarang: String(r.pengarang ?? ''),
      penerbit: String(r.penerbit ?? ''),
      tahun: String(r.tahun ?? ''),
      url: String(r.url ?? ''),
      isUtama: Boolean(r.isUtama),
    })),
  }

  if (!result.deskripsi || result.cpmk.length === 0 || result.pertemuan.length === 0) {
    throw new Error('Respons AI tidak lengkap. Silakan coba lagi.')
  }

  report(100, 'Selesai')

  return result
}
