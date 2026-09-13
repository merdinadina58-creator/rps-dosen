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
  deskripsi: string | null
  cpl: string | null
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

export interface RpsDetail extends Rps {
  cpmk: Cpmk[]
  pertemuan: Pertemuan[]
  referensi: Referensi[]
  penilaian: KomponenPenilaian[]
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

  // AI
  generateCpmk: (data: {
    namaMataKuliah: string
    deskripsi: string
    sks: number
    prodi: string
    semester: number
    jumlahCpmk?: number
  }) =>
    fetchJson<{ cpmk: Array<{ kode: string; deskripsi: string; subCpmk: Array<{ kode: string; deskripsi: string }> }> }>(
      '/api/ai/generate-cpmk',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  generatePertemuan: (data: Record<string, unknown>) =>
    fetchJson<{ pertemuan: Array<Record<string, unknown>> }>(
      '/api/ai/generate-pertemuan',
      { method: 'POST', body: JSON.stringify(data) }
    ),
  generateReferensi: (data: { namaMataKuliah: string; deskripsi: string; prodi: string }) =>
    fetchJson<{ referensi: Array<Record<string, unknown>> }>(
      '/api/ai/generate-referensi',
      { method: 'POST', body: JSON.stringify(data) }
    ),
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
