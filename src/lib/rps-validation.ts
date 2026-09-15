import type { RpsDetail } from '@/lib/api'
import { db } from '@/lib/db'

export interface ValidationIssue {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
}

/**
 * Validate RPS completeness before it can be marked as "Final".
 *
 * Checks:
 * 1. Deskripsi & CPL not empty
 * 2. At least 1 CPMK with at least 1 Sub-CPMK each
 * 3. Pertemuan count matches mingguPertemuan (usually 16)
 * 4. Total bobot penilaian (komponen) = exactly 100%
 * 5. Total bobot pertemuan = exactly 100%
 * 6. At least 1 referensi (utama preferred)
 * 7. At least 1 komponen penilaian
 *
 * Returns issues array — empty if valid.
 */
export function validateRpsCompleteness(rps: RpsDetail): ValidationResult {
  const issues: ValidationIssue[] = []

  // 1. Deskripsi & CPL
  if (!rps.deskripsi || rps.deskripsi.trim().length < 20) {
    issues.push({
      field: 'deskripsi',
      message: 'Deskripsi mata kuliah masih kosong atau terlalu singkat (minimal 20 karakter)',
      severity: 'error',
    })
  }
  if (!rps.cpl || rps.cpl.trim().length < 20) {
    issues.push({
      field: 'cpl',
      message: 'Capaian Pembelajaran Lulusan (CPL) masih kosong atau terlalu singkat',
      severity: 'error',
    })
  }

  // 2. CPMK
  if (rps.cpmk.length === 0) {
    issues.push({
      field: 'cpmk',
      message: 'Belum ada CPMK. Minimal 1 CPMK dengan Sub-CPMK',
      severity: 'error',
    })
  } else {
    const cpmkWithoutSub = rps.cpmk.filter((c) => c.subCpmk.length === 0)
    if (cpmkWithoutSub.length > 0) {
      issues.push({
        field: 'cpmk',
        message: `${cpmkWithoutSub.length} CPMK tidak punya Sub-CPMK: ${cpmkWithoutSub.map((c) => c.kode).join(', ')}`,
        severity: 'warning',
      })
    }
    if (rps.cpmk.length < 3) {
      issues.push({
        field: 'cpmk',
        message: `Hanya ${rps.cpmk.length} CPMK — disarankan minimal 3-4 CPMK`,
        severity: 'warning',
      })
    }
  }

  // 3. Pertemuan
  const expectedPertemuan = rps.mingguPertemuan || 16
  if (rps.pertemuan.length === 0) {
    issues.push({
      field: 'pertemuan',
      message: 'Belum ada rencana pertemuan mingguan',
      severity: 'error',
    })
  } else if (rps.pertemuan.length < expectedPertemuan) {
    issues.push({
      field: 'pertemuan',
      message: `Hanya ${rps.pertemuan.length} dari ${expectedPertemuan} pertemuan. Lengkapi sampai ${expectedPertemuan} pertemuan`,
      severity: 'error',
    })
  } else {
    // Check for empty materi in any pertemuan
    const emptyMateri = rps.pertemuan.filter((p) => !p.materi || p.materi.trim().length === 0)
    if (emptyMateri.length > 0) {
      issues.push({
        field: 'pertemuan',
        message: `${emptyMateri.length} pertemuan belum punya materi: minggu ${emptyMateri.map((p) => p.mingguKe).join(', ')}`,
        severity: 'warning',
      })
    }
  }

  // 4. Total bobot komponen penilaian = 100%
  if (rps.penilaian.length === 0) {
    issues.push({
      field: 'penilaian',
      message: 'Belum ada komponen penilaian (Kehadiran, Tugas, UTS, UAS, dll)',
      severity: 'error',
    })
  } else {
    const totalBobot = rps.penilaian.reduce((sum, p) => sum + p.bobot, 0)
    if (totalBobot !== 100) {
      issues.push({
        field: 'penilaian',
        message: `Total bobot penilaian = ${totalBobot}% (harus 100%). Sesuaikan bobot komponen penilaian`,
        severity: 'error',
      })
    }
    // Check for common components
    const hasUTS = rps.penilaian.some((p) => /uts/i.test(p.nama))
    const hasUAS = rps.penilaian.some((p) => /uas/i.test(p.nama))
    if (!hasUTS) {
      issues.push({
        field: 'penilaian',
        message: 'Tidak ada komponen UTS dalam penilaian (disarankan ada)',
        severity: 'warning',
      })
    }
    if (!hasUAS) {
      issues.push({
        field: 'penilaian',
        message: 'Tidak ada komponen UAS dalam penilaian (disarankan ada)',
        severity: 'warning',
      })
    }
  }

  // 5. Total bobot pertemuan = 100%
  if (rps.pertemuan.length > 0) {
    const totalBobotPertemuan = rps.pertemuan.reduce((sum, p) => sum + p.bobotPenilaian, 0)
    if (totalBobotPertemuan !== 100) {
      issues.push({
        field: 'pertemuan',
        message: `Total bobot pertemuan = ${totalBobotPertemuan}% (harus 100%). Sesuaikan bobot per pertemuan`,
        severity: 'error',
      })
    }
  }

  // 6. Referensi
  if (rps.referensi.length === 0) {
    issues.push({
      field: 'referensi',
      message: 'Belum ada referensi/bahan pustaka',
      severity: 'error',
    })
  } else {
    const hasUtama = rps.referensi.some((r) => r.isUtama)
    if (!hasUtama) {
      issues.push({
        field: 'referensi',
        message: 'Tidak ada referensi utama (buku utama). Disarankan minimal 1 buku utama',
        severity: 'warning',
      })
    }
    if (rps.referensi.length < 3) {
      issues.push({
        field: 'referensi',
        message: `Hanya ${rps.referensi.length} referensi — disarankan minimal 3-6 referensi`,
        severity: 'warning',
      })
    }
  }

  // ===== OBE-specific checks =====

  // OBE: Deskripsi Singkat
  if (!rps.deskripsiSingkat || rps.deskripsiSingkat.trim().length < 10) {
    issues.push({
      field: 'deskripsiSingkat',
      message: 'Deskripsi Singkat (OBE) masih kosong — wajib diisi untuk format OBE',
      severity: 'warning',
    })
  }

  // OBE: Bahan Kajian
  if (!rps.bahanKajian || rps.bahanKajian.trim().length < 10) {
    issues.push({
      field: 'bahanKajian',
      message: 'Bahan Kajian/Materi Pembelajaran (OBE) masih kosong — wajib diisi untuk format OBE',
      severity: 'warning',
    })
  }

  // OBE: CPL Prodi (structured list)
  if (!rps.cplProdi || rps.cplProdi.length === 0) {
    issues.push({
      field: 'cplProdi',
      message: 'Belum ada CPL Prodi terstruktur — wajib untuk format OBE (tambahkan di tab CPMK)',
      severity: 'warning',
    })
  }

  // OBE: Each pertemuan should have Sub-CPMK kode + teknik penilaian
  if (rps.pertemuan.length > 0) {
    const noSubCpmk = rps.pertemuan.filter((p) => !p.subCpmkUtama || p.subCpmkUtama.trim() === '')
    if (noSubCpmk.length > 0) {
      issues.push({
        field: 'pertemuan',
        message: `${noSubCpmk.length} pertemuan belum punya Sub-CPMK (OBE) — minggu: ${noSubCpmk.map((p) => p.mingguKe).join(', ')}`,
        severity: 'warning',
      })
    }
    const noTeknik = rps.pertemuan.filter((p) => !p.teknikPenilaian || p.teknikPenilaian.trim() === '')
    if (noTeknik.length > 0) {
      issues.push({
        field: 'pertemuan',
        message: `${noTeknik.length} pertemuan belum punya Teknik Penilaian (OBE) — minggu: ${noTeknik.map((p) => p.mingguKe).join(', ')}`,
        severity: 'warning',
      })
    }
  }

  // RPS is valid if there are NO errors (warnings are OK)
  const isValid = !issues.some((i) => i.severity === 'error')

  return { isValid, issues }
}

