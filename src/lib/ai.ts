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
