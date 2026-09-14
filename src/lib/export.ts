import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
} from 'docx'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { db } from '@/lib/db'

const execAsync = promisify(exec)

export interface RpsExportData {
  id: string
  judul: string
  tahunAjaran: string
  semester: string
  kelas: string | null
  universitas: string | null
  fakultas: string | null
  kodeDokumen: string | null
  tglPenyusunan: Date | null
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
  mataKuliah: {
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
  }
  dosen: {
    nama: string
    nip: string | null
    email: string | null
    prodi: string
    jabatan: string | null
  }
  cplProdi: Array<{ kode: string; deskripsi: string }>
  cpmk: Array<{
    kode: string
    deskripsi: string
    subCpmk: Array<{ kode: string; deskripsi: string }>
  }>
  korelasi: Array<{
    subCpmkKode: string | null
    cplKode: string | null
    bobot: string | null
    jumlahMinggu: number
  }>
  pertemuan: Array<{
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
  }>
  referensi: Array<{
    jenis: string
    judul: string
    pengarang: string | null
    penerbit: string | null
    tahun: string | null
    url: string | null
    isUtama: boolean
  }>
  penilaian: Array<{
    nama: string
    bobot: number
    bentuk: string | null
    keterangan: string | null
  }>
}

export async function loadRpsForExport(rpsId: string): Promise<RpsExportData> {
  const rps = await db.rps.findUnique({
    where: { id: rpsId },
    include: {
      mataKuliah: true,
      dosen: true,
      cpmk: {
        orderBy: { urutan: 'asc' },
        include: { subCpmk: { orderBy: { urutan: 'asc' } } },
      },
      pertemuan: { orderBy: { urutan: 'asc' } },
      referensi: { orderBy: { urutan: 'asc' } },
      penilaian: { orderBy: { urutan: 'asc' } },
      cplProdi: { orderBy: { urutan: 'asc' } },
      korelasi: {
        orderBy: { urutan: 'asc' },
        include: { cplProdi: true },
      },
    },
  })

  if (!rps) throw new Error('RPS tidak ditemukan')

  return {
    id: rps.id,
    judul: rps.judul,
    tahunAjaran: rps.tahunAjaran,
    semester: rps.semester,
    kelas: rps.kelas,
    universitas: rps.universitas,
    fakultas: rps.fakultas,
    kodeDokumen: rps.kodeDokumen,
    tglPenyusunan: rps.tglPenyusunan,
    deskripsi: rps.deskripsi,
    deskripsiSingkat: rps.deskripsiSingkat,
    bahanKajian: rps.bahanKajian,
    cpl: rps.cpl,
    mediaSoftware: rps.mediaSoftware,
    mediaHardware: rps.mediaHardware,
    teamTeaching: rps.teamTeaching,
    mataKuliahSyarat: rps.mataKuliahSyarat,
    otorisasiDosenPengembang: rps.otorisasiDosenPengembang,
    otorisasiKoordinatorRmk: rps.otorisasiKoordinatorRmk,
    otorisasiKaprodi: rps.otorisasiKaprodi,
    mingguPertemuan: rps.mingguPertemuan,
    status: rps.status,
    kurikulum: rps.kurikulum,
    mataKuliah: {
      kode: rps.mataKuliah.kode,
      nama: rps.mataKuliah.nama,
      sks: rps.mataKuliah.sks,
      sksTeori: rps.mataKuliah.sksTeori,
      sksPraktek: rps.mataKuliah.sksPraktek,
      rumpunMk: rps.mataKuliah.rumpunMk,
      semester: rps.mataKuliah.semester,
      prodi: rps.mataKuliah.prodi,
      deskripsi: rps.mataKuliah.deskripsi,
      prasyarat: rps.mataKuliah.prasyarat,
    },
    dosen: {
      nama: rps.dosen.nama,
      nip: rps.dosen.nip,
      email: rps.dosen.email,
      prodi: rps.dosen.prodi,
      jabatan: rps.dosen.jabatan,
    },
    cplProdi: rps.cplProdi.map((c) => ({ kode: c.kode, deskripsi: c.deskripsi })),
    cpmk: rps.cpmk.map((c) => ({
      kode: c.kode,
      deskripsi: c.deskripsi,
      subCpmk: c.subCpmk.map((s) => ({ kode: s.kode, deskripsi: s.deskripsi })),
    })),
    korelasi: rps.korelasi.map((k) => ({
      subCpmkKode: k.subCpmkKode,
      cplKode: k.cplProdi?.kode ?? null,
      bobot: k.bobot,
      jumlahMinggu: k.jumlahMinggu,
    })),
    pertemuan: rps.pertemuan.map((p) => ({
      mingguKe: p.mingguKe,
      subCpmkUtama: p.subCpmkUtama,
      kemampuanAkhir: p.kemampuanAkhir,
      indikator: p.indikator,
      teknikPenilaian: p.teknikPenilaian,
      kriteriaPenilaian: p.kriteriaPenilaian,
      tmDaring: p.tmDaring,
      materi: p.materi,
      metode: p.metode,
      aktivitasDosen: p.aktivitasDosen,
      aktivitasMhs: p.aktivitasMhs,
      pengalamanBelajar: p.pengalamanBelajar,
      indikatorPenilaian: p.indikatorPenilaian,
      bobotPenilaian: p.bobotPenilaian,
      estimasiWaktu: p.estimasiWaktu,
    })),
    referensi: rps.referensi.map((r) => ({
      jenis: r.jenis,
      judul: r.judul,
      pengarang: r.pengarang,
      penerbit: r.penerbit,
      tahun: r.tahun,
      url: r.url,
      isUtama: r.isUtama,
    })),
    penilaian: rps.penilaian.map((p) => ({
      nama: p.nama,
      bobot: p.bobot,
      bentuk: p.bentuk,
      keterangan: p.keterangan,
    })),
  }
}

