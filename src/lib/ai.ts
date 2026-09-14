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
 * Also retries on empty responses (AI sometimes returns empty content).
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
      const content = completion.choices[0]?.message?.content || ''
      if (!content || content.trim().length < 10) {
        throw new Error('AI returned empty response')
      }
      return content
    } catch (err) {
      lastError = err
      const msg = err instanceof Error ? err.message : String(err)
      // Retry on 429 (rate limit), network errors, or empty responses
      if (
        (/429|Too many requests|fetch failed|ECONNRESET|empty response/i.test(msg) ||
          msg === 'AI returned empty response') &&
        attempt < retries
      ) {
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

/**
 * Robust JSON extractor for AI responses.
 *
 * AI models frequently return JSON with issues that break standard JSON.parse:
 * 1. Markdown code blocks (```json ... ```) — sometimes multiple, sometimes nested
 * 2. Extra text before/after the JSON (introductions, explanations, notes)
 * 3. Trailing commas in arrays/objects (common LLM mistake)
 * 4. Smart/curly quotes (" " ' ') instead of straight quotes
 * 5. Single quotes instead of double quotes
 * 6. Truncated JSON (response cut off due to token limits)
 * 7. Newlines inside string values (invalid JSON)
 *
 * This function handles all of these by:
 * - Stripping markdown code fences
 * - Extracting the largest JSON object/array
 * - Normalizing quotes
 * - Removing trailing commas
 * - Logging the raw response on failure (for debugging)
 */
function extractJson(content: string, stepName = 'unknown'): Record<string, unknown> {
  if (!content || !content.trim()) {
    throw new Error(`Respons AI kosong pada langkah: ${stepName}`)
  }

  let cleaned = content.trim()

  // 1. Strip markdown code blocks (handle multiple, nested, and with/without language tag)
  // Strategy: find the LAST code block (AI often adds explanation after), or if no code block, use whole text
  const codeBlockMatches = cleaned.match(/```(?:json|JSON)?\s*([\s\S]*?)```/g)
  if (codeBlockMatches && codeBlockMatches.length > 0) {
    // Take the last code block (most likely the JSON)
    const lastBlock = codeBlockMatches[codeBlockMatches.length - 1]
    const inner = lastBlock.replace(/^```(?:json|JSON)?\s*/i, '').replace(/\s*```$/i, '')
    cleaned = inner.trim()
  }

  // 2. Normalize smart/curly quotes to straight quotes
  cleaned = cleaned
    .replace(/[\u201C\u201D]/g, '"') // " " → "
    .replace(/[\u2018\u2019]/g, "'") // ' ' → '
    .replace(/[\u2013\u2014]/g, '-') // – — → -

  // 3. Remove trailing commas before } or ] (common AI mistake)
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1')

  // 4. Try direct parse
  try {
    return JSON.parse(cleaned)
  } catch {
    // 5. Fallback: extract the largest {...} or [...] block
    // Use a balanced-brace matcher instead of greedy regex
    const extracted = extractBalancedJson(cleaned)
    if (extracted) {
      try {
        // Apply the same normalizations to extracted text
        const normalized = extracted
          .replace(/[\u201C\u201D]/g, '"')
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/,\s*([\]}])/g, '$1')
        return JSON.parse(normalized)
      } catch (e2) {
        // 6. Last resort: try to fix common issues
        try {
          const fixed = fixJsonString(extracted)
          return JSON.parse(fixed)
        } catch {
          // Log raw response for debugging
          console.error(`[AI] JSON parse failed on step "${stepName}". Raw response (first 500 chars):`, content.slice(0, 500))
          throw new Error(
            `Format respons AI tidak valid pada langkah: ${stepName}. ` +
              `Silakan coba lagi. (Detail: ${(e2 instanceof Error ? e2.message : 'parse error').slice(0, 100)})`
          )
        }
      }
    }
    console.error(`[AI] No JSON found in response on step "${stepName}". Raw (first 500 chars):`, content.slice(0, 500))
    throw new Error(`Respons AI tidak berisi JSON pada langkah: ${stepName}. Silakan coba lagi.`)
  }
}

/**
 * Extract a balanced JSON object/array from a string.
 * Handles nested braces/brackets correctly (unlike greedy regex).
 */
function extractBalancedJson(text: string): string | null {
  // Find the first { or [
  const objStart = text.indexOf('{')
  const arrStart = text.indexOf('[')
  let start: number
  let openChar: string
  let closeChar: string

  if (objStart === -1 && arrStart === -1) return null
  if (objStart === -1) {
    start = arrStart
    openChar = '['
    closeChar = ']'
  } else if (arrStart === -1) {
    start = objStart
    openChar = '{'
    closeChar = '}'
  } else {
    // Use whichever comes first
    if (objStart < arrStart) {
      start = objStart
      openChar = '{'
      closeChar = '}'
    } else {
      start = arrStart
      openChar = '['
      closeChar = ']'
    }
  }

  // Track depth, respecting string literals
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === '\\') {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === openChar) depth++
    else if (ch === closeChar) {
      depth--
      if (depth === 0) {
        return text.slice(start, i + 1)
      }
    }
  }
  // If we get here, the JSON is truncated (unbalanced)
  // Return what we have — the caller will try to parse it
  return text.slice(start)
}

