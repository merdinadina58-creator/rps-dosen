// Centralized API helper functions and types

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error || `Request gagal (${res.status})`)
  }
  return res.json() as Promise<T>
}

// ===== Types (mirroring Prisma models) =====
export interface Dosen {
  id: string
  nama: string
  nip: string | null
  email: string | null
  telepon: string | null
  prodi: string
  jabatan: string | null
  createdAt: string
  updatedAt: string
  _count?: { rps: number }
}

export interface MataKuliah {
  id: string
  kode: string
  nama: string
  sks: number
  sksTeori: number
  sksPraktek: number
  rumpunMk: string | null
  semester: number
  prodi: string
  deskripsi: string | null
  prasyarat: string | null
  createdAt: string
  updatedAt: string
  _count?: { rps: number }
}

export interface SubCpmk {
  id: string
  cpmkId: string
  kode: string
  deskripsi: string
  urutan: number
}

export interface Cpmk {
  id: string
  rpsId: string
  kode: string
  deskripsi: string
  bobot: number
  urutan: number
  subCpmk: SubCpmk[]
}

export interface Pertemuan {
  id: string
  rpsId: string
  mingguKe: number
  subCpmkUtama: string | null
  kemampuanAkhir: string | null
  indikator: string | null
  teknikPenilaian: string | null
  kriteriaPenilaian: string | null
  tmDaring: string | null
  materi: string | null
  metode: string | null
  aktivitasDosen: string | null
  aktivitasMhs: string | null
  pengalamanBelajar: string | null
  indikatorPenilaian: string | null
  bobotPenilaian: number
  estimasiWaktu: string | null
  urutan: number
}

export interface Referensi {
  id: string
  rpsId: string
  jenis: string
  judul: string
  pengarang: string | null
  penerbit: string | null
  tahun: string | null
  isbn: string | null
  url: string | null
  isUtama: boolean
  urutan: number
}

export interface KomponenPenilaian {
  id: string
  rpsId: string
  nama: string
  bobot: number
  bentuk: string | null
  keterangan: string | null
  urutan: number
}

export interface Rps {
  id: string
  judul: string
  tahunAjaran: string
  semester: string
  kelas: string | null
  mataKuliahId: string
  dosenId: string
  universitas: string | null
  fakultas: string | null
  kodeDokumen: string | null
  tglPenyusunan: string | null
  deskripsi: string | null
  deskripsiSingkat: string | null
  bahanKajian: string | null
  cpl: string | null
  mediaSoftware: string | null
  mediaHardware: string | null
  teamTeaching: boolean
  mataKuliahSyarat: string | null
  otorisasiDosenPengembang: string | null
  otorisasiKoordinatorRmk: string | null
  otorisasiKaprodi: string | null
  mingguPertemuan: number
  status: string
  kurikulum: string
  createdAt: string
  updatedAt: string
  mataKuliah: MataKuliah
  dosen: Dosen
  _count?: {
    cpmk: number
    pertemuan: number
    referensi: number
    penilaian: number
  }
}

export interface CplProdi {
  id: string
  rpsId: string
  kode: string
  deskripsi: string
  urutan: number
}

export interface KorelasiCplSubCpmk {
  id: string
  rpsId: string
  cplProdiId: string | null
  subCpmkKode: string | null
  bobot: string | null
  jumlahMinggu: number
  urutan: number
}

export interface RpsDetail extends Rps {
  cpmk: Cpmk[]
  pertemuan: Pertemuan[]
  referensi: Referensi[]
  penilaian: KomponenPenilaian[]
  cplProdi: CplProdi[]
  korelasi: KorelasiCplSubCpmk[]
}