const cellBorder = {
  top: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '999999' },
}

function headerCell(
  text: string,
  width?: number,
  align?: typeof AlignmentType.LEFT
) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: { type: ShadingType.CLEAR, fill: 'E8E8E8' },
    borders: cellBorder,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 18 })],
        alignment: align || AlignmentType.CENTER,
      }),
    ],
  })
}

function bodyCell(
  text: string,
  width?: number,
  align?: typeof AlignmentType.LEFT,
  bold?: boolean
) {
  // Allow multi-line via \n
  const lines = (text || '-').split(/\r?\n/)
  const paragraphs = lines.map(
    (line, idx) =>
      new Paragraph({
        children: [new TextRun({ text: line || '-', size: 18, bold })],
        alignment: align || AlignmentType.LEFT,
        spacing: { before: idx === 0 ? 0 : 20, after: 0 },
      })
  )
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    borders: cellBorder,
    children: paragraphs,
  })
}

function sectionTitle(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 24 })],
  })
}

function bodyParagraph(text: string | null) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 80 },
    children: [
      new TextRun({ text: text || '-', size: 22 }),
    ],
  })
}

function formatDate(d: Date | null): string {
  if (!d) return '-'
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return '-'
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

export async function generateRpsDocx(rpsId: string): Promise<Buffer> {
  const data = await loadRpsForExport(rpsId)

  const sections = []

  // ===== Section 1: Cover / Header / Identitas / Otorisasi / CPL / CPMK / Sub-CPMK / Korelasi =====
  sections.push({
    properties: {},
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `RPS ${data.mataKuliah.kode} - ${data.mataKuliah.nama}`,
                italics: true,
                size: 16,
                color: '666666',
              }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Halaman ', size: 16, color: '666666' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '666666' }),
              new TextRun({ text: ' dari ', size: 16, color: '666666' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '666666' }),
            ],
          }),
        ],
      }),
    },
    children: [
      // ===== HEADER INSTITUSI =====
      ...(data.universitas
        ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 },
              children: [
                new TextRun({ text: data.universitas.toUpperCase(), bold: true, size: 26 }),
              ],
            }),
          ]
        : []),
      ...(data.fakultas
        ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 60 },
              children: [new TextRun({ text: data.fakultas, size: 22 })],
            }),
          ]
        : []),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [
          new TextRun({
            text: `Program Studi ${data.mataKuliah.prodi}`,
            size: 22,
          }),
        ],
      }),

      // ===== JUDUL UTAMA =====
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 100 },
        children: [new TextRun({ text: 'RENCANA PEMBELAJARAN SEMESTER', bold: true, size: 32 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: '(RPS)', size: 26 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [
          new TextRun({
            text: `Kode Dokumen: ${data.kodeDokumen || '-'}    Kurikulum ${data.kurikulum}    T.A. ${data.tahunAjaran}`,
            size: 20,
            color: '666666',
          }),
        ],
      }),

      // ===== IDENTITAS TABLE =====
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [headerCell('KOMPONEN', 35), headerCell('KETERANGAN', 65)],
          }),
          new TableRow({
            children: [
              bodyCell('Nama Mata Kuliah', 35, AlignmentType.LEFT, true),
              bodyCell(data.mataKuliah.nama, 65),
            ],
          }),
          new TableRow({
            children: [
              bodyCell('Kode Mata Kuliah', 35, AlignmentType.LEFT, true),
              bodyCell(data.mataKuliah.kode, 65),
            ],
          }),
          new TableRow({
            children: [
              bodyCell('Rumpun Mata Kuliah', 35, AlignmentType.LEFT, true),
              bodyCell(data.mataKuliah.rumpunMk || '-', 65),
            ],
          }),
          new TableRow({
            children: [
              bodyCell('Bobot SKS', 35, AlignmentType.LEFT, true),
              bodyCell(
                `${data.mataKuliah.sks} SKS (T=${data.mataKuliah.sksTeori}, P=${data.mataKuliah.sksPraktek})`,
                65
              ),
            ],
          }),
          new TableRow({
            children: [
              bodyCell('Semester', 35, AlignmentType.LEFT, true),
              bodyCell(
                `${data.mataKuliah.semester} (${data.semester})`,
                65
              ),
            ],
          }),
          new TableRow({
            children: [
              bodyCell('Tanggal Penyusunan', 35, AlignmentType.LEFT, true),
              bodyCell(formatDate(data.tglPenyusunan), 65),
            ],
          }),
          new TableRow({
            children: [
              bodyCell('Kelas', 35, AlignmentType.LEFT, true),
              bodyCell(data.kelas || '-', 65),
            ],
          }),
          new TableRow({
            children: [
              bodyCell('Dosen Pengampu', 35, AlignmentType.LEFT, true),
              bodyCell(data.dosen.nama, 65),
            ],
          }),
          new TableRow({
            children: [
              bodyCell('NIDN/NIP', 35, AlignmentType.LEFT, true),
              bodyCell(data.dosen.nip || '-', 65),
            ],
          }),
          new TableRow({
            children: [
              bodyCell('Mata Kuliah Syarat', 35, AlignmentType.LEFT, true),
              bodyCell(
                data.mataKuliahSyarat || data.mataKuliah.prasyarat || '-',
                65
              ),
            ],
          }),
        ],
      }),

      new Paragraph({ spacing: { before: 400 }, children: [] }),

      // ===== OTORISASI TABLE =====
      sectionTitle('A. OTORISASI / PENGESAHAN'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              headerCell('Dosen Pengembang RPS', 33),
              headerCell('Koordinator RMK', 34),
              headerCell('Kaprodi', 33),
            ],
          }),
          new TableRow({
            children: [
              bodyCell(data.otorisasiDosenPengembang || '-', 33, AlignmentType.CENTER, true),
              bodyCell(data.otorisasiKoordinatorRmk || '-', 34, AlignmentType.CENTER, true),
              bodyCell(data.otorisasiKaprodi || '-', 33, AlignmentType.CENTER, true),
            ],
          }),
          new TableRow({
            children: [
              bodyCell('\n\n____________________\nNIDN/NIP', 33, AlignmentType.CENTER),
              bodyCell('\n\n____________________\nNIDN/NIP', 34, AlignmentType.CENTER),
              bodyCell('\n\n____________________\nNIDN/NIP', 33, AlignmentType.CENTER),
            ],
          }),
        ],
      }),

      // ===== CPL PRODI =====
      sectionTitle('B. CAPAIAN PEMBELAJARAN LULUSAN (CPL) PRODI'),
      ...(data.cplProdi.length > 0
        ? [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [headerCell('Kode', 15), headerCell('Deskripsi CPL', 85)],
                }),
                ...data.cplProdi.map(
                  (c) =>
                    new TableRow({
                      children: [
                        bodyCell(c.kode, 15, AlignmentType.CENTER, true),
                        bodyCell(c.deskripsi, 85),
                      ],
                    })
                ),
              ],
            }),
          ]
        : [
            new Paragraph({
              spacing: { line: 312 },
              children: [
                new TextRun({ text: data.cpl || '-', size: 22 }),
              ],
            }),
          ]),

      // ===== CPMK =====
      sectionTitle('C. CAPAIAN PEMBELAJARAN MATA KULIAH (CPMK)'),
      ...(data.cpmk.length > 0
        ? data.cpmk.map(
            (c) =>
              new Paragraph({
                spacing: { before: 100, after: 80, line: 312 },
                children: [
                  new TextRun({ text: `${c.kode}: `, bold: true, size: 22 }),
                  new TextRun({ text: c.deskripsi, size: 22 }),
                ],
              })
          )
        : [
            new Paragraph({
              children: [new TextRun({ text: '-', size: 22 })],
            }),
          ]),

      // ===== Sub-CPMK =====
      sectionTitle('D. SUB-CPMK'),
      ...data.cpmk
        .flatMap((c) => c.subCpmk)
        .map(
          (s) =>
            new Paragraph({
              indent: { left: 360 },
              spacing: { line: 312, after: 60 },
              children: [
                new TextRun({ text: `${s.kode}: `, bold: true, size: 22 }),
                new TextRun({ text: s.deskripsi, size: 22 }),
              ],
            })
        ),

      // ===== KORELASI =====
      sectionTitle('E. KORELASI CPL TERHADAP CPMK ATAU SUB-CPMK'),
      ...(data.korelasi.length > 0 && data.cplProdi.length > 0
        ? [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  tableHeader: true,
                  children: [
                    headerCell('Sub-CPMK', 18),
                    ...data.cplProdi.map((c) =>
                      headerCell(c.kode, Math.floor(60 / data.cplProdi.length))
                    ),
                    headerCell('Bobot Penilaian', 12),
                    headerCell('Jumlah Minggu', 10),
                  ],
                }),
                ...data.korelasi.map(
                  (k) =>
                    new TableRow({
                      cantSplit: true,
                      children: [
                        bodyCell(k.subCpmkKode || '-', 18, AlignmentType.CENTER, true),
                        ...data.cplProdi.map((cpl) => {
                          const match =
                            k.cplKode === cpl.kode ||
                            (k.cplKode === '' && cpl.kode === k.cplKode)
                          return bodyCell(
                            match ? k.bobot || '✓' : '',
                            Math.floor(60 / data.cplProdi.length),
                            AlignmentType.CENTER
                          )
                        }),
                        bodyCell(k.bobot || '-', 12, AlignmentType.CENTER),
                        bodyCell(String(k.jumlahMinggu), 10, AlignmentType.CENTER),
                      ],
                    })
                ),
              ],
            }),
          ]
        : [
            new Paragraph({
              children: [new TextRun({ text: 'Belum ada korelasi CPL terhadap Sub-CPMK.', size: 22 })],
            }),
          ]),
    ],
  })

  // ===== Section 2: Deskripsi, Bahan Kajian, Referensi, Media, Rencana Pembelajaran =====
  sections.push({
    properties: {},
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `RPS ${data.mataKuliah.kode} - ${data.mataKuliah.nama}`,
                italics: true,
                size: 16,
                color: '666666',
              }),
            ],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Halaman ', size: 16, color: '666666' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '666666' }),
              new TextRun({ text: ' dari ', size: 16, color: '666666' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '666666' }),
            ],
          }),
        ],
      }),
    },
    children: [
      // ===== DESKRIPSI SINGKAT =====
      sectionTitle('F. DESKRIPSI SINGKAT MATA KULIAH'),
      bodyParagraph(data.deskripsiSingkat),

      // ===== BAHAN KAJIAN =====
      sectionTitle('G. BAHAN KAJIAN'),
      bodyParagraph(data.bahanKajian),

      // ===== DESKRIPSI LENGKAP (LEGACY) =====
      sectionTitle('H. DESKRIPSI MATA KULIAH (LENGKAP)'),
      bodyParagraph(data.deskripsi || data.mataKuliah.deskripsi),

      // ===== PUSTAKA / REFERENSI =====
      sectionTitle('I. PUSTAKA / REFERENSI'),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun({ text: 'Sumber Utama:', bold: true, size: 22 })],
      }),
      ...data.referensi
        .filter((r) => r.isUtama)
        .map(
          (r, i) =>
            new Paragraph({
              spacing: { line: 312, after: 80 },
              indent: { left: 360, hanging: 360 },
              children: [
                new TextRun({ text: `${i + 1}. `, size: 22 }),
                new TextRun({ text: r.pengarang ? `${r.pengarang}. ` : '', size: 22, italics: true }),
                new TextRun({ text: `${r.judul}. `, size: 22, bold: true }),
                new TextRun({ text: [r.penerbit, r.tahun].filter(Boolean).join(', ') + '.', size: 22 }),
                ...(r.url ? [new TextRun({ text: ` Tersedia di: ${r.url}`, size: 22, color: '0000FF' })] : []),
              ],
            })
        ),
      new Paragraph({
        spacing: { before: 200, after: 150 },
        children: [new TextRun({ text: 'Sumber Pendukung:', bold: true, size: 22 })],
      }),
      ...data.referensi
        .filter((r) => !r.isUtama)
        .map(
          (r, i) =>
            new Paragraph({
              spacing: { line: 312, after: 80 },
              indent: { left: 360, hanging: 360 },
              children: [
                new TextRun({ text: `${i + 1}. `, size: 22 }),
                new TextRun({ text: r.pengarang ? `${r.pengarang}. ` : '', size: 22, italics: true }),
                new TextRun({ text: `${r.judul}. `, size: 22, bold: true }),
                new TextRun({ text: [r.penerbit, r.tahun].filter(Boolean).join(', ') + '.', size: 22 }),
                ...(r.url ? [new TextRun({ text: ` Tersedia di: ${r.url}`, size: 22, color: '0000FF' })] : []),
              ],
            })
        ),

      // ===== MEDIA PEMBELAJARAN =====
      sectionTitle('J. MEDIA PEMBELAJARAN'),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: 'Software: ', bold: true, size: 22 }), new TextRun({ text: data.mediaSoftware || '-', size: 22 })],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: 'Hardware: ', bold: true, size: 22 }), new TextRun({ text: data.mediaHardware || '-', size: 22 })],
      }),

      // ===== TEAM TEACHING & MATA KULIAH SYARAT =====
      sectionTitle('K. TEAM TEACHING & MATA KULIAH SYARAT'),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: 'Team Teaching: ', bold: true, size: 22 }),
          new TextRun({ text: data.teamTeaching ? 'Ya' : 'Tidak', size: 22 }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({ text: 'Mata Kuliah Syarat: ', bold: true, size: 22 }),
          new TextRun({ text: data.mataKuliahSyarat || data.mataKuliah.prasyarat || '-', size: 22 }),
        ],
      }),

      // ===== RENCANA PEMBELAJARAN MINGGUAN =====
      sectionTitle('L. RENCANA PEMBELAJARAN MINGGUAN'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              headerCell('Minggu ke-', 5),
              headerCell('Sub-CPMK', 8),
              headerCell('Kemampuan Akhir', 14),
              headerCell('Indikator', 12),
              headerCell('Teknik & Kriteria Penilaian', 18),
              headerCell('TM/Daring', 6),
              headerCell('Materi Pembelajaran', 20),
              headerCell('Bobot Penilaian (%)', 7),
            ],
          }),
          ...data.pertemuan.map(
            (p) =>
              new TableRow({
                cantSplit: true,
                children: [
                  bodyCell(String(p.mingguKe), 5, AlignmentType.CENTER, true),
                  bodyCell(p.subCpmkUtama || '-', 8),
                  bodyCell(p.kemampuanAkhir || '-', 14),
                  bodyCell(p.indikator || '-', 12),
                  bodyCell(
                    `${p.teknikPenilaian || '-'}\n${p.kriteriaPenilaian || ''}`,
                    18
                  ),
                  bodyCell(p.tmDaring || '-', 6, AlignmentType.CENTER),
                  bodyCell(p.materi || '-', 20),
                  bodyCell(`${p.bobotPenilaian}%`, 7, AlignmentType.CENTER),
                ],
              })
          ),
          new TableRow({
            children: [
              new TableCell({
                width: { size: 93, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: 'F0F0F0' },
                borders: cellBorder,
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'TOTAL', bold: true, size: 20 })],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
              new TableCell({
                width: { size: 7, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: 'F0F0F0' },
                borders: cellBorder,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${data.pertemuan.reduce((s, p) => s + p.bobotPenilaian, 0)}%`,
                        bold: true,
                        size: 20,
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // ===== KOMPONEN PENILAIAN =====
      sectionTitle('M. KOMPONEN PENILAIAN'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              headerCell('No', 8),
              headerCell('Komponen Penilaian', 40),
              headerCell('Bentuk', 32),
              headerCell('Bobot', 20),
            ],
          }),
          ...data.penilaian.map(
            (p, i) =>
              new TableRow({
                cantSplit: true,
                children: [
                  bodyCell(String(i + 1), 8, AlignmentType.CENTER),
                  bodyCell(p.nama, 40),
                  bodyCell(p.bentuk || '-', 32),
                  bodyCell(`${p.bobot}%`, 20, AlignmentType.CENTER),
                ],
              })
          ),
          new TableRow({
            children: [
              new TableCell({
                width: { size: 80, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: 'F0F0F0' },
                borders: cellBorder,
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: 'TOTAL', bold: true, size: 20 })],
                    alignment: AlignmentType.RIGHT,
                  }),
                ],
              }),
              new TableCell({
                width: { size: 20, type: WidthType.PERCENTAGE },
                shading: { type: ShadingType.CLEAR, fill: 'F0F0F0' },
                borders: cellBorder,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${data.penilaian.reduce((s, p) => s + p.bobot, 0)}%`,
                        bold: true,
                        size: 20,
                      }),
                    ],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })

  const doc = new Document({
    creator: 'RPS Dosen Management System',
    title: data.judul,
    description: `RPS ${data.mataKuliah.nama} - ${data.tahunAjaran}`,
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
    },
    sections: sections as never,
  })

  const buffer = await Packer.toBuffer(doc)
  return buffer
}

/**
 * Convert DOCX buffer to PDF using LibreOffice
 */
export async function convertDocxToPdf(docxBuffer: Buffer, filename: string): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rps-export-'))
  const docxPath = path.join(tmpDir, `${filename}.docx`)

  try {
    await fs.writeFile(docxPath, docxBuffer)

    // Convert with LibreOffice
    await execAsync(`soffice --headless --convert-to pdf --outdir "${tmpDir}" "${docxPath}"`, {
      timeout: 60000,
    })

    const pdfPath = path.join(tmpDir, `${filename}.pdf`)
    const pdfBuffer = await fs.readFile(pdfPath)

    return pdfBuffer
  } finally {
    // Cleanup
    try {
      await fs.rm(tmpDir, { recursive: true, force: true })
    } catch {
      // ignore
    }
  }
}
