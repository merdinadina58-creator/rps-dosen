import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const [
      totalRps,
      totalDosen,
      totalMataKuliah,
      totalPertemuan,
      totalCpmk,
      totalReferensi,
      rpsByStatus,
      rpsByProdi,
      dosenByProdi,
      mkByProdi,
    ] = await Promise.all([
      db.rps.count(),
      db.dosen.count(),
      db.mataKuliah.count(),
      db.pertemuan.count(),
      db.cpmk.count(),
      db.referensi.count(),
      db.rps.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      db.rps.findMany({
        select: {
          mataKuliah: { select: { prodi: true } },
        },
      }),
      db.dosen.groupBy({
        by: ['prodi'],
        _count: { _all: true },
      }),
      db.mataKuliah.groupBy({
        by: ['prodi'],
        _count: { _all: true },
      }),
    ])

    // Aggregate RPS per prodi
    const prodiCountMap = new Map<string, number>()
    for (const r of rpsByProdi) {
      const prodi = r.mataKuliah.prodi
      prodiCountMap.set(prodi, (prodiCountMap.get(prodi) ?? 0) + 1)
    }

    const totalSksResult = await db.mataKuliah.aggregate({ _sum: { sks: true } })

    // Prodi list (union of all)
    const allProdi = new Set<string>()
    dosenByProdi.forEach((d) => allProdi.add(d.prodi))
    mkByProdi.forEach((m) => allProdi.add(m.prodi))
    prodiCountMap.forEach((_, k) => allProdi.add(k))

    const prodiStats = Array.from(allProdi).map((prodi) => {
      const rpsCount = prodiCountMap.get(prodi) ?? 0
      const dosenCount = dosenByProdi.find((d) => d.prodi === prodi)?._count._all ?? 0
      const mkCount = mkByProdi.find((m) => m.prodi === prodi)?._count._all ?? 0
      return { prodi, rpsCount, dosenCount, mkCount }
    })

    return NextResponse.json({
      totals: {
        rps: totalRps,
        dosen: totalDosen,
        mataKuliah: totalMataKuliah,
        pertemuan: totalPertemuan,
        cpmk: totalCpmk,
        referensi: totalReferensi,
        sks: totalSksResult._sum.sks ?? 0,
      },
      rpsByStatus: rpsByStatus.map((s) => ({
        status: s.status,
        count: s._count._all,
      })),
      rpsByProdi: Array.from(prodiCountMap.entries()).map(([prodi, count]) => ({
        prodi,
        count,
      })),
      prodiStats,
    })
  } catch (error) {
    console.error('GET /api/stats error:', error)
    return NextResponse.json({ error: 'Gagal mengambil statistik' }, { status: 500 })
  }
}