// Hasil generate RPS lengkap oleh AI (OBE format)
export interface FullRpsGenerated {
  deskripsi: string
  deskripsiSingkat: string
  bahanKajian: string
  mediaSoftware: string
  mediaHardware: string
  cpl: string
  cplProdi: Array<{ kode: string; deskripsi: string }>
  cpmk: Array<{
    kode: string
    deskripsi: string
    subCpmk: Array<{ kode: string; deskripsi: string }>
  }>
  korelasi: Array<{
    subCpmkKode: string
    cplKode: string
    bobot: string
    jumlahMinggu: number
  }>
  pertemuan: Array<{
    mingguKe: number
    subCpmkKode: string
    kemampuanAkhir: string
    indikator: string
    teknikPenilaian: string
    kriteriaPenilaian: string
    tmDaring: string
    materi: string
    metode: string
    aktivitasDosen: string
    aktivitasMhs: string
    pengalamanBelajar: string
    indikatorPenilaian: string
    bobotPenilaian: number
    estimasiWaktu: string
  }>
  penilaian: Array<{
    nama: string
    bobot: number
    bentuk: string
    keterangan: string
  }>
  referensi: Array<{
    jenis: string
    judul: string
    pengarang: string
    penerbit: string
    tahun: string
    url: string
    isUtama: boolean
  }>
}

export interface Stats {
  totals: {
    rps: number
    dosen: number
    mataKuliah: number
    pertemuan: number
    cpmk: number
    referensi: number
    sks: number
  }
  rpsByStatus: Array<{ status: string; count: number }>
  rpsByProdi: Array<{ prodi: string; count: number }>
  prodiStats: Array<{
    prodi: string
    rpsCount: number
    dosenCount: number
    mkCount: number
  }>
}

