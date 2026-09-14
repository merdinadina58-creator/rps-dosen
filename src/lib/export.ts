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
  LevelFormat,
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
  deskripsi: string | null
  cpl: string | null
  mingguPertemuan: number
  status: string
  kurikulum: string
  mataKuliah: {
    kode: string
    nama: string
    sks: number
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
  cpmk: Array<{
    kode: string
    deskripsi: string
    subCpmk: Array<{ kode: string; deskripsi: string }>
  }>
  pertemuan: Array<{
    mingguKe: number
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
    },
  })

  if (!rps) throw new Error('RPS tidak ditemukan')

  return {
    id: rps.id,
    judul: rps.judul,
    tahunAjaran: rps.tahunAjaran,
    semester: rps.semester,
    kelas: rps.kelas,
    deskripsi: rps.deskripsi,
    cpl: rps.cpl,
    mingguPertemuan: rps.mingguPertemuan,
    status: rps.status,
    kurikulum: rps.kurikulum,
    mataKuliah: {
      kode: rps.mataKuliah.kode,
      nama: rps.mataKuliah.nama,
      sks: rps.mataKuliah.sks,
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
    cpmk: rps.cpmk.map((c) => ({
      kode: c.kode,
      deskripsi: c.deskripsi,
      subCpmk: c.subCpmk.map((s) => ({ kode: s.kode, deskripsi: s.deskripsi })),
    })),
    pertemuan: rps.pertemuan.map((p) => ({
      mingguKe: p.mingguKe,
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

function headerCell(text: string, width?: number) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    shading: { type: ShadingType.CLEAR, fill: 'E8E8E8' },
    borders: cellBorder,
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20 })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  })
}

function bodyCell(text: string, width?: number, align?: typeof AlignmentType.LEFT) {
  return new TableCell({
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    borders: cellBorder,
    children: [
      new Paragraph({
        children: [new TextRun({ text: text || '-', size: 20 })],
        alignment: align || AlignmentType.LEFT,
      }),
    ],
  })
}

