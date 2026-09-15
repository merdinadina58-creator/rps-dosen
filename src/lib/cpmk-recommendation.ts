/**
 * CPMK count recommendation based on mata kuliah characteristics.
 *
 * Uses a rule-based formula that considers:
 * - SKS (more credits -> more CPMK)
 * - Semester level (advanced -> more CPMK)
 * - Prodi type (pendidikan -> slightly more)
 * - Topic complexity (description length/keywords -> +1 if complex)
 *
 * OBE standard: each CPMK should be achievable in 2-4 pertemuan.
 * With 16 pertemuan (minus UTS + UAS = 14 teaching weeks):
 *   - 3 CPMK × ~4-5 weeks each = 14 weeks ✅
 *   - 4 CPMK × ~3-4 weeks each = 14 weeks ✅
 *   - 5 CPMK × ~2-3 weeks each = 14 weeks ✅
 *   - 6 CPMK × ~2 weeks each = 12 weeks (tight) ⚠️
 */

export interface RecommendationInput {
  sks: number
  semester: number
  prodi: string
  namaMataKuliah: string
  deskripsi: string
}

export interface CpmkRecommendation {
  count: number
  reason: string
  factors: string[]
}

export function recommendCpmkCount(input: RecommendationInput): CpmkRecommendation {
  const { sks, semester, prodi, namaMataKuliah, deskripsi } = input
  const factors: string[] = []

  // Base: SKS -> CPMK mapping
  let base: number
  if (sks <= 1) {
    base = 3
    factors.push(`${sks} SKS -> dasar 3 CPMK`)
  } else if (sks === 2) {
    base = 3
    factors.push(`${sks} SKS -> dasar 3 CPMK`)
  } else if (sks === 3) {
    base = 4
    factors.push(`${sks} SKS -> dasar 4 CPMK`)
  } else if (sks === 4) {
    base = 5
    factors.push(`${sks} SKS -> dasar 5 CPMK`)
  } else if (sks <= 6) {
    base = 6
    factors.push(`${sks} SKS -> dasar 6 CPMK`)
  } else {
    base = 6
    factors.push(`${sks} SKS -> dasar 6 CPMK (maksimal)`)
  }

  // Adjustment: Semester level
  if (semester >= 5) {
    base = Math.min(base + 1, 8)
    factors.push(`Semester ${semester} (lanjut) -> +1 CPMK`)
  } else if (semester <= 2) {
    factors.push(`Semester ${semester} (awal) -> tanpa tambahan`)
  }

  // Adjustment: Prodi type
  const prodiLower = prodi.toLowerCase()
  if (prodiLower.includes('pendidikan') || prodiLower.includes('keguruan')) {
    // Pendidikan subjects tend to have more CPMK (pedagogy + content)
    base = Math.min(base + 1, 8)
    factors.push(`Prodi Pendidikan -> +1 CPMK (aspek pedagogi)`)
  }

  // Adjustment: Topic complexity (description analysis)
  const descLower = deskripsi.toLowerCase()
  const complexKeywords = [
    'analisis', 'rancang', 'evaluasi', 'implementasi', 'integrasi',
    'multimedia', 'interdisipliner', 'kompleks', 'lanjut', 'advanced',
    'kecerdasan', 'machine learning', 'artificial intelligence',
    'jaringan', 'keamanan', 'kriptografi', 'blockchain',
  ]
  const matchedComplex = complexKeywords.filter((kw) => descLower.includes(kw))
  if (matchedComplex.length >= 2) {
    base = Math.min(base + 1, 8)
    factors.push(`Topik kompleks (${matchedComplex.length} kata kunci) -> +1 CPMK`)
  }

  // Adjustment: Description length (longer description -> more topics -> more CPMK)
  if (deskripsi.length > 200) {
    base = Math.min(base + 1, 8)
    factors.push('Deskripsi > 200 karakter (banyak topik) -> +1 CPMK')
  }

  // Clamp: min 3, max 8
  base = Math.max(3, Math.min(8, base))

  // Build reason
  const reason = `Rekomendasi ${base} CPMK berdasarkan ${sks} SKS, semester ${semester}, prodi ${prodi}`

  return {
    count: base,
    reason,
    factors,
  }
}