// ===== API calls =====
export const api = {
  // Dosen
  listDosen: () => fetchJson<Dosen[]>('/api/dosen'),
  getDosen: (id: string) => fetchJson<Dosen>(`/api/dosen/${id}`),
  createDosen: (data: Partial<Dosen>) =>
    fetchJson<Dosen>('/api/dosen', { method: 'POST', body: JSON.stringify(data) }),
  updateDosen: (id: string, data: Partial<Dosen>) =>
    fetchJson<Dosen>(`/api/dosen/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteDosen: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/dosen/${id}`, { method: 'DELETE' }),

  // Mata Kuliah
  listMataKuliah: (prodi?: string) =>
    fetchJson<MataKuliah[]>(`/api/mata-kuliah${prodi ? `?prodi=${encodeURIComponent(prodi)}` : ''}`),
  createMataKuliah: (data: Partial<MataKuliah>) =>
    fetchJson<MataKuliah>('/api/mata-kuliah', { method: 'POST', body: JSON.stringify(data) }),
  updateMataKuliah: (id: string, data: Partial<MataKuliah>) =>
    fetchJson<MataKuliah>(`/api/mata-kuliah/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMataKuliah: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/mata-kuliah/${id}`, { method: 'DELETE' }),

  // RPS
  listRps: (params?: { status?: string; dosenId?: string; prodi?: string }) => {
    const qs = new URLSearchParams()
    if (params?.status) qs.set('status', params.status)
    if (params?.dosenId) qs.set('dosenId', params.dosenId)
    if (params?.prodi) qs.set('prodi', params.prodi)
    const query = qs.toString()
    return fetchJson<Rps[]>(`/api/rps${query ? `?${query}` : ''}`)
  },
  getRps: (id: string) => fetchJson<RpsDetail>(`/api/rps/${id}`),
  createRps: (data: Record<string, unknown>) =>
    fetchJson<Rps>('/api/rps', { method: 'POST', body: JSON.stringify(data) }),
  updateRps: (id: string, data: Record<string, unknown>) =>
    fetchJson<Rps>(`/api/rps/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRps: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/rps/${id}`, { method: 'DELETE' }),
  cloneRps: (id: string, data: { tahunAjaran: string; semester: string; kelas?: string | null; judul?: string }) =>
    fetchJson<Rps>(`/api/rps/${id}/clone`, { method: 'POST', body: JSON.stringify(data) }),

  // CPMK
  listCpmk: (rpsId: string) => fetchJson<Cpmk[]>(`/api/rps/${rpsId}/cpmk`),
  createCpmk: (rpsId: string, data: { kode: string; deskripsi: string; urutan?: number }) =>
    fetchJson<Cpmk>(`/api/rps/${rpsId}/cpmk`, { method: 'POST', body: JSON.stringify(data) }),
  updateCpmk: (rpsId: string, cpmkId: string, data: Record<string, unknown>) =>
    fetchJson<Cpmk>(`/api/rps/${rpsId}/cpmk/${cpmkId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCpmk: (rpsId: string, cpmkId: string) =>
    fetchJson<{ success: boolean }>(`/api/rps/${rpsId}/cpmk/${cpmkId}`, { method: 'DELETE' }),

  // Sub CPMK
  createSubCpmk: (cpmkId: string, data: { kode: string; deskripsi: string; urutan?: number }) =>
    fetchJson<SubCpmk>(`/api/cpmk/${cpmkId}/sub-cpmk`, { method: 'POST', body: JSON.stringify(data) }),
  updateSubCpmk: (id: string, data: Record<string, unknown>) =>
    fetchJson<SubCpmk>(`/api/sub-cpmk/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSubCpmk: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/sub-cpmk/${id}`, { method: 'DELETE' }),

  // Pertemuan
  listPertemuan: (rpsId: string) => fetchJson<Pertemuan[]>(`/api/rps/${rpsId}/pertemuan`),
  createPertemuan: (rpsId: string, data: Record<string, unknown>) =>
    fetchJson<Pertemuan>(`/api/rps/${rpsId}/pertemuan`, { method: 'POST', body: JSON.stringify(data) }),
  updatePertemuan: (id: string, data: Record<string, unknown>) =>
    fetchJson<Pertemuan>(`/api/pertemuan/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePertemuan: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/pertemuan/${id}`, { method: 'DELETE' }),

  // Referensi
  listReferensi: (rpsId: string) => fetchJson<Referensi[]>(`/api/rps/${rpsId}/referensi`),
  createReferensi: (rpsId: string, data: Record<string, unknown>) =>
    fetchJson<Referensi>(`/api/rps/${rpsId}/referensi`, { method: 'POST', body: JSON.stringify(data) }),
  updateReferensi: (id: string, data: Record<string, unknown>) =>
    fetchJson<Referensi>(`/api/referensi/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReferensi: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/referensi/${id}`, { method: 'DELETE' }),

  // Penilaian
  listPenilaian: (rpsId: string) => fetchJson<KomponenPenilaian[]>(`/api/rps/${rpsId}/penilaian`),
  createPenilaian: (rpsId: string, data: Record<string, unknown>) =>
    fetchJson<KomponenPenilaian>(`/api/rps/${rpsId}/penilaian`, { method: 'POST', body: JSON.stringify(data) }),
  updatePenilaian: (id: string, data: Record<string, unknown>) =>
    fetchJson<KomponenPenilaian>(`/api/penilaian/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePenilaian: (id: string) =>
    fetchJson<{ success: boolean }>(`/api/penilaian/${id}`, { method: 'DELETE' }),

  // Stats
  getStats: () => fetchJson<Stats>('/api/stats'),

  // CPL Prodi (OBE)
  listCplProdi: (rpsId: string) =>
    fetchJson<Array<CplProdi & { korelasi: KorelasiCplSubCpmk[] }>>(`/api/rps/${rpsId}/cpl-prodi`),
  createCplProdi: (
    rpsId: string,
    data: { kode: string; deskripsi: string; urutan?: number }
  ) =>
    fetchJson<CplProdi>(`/api/rps/${rpsId}/cpl-prodi`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCplProdi: (
    rpsId: string,
    cplId: string,
    data: Partial<{ kode: string; deskripsi: string; urutan: number }>
  ) =>
    fetchJson<CplProdi>(`/api/rps/${rpsId}/cpl-prodi/${cplId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCplProdi: (rpsId: string, cplId: string) =>
    fetchJson<{ success: boolean }>(`/api/rps/${rpsId}/cpl-prodi/${cplId}`, {
      method: 'DELETE',
    }),

  // Korelasi CPL -> Sub-CPMK (OBE)
  listKorelasi: (rpsId: string) =>
    fetchJson<Array<KorelasiCplSubCpmk & { cplProdi?: CplProdi | null }>>(`/api/rps/${rpsId}/korelasi`),
  createKorelasi: (
    rpsId: string,
    data: {
      cplProdiId?: string | null
      subCpmkKode?: string
      subCpmkId?: string
      bobot?: string | null
      jumlahMinggu?: number
      urutan?: number
    }
  ) =>
    fetchJson<KorelasiCplSubCpmk>(`/api/rps/${rpsId}/korelasi`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateKorelasi: (
    rpsId: string,
    korId: string,
    data: Partial<{
      cplProdiId: string | null
      subCpmkKode: string | null
      subCpmkId: string | null
      bobot: string | null
      jumlahMinggu: number
      urutan: number
    }>
  ) =>
    fetchJson<KorelasiCplSubCpmk>(`/api/rps/${rpsId}/korelasi/${korId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteKorelasi: (rpsId: string, korId: string) =>
    fetchJson<{ success: boolean }>(`/api/rps/${rpsId}/korelasi/${korId}`, {
      method: 'DELETE',
    }),

  // Create RPS lengkap dengan semua relasi (dari hasil generate AI)
  createFullRps: (data: {
    mataKuliahId: string
    dosenId: string
    tahunAjaran: string
    semester: string
    kelas?: string | null
    judul: string
    kurikulum?: string
    status?: string
    generated: FullRpsGenerated
  }) => fetchJson<Rps>('/api/rps/create-full', { method: 'POST', body: JSON.stringify(data) }),

  // AI
  generateFullRps: (data: {
    namaMataKuliah: string
    kodeMataKuliah?: string
    deskripsiMataKuliah: string
    sks: number
    prodi: string
    semester: number
    prasyarat?: string
    jumlahCpmk?: number
    jumlahPertemuan?: number
    useWebSearch?: boolean
  }) =>
    fetchJson<{ jobId: string; status: string }>('/api/ai/generate-full-rps', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getGenerateJobStatus: (jobId: string) =>
    fetchJson<{
      status: 'pending' | 'running' | 'done' | 'error'
      progress: number
      progressLabel: string
      result?: FullRpsGenerated
      error?: string
    }>(`/api/ai/generate-full-rps/${jobId}`),
  generateCpmk: (data: {
    namaMataKuliah: string
    deskripsi: string
    sks: number
    prodi: string
    semester: number
    jumlahCpmk?: number
  }) =>
    fetchJson<{ jobId: string; status: string }>('/api/ai/generate-cpmk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  generatePertemuan: (data: Record<string, unknown>) =>
    fetchJson<{ jobId: string; status: string }>('/api/ai/generate-pertemuan', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  generateReferensi: (data: { namaMataKuliah: string; deskripsi: string; prodi: string }) =>
    fetchJson<{ jobId: string; status: string }>('/api/ai/generate-referensi', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  // Generic AI job status poller (shared by all async AI endpoints)
  getAiJobStatus: (jobId: string) =>
    fetchJson<{
      status: 'pending' | 'running' | 'done' | 'error'
      progress: number
      progressLabel: string
      result?: unknown
      error?: string
    }>(`/api/ai/job/${jobId}`),
  askAssistant: (question: string, context?: string) =>
    fetchJson<{ answer: string }>('/api/ai/assistant', {
      method: 'POST',
      body: JSON.stringify({ question, context }),
    }),
}

// Export URL builder
export function exportUrl(rpsId: string, format: 'docx' | 'pdf') {
  return `/api/rps/${rpsId}/export?format=${format}`
}