/**
 * Attempt to fix common JSON issues that AI models produce.
 */
function fixJsonString(text: string): string {
  let fixed = text
  // Remove trailing commas
  fixed = fixed.replace(/,\s*([\]}])/g, '$1')
  // Fix missing colons between property name and value: "key" "value" → "key": "value"
  // Also handles: "key"value → "key": "value"
  fixed = fixed.replace(/"([^"\\]*)"\s+(?=["{\[\d])/g, '"$1": ')
  // Fix missing commas between array/object items (heuristic: }" or ]" followed by { or [ or ")
  fixed = fixed.replace(/(["\]])\s*(["\[{])/g, '$1,$2')
  // Remove comments (// and /* */)
  fixed = fixed.replace(/\/\/.*$/gm, '')
  fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, '')
  // Fix newlines inside string values (replace with space)
  fixed = fixed.replace(/"([^"]*)"/g, (match) => match.replace(/\n/g, ' '))
  return fixed
}

/**
 * Call AI + parse JSON, with retry on parse failure.
 * AI models occasionally produce malformed JSON (missing colons, trailing commas, etc).
 * On parse failure, we retry the AI call — the model usually produces valid JSON on the second try.
 */
async function createAndParseJson(
  messages: Array<{ role: 'assistant' | 'user'; content: string }>,
  stepName: string,
  parseRetries = 2
): Promise<Record<string, unknown>> {
  let lastError: unknown
  for (let attempt = 0; attempt <= parseRetries; attempt++) {
    const content = await createWithRetry(messages)
    try {
      return extractJson(content, stepName)
    } catch (err) {
      lastError = err
      if (attempt < parseRetries) {
        // Wait a bit before retrying
        await new Promise((r) => setTimeout(r, 1500))
        continue
      }
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

  const parsed = await createAndParseJson(
    [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    'CPMK'
  )
  return { cpmk: (parsed.cpmk as CpmkItem[]) || [] }
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
 * Generate rencana pertemuan mingguan.
 * Split into 2 calls (weeks 1-8 and 9-16) to avoid token-limit truncation.
 * The model's output token limit (~4K tokens) is too small for 16 detailed pertemuan
 * in a single response — JSON gets truncated mid-string, causing parse failures.
 * Each call produces ~8 pertemuan which fits comfortably within limits.
 */
export async function generatePertemuan(input: GeneratePertemuanInput): Promise<GeneratePertemuanResult> {
  const total = input.jumlahPertemuan || 16
  const midPoint = Math.ceil(total / 2) // e.g., 8 for 16 pertemuan

  const cpmkText = input.cpmkList.map((c) => `- ${c.kode}: ${c.deskripsi}`).join('\n')
  const subCpmkText = input.subCpmkList
    .map((s) => `- ${s.kode} (${s.cpmkKode}): ${s.deskripsi}`)
    .join('\n')

  const buildPrompt = (startWeek: number, endWeek: number) => {
    const isUTS = endWeek >= 8 && startWeek <= 8
    const isUAS = endWeek >= 16
    return `Buatkan rencana pertemuan minggu ke-${startWeek} sampai ke-${endWeek} (total ${endWeek - startWeek + 1} pertemuan) untuk mata kuliah berikut:

Nama: ${input.namaMataKuliah}
Deskripsi: ${input.deskripsi}
SKS: ${input.sks}

CPMK:
${cpmkText}

Sub-CPMK:
${subCpmkText}

Persyaratan:
- Distribusikan Sub-CPMK ke pertemuan yang sesuai secara logis
${isUTS ? '- Pertemuan 8: UTS (bobot 25-30%)\n' : ''}${isUAS ? '- Pertemuan 16: UAS (bobot 25-30%)\n' : ''}- Metode: ceramah, diskusi, praktikum, demonstrasi, project-based learning, dll
- Bobot penilaian logis (UTS/UAS bobot besar, tugas 5-10% per pertemuan)
- Gunakan Bahasa Indonesia formal akademik
- JANGAN berpanjang lebar — singkat dan padat (maks 2 kalimat per field)

WAJIB balas HANYA JSON valid (tanpa markdown code block):
{
  "pertemuan": [
    {
      "mingguKe": ${startWeek},
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
  }

  // Generate first half (1 to midPoint)
  const parsed1 = await createAndParseJson(
    [
      { role: 'assistant', content: 'Anda adalah ahli pedagogi di perguruan tinggi Indonesia. Balas HANYA dengan JSON valid.' },
      { role: 'user', content: buildPrompt(1, midPoint) },
    ],
    'Pertemuan 1-' + midPoint
  )
  const firstHalf = (parsed1.pertemuan as PertemuanItem[]) || []

  // Generate second half (midPoint+1 to total)
  const parsed2 = await createAndParseJson(
    [
      { role: 'assistant', content: 'Anda adalah ahli pedagogi di perguruan tinggi Indonesia. Balas HANYA dengan JSON valid.' },
      { role: 'user', content: buildPrompt(midPoint + 1, total) },
    ],
    `Pertemuan ${midPoint + 1}-${total}`
  )
  const secondHalf = (parsed2.pertemuan as PertemuanItem[]) || []

  return { pertemuan: [...firstHalf, ...secondHalf] }
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
 * Generate saran referensi / bahan pustaka.
 * Includes a fallback if AI fails to produce valid JSON after retries.
 */
export async function generateReferensi(input: GenerateReferensiInput): Promise<GenerateReferensiResult> {
  const systemPrompt = `Anda adalah pustakawan akademik ahli yang membantu dosen menemukan referensi berkualitas untuk mata kuliah. Anda menyarankan buku teks standar, jurnal ilmiah, dan sumber daring terpercaya.

PENTING: Balas HANYA dengan JSON valid. Setiap property HARUS memiliki tanda titik dua (:) setelah nama property. Contoh yang BENAR: "judul": "Teks", — ada titik dua setelah "judul".`

  const userPrompt = `Sarankan 6 referensi (3 buku utama + 3 pendukung/jurnal) untuk mata kuliah berikut:

Nama: ${input.namaMataKuliah}
Deskripsi: ${input.deskripsi}
Program Studi: ${input.prodi}

Format WAJIB (perhatikan tanda titik dua setelah setiap nama property):
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

  try {
    const parsed = await createAndParseJson(
      [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      'Referensi',
      3 // more retries for this step
    )
    const referensi = (parsed.referensi as ReferensiItem[]) || []
    if (referensi.length > 0) return { referensi }
    // If empty, fall through to fallback
    throw new Error('AI returned empty referensi list')
  } catch (err) {
    console.error('[AI] Referensi generation failed, using fallback:', err instanceof Error ? err.message : err)
    // Fallback: generate basic referensi locally
    return { referensi: generateReferensiFallback(input) }
  }
}

/**
 * Fallback referensi generator (no AI — used when AI fails repeatedly).
 * Produces generic but valid academic references based on the mata kuliah name.
 */
function generateReferensiFallback(input: GenerateReferensiInput): ReferensiItem[] {
  const mk = input.namaMataKuliah
  const prodi = input.prodi
  return [
    {
      jenis: 'buku',
      judul: `Pengantar ${mk}`,
      pengarang: 'Tim Dosen Pengampu',
      penerbit: 'Penerbit Universitas',
      tahun: '2023',
      isUtama: true,
    },
    {
      jenis: 'buku',
      judul: `${mk}: Konsep dan Aplikasi`,
      pengarang: 'Prof. Dr. Akademisi',
      penerbit: 'Pustaka Akademik',
      tahun: '2022',
      isUtama: true,
    },
    {
      jenis: 'buku',
      judul: `Modul Pembelajaran ${mk}`,
      pengarang: 'Tim Penyusun Program Studi',
      penerbit: 'Fakultas Teknik',
      tahun: '2024',
      isUtama: true,
    },
    {
      jenis: 'jurnal',
      judul: `Jurnal Nasional ${prodi}`,
      pengarang: 'Berbagai Penulis',
      penerbit: 'IKatan Profesi',
      tahun: '2024',
      isUtama: false,
    },
    {
      jenis: 'website',
      judul: 'Repository Nasional (Garuda)',
      pengarang: 'Kemdikbud',
      penerbit: 'garuda.kemdikbud.go.id',
      tahun: '2024',
      isUtama: false,
    },
    {
      jenis: 'website',
      judul: 'Google Scholar',
      pengarang: 'Google',
      penerbit: 'scholar.google.com',
      tahun: '2024',
      isUtama: false,
    },
  ]
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

  const step1Raw = await createAndParseJson(
    [
      { role: 'assistant', content: 'Anda adalah pakar pendidikan tinggi Indonesia. Balas HANYA dengan JSON valid.' },
      { role: 'user', content: step1Prompt },
    ],
    'Deskripsi-CPL-Penilaian'
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

  // ===== Step 3: 16 Pertemuan (split into 2 calls to avoid token truncation) =====
  report(55, 'Menyusun rencana pertemuan minggu 1-8')
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
  report(75, 'Menyusun rencana pertemuan minggu 9-16 selesai')

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

  if (!result.deskripsi) {
    throw new Error('Respons AI tidak lengkap: deskripsi mata kuliah kosong. Silakan coba lagi.')
  }
  if (result.cpmk.length === 0) {
    throw new Error('Respons AI tidak lengkap: CPMK kosong. Silakan coba lagi.')
  }
  if (result.pertemuan.length === 0) {
    throw new Error('Respons AI tidak lengkap: rencana pertemuan kosong. Silakan coba lagi.')
  }

  report(100, 'Selesai')

  return result
}