/**
 * Check if CPMK descriptions are unique across all RPS.
 * Returns list of mata kuliah names that have identical CPMK.
 */
export async function checkCpmkUniqueness(rpsId: string): Promise<Array<{ mkName: string; cpmkText: string }>> {
  try {
    const currentRps = await db.rps.findUnique({
      where: { id: rpsId },
      select: { cpmk: { select: { deskripsi: true } } },
    })
    if (!currentRps || currentRps.cpmk.length === 0) return []

    const currentTexts = currentRps.cpmk.map(c => c.deskripsi.toLowerCase().slice(0, 80))

    const otherRps = await db.rps.findMany({
      where: { id: { not: rpsId } },
      select: {
        cpmk: { select: { deskripsi: true } },
        mataKuliah: { select: { nama: true } },
      },
      take: 50,
    })

    const duplicates: Array<{ mkName: string; cpmkText: string }> = []
    for (const other of otherRps) {
      for (const otherCpmk of other.cpmk) {
        const otherNorm = otherCpmk.deskripsi.toLowerCase().slice(0, 80)
        if (currentTexts.includes(otherNorm)) {
          duplicates.push({ mkName: other.mataKuliah.nama, cpmkText: otherCpmk.deskripsi.slice(0, 50) })
          break
        }
      }
    }
    return duplicates
  } catch {
    return []
  }
}