export async function generateRpsDocx(rpsId: string): Promise<Buffer> {
  const data = await loadRpsForExport(rpsId)

  const sections = []

  // ===== Section 1: Cover / Identitas =====
  sections.push({
    properties: {},
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'RPS - Rencana Pembelajaran Semester', italics: true, size: 16, color: '666666' })],
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
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 },
        children: [new TextRun({ text: 'RENCANA PEMBELAJARAN SEMESTER', bold: true, size: 36 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
        children: [new TextRun({ text: `(RPS)`, size: 28 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 600 },
        children: [new TextRun({ text: `Kurikulum ${data.kurikulum} - T.A. ${data.tahunAjaran}`, size: 22, color: '666666' })],
      }),

      // Identitas table
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              headerCell('KOMPONEN', 30),
              headerCell('KETERANGAN', 70),
            ],
          }),
          new TableRow({ children: [bodyCell('Nama Mata Kuliah', 30), bodyCell(data.mataKuliah.nama, 70)] }),
          new TableRow({ children: [bodyCell('Kode Mata Kuliah', 30), bodyCell(data.mataKuliah.kode, 70)] }),
          new TableRow({ children: [bodyCell('Bobot SKS', 30), bodyCell(`${data.mataKuliah.sks} SKS`, 70)] }),
          new TableRow({ children: [bodyCell('Semester', 30), bodyCell(`${data.mataKuliah.semester} (${data.semester})`, 70)] }),
          new TableRow({ children: [bodyCell('Program Studi', 30), bodyCell(data.mataKuliah.prodi, 70)] }),
          new TableRow({ children: [bodyCell('Kelas', 30), bodyCell(data.kelas || '-', 70)] }),
          new TableRow({ children: [bodyCell('Dosen Pengampu', 30), bodyCell(data.dosen.nama, 70)] }),
          new TableRow({ children: [bodyCell('NIDN/NIP', 30), bodyCell(data.dosen.nip || '-', 70)] }),
          new TableRow({ children: [bodyCell('Mata Kuliah Prasyarat', 30), bodyCell(data.mataKuliah.prasyarat || '-', 70)] }),
          new TableRow({ children: [bodyCell('Status', 30), bodyCell(data.status.toUpperCase(), 70)] }),
        ],
      }),

      new Paragraph({ spacing: { before: 400 }, children: [] }),

      // Deskripsi
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
        children: [new TextRun({ text: 'A. DESKRIPSI MATA KULIAH', bold: true, size: 24 })],
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 312 },
        children: [new TextRun({ text: data.deskripsi || data.mataKuliah.deskripsi || '-', size: 22 })],
      }),

      // CPL
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
        children: [new TextRun({ text: 'B. CAPAIAN PEMBELAJARAN LULUSAN (CPL)', bold: true, size: 24 })],
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 312 },
        children: [new TextRun({ text: data.cpl || '-', size: 22 })],
      }),

      // CPMK
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
        children: [new TextRun({ text: 'C. CAPAIAN PEMBELAJARAN MATA KULIAH (CPMK)', bold: true, size: 24 })],
      }),
      ...data.cpmk.map(
        (c) =>
          new Paragraph({
            spacing: { before: 100, after: 100, line: 312 },
            children: [
              new TextRun({ text: `${c.kode}: `, bold: true, size: 22 }),
              new TextRun({ text: c.deskripsi, size: 22 }),
            ],
          })
      ),
      ...data.cpmk.flatMap((c) =>
        c.subCpmk.map(
          (s) =>
            new Paragraph({
              indent: { left: 720 },
              spacing: { line: 312 },
              children: [
                new TextRun({ text: `${s.kode}: `, bold: true, size: 20 }),
                new TextRun({ text: s.deskripsi, size: 20 }),
              ],
            })
        )
      ),
    ],
  })

  // ===== Section 2: Rencana Pembelajaran & Penilaian =====
  sections.push({
    properties: {},
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: `RPS ${data.mataKuliah.kode} - ${data.mataKuliah.nama}`, italics: true, size: 16, color: '666666' })],
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
      // Rencana mingguan
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 150 },
        children: [new TextRun({ text: 'D. RENCANA PEMBELAJARAN MINGGUAN', bold: true, size: 24 })],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [
              headerCell('Mgg', 5),
              headerCell('Materi/Bahasan', 25),
              headerCell('Metode', 12),
              headerCell('Aktivitas Dosen', 18),
              headerCell('Aktivitas Mhs', 18),
              headerCell('Bobot', 8),
              headerCell('Waktu', 14),
            ],
          }),
          ...data.pertemuan.map(
            (p) =>
              new TableRow({
                cantSplit: true,
                children: [
                  bodyCell(String(p.mingguKe), 5, AlignmentType.CENTER),
                  bodyCell(p.materi || '-', 25),
                  bodyCell(p.metode || '-', 12),
                  bodyCell(p.aktivitasDosen || '-', 18),
                  bodyCell(p.aktivitasMhs || '-', 18),
                  bodyCell(`${p.bobotPenilaian}%`, 8, AlignmentType.CENTER),
                  bodyCell(p.estimasiWaktu || '-', 14),
                ],
              })
          ),
        ],
      }),

      // Penilaian
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 150 },
        children: [new TextRun({ text: 'E. KOMPONEN PENILAIAN', bold: true, size: 24 })],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: true,
            children: [headerCell('No', 8), headerCell('Komponen Penilaian', 40), headerCell('Bentuk', 32), headerCell('Bobot', 20)],
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
                    children: [new TextRun({ text: `${data.penilaian.reduce((s, p) => s + p.bobot, 0)}%`, bold: true, size: 20 })],
                    alignment: AlignmentType.CENTER,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // Referensi
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 150 },
        children: [new TextRun({ text: 'F. REFERENSI / BAHAN PUSTAKA', bold: true, size: 24 })],
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [new TextRun({ text: 'Buku Utama:', bold: true, size: 22 })],
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
        children: [new TextRun({ text: 'Buku Pendukung / Sumber Lain:', bold: true, size: 22 })],
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
    sections: sections as any,
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
