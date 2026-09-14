#!/usr/bin/env python3
"""
Fill RPS OBE Template with data from the application.

Usage: python3 fill-rps-template.py <template_path> <data_json_path> <output_path>

This script opens the original OBE template DOCX, fills in all cells with
actual RPS data, and saves the result. This preserves ALL formatting:
borders, merged cells, column widths, fonts — everything is identical
to the original template because we modify the actual file.
"""

import sys
import json
from copy import deepcopy
from docx import Document
from docx.oxml.ns import qn

def set_cell_text(cell, text, bold=False):
    """Set cell text, preserving formatting of the first paragraph."""
    if cell is None:
        return
    # Clear extra paragraphs
    for p in cell.paragraphs[1:]:
        p._element.getparent().remove(p._element)
    p = cell.paragraphs[0]
    # Clear extra runs
    for run in p.runs[1:]:
        run._element.getparent().remove(run._element)
    if p.runs:
        run = p.runs[0]
        run.text = str(text) if text else ''
        if bold:
            run.bold = True
    else:
        run = p.add_run(str(text) if text else '')
        if bold:
            run.bold = True

def fill_template(template_path, data_json_path, output_path):
    with open(data_json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    doc = Document(template_path)
    table = doc.tables[1]  # main table (77 rows × 34 cols)

    def get_cell(ri, ci):
        if ri >= len(table.rows):
            return None
        row = table.rows[ri]
        if ci >= len(row.cells):
            return None
        return row.cells[ci]

    mk = data.get('mataKuliah', {})

    # ===== Row 0: Header =====
    header_cell = get_cell(0, 0)
    if header_cell and data.get('universitas'):
        header_text = f"{data.get('universitas', '')}\nFAKULTAS {data.get('fakultas', '').upper()}\nPROGRAM STUDI {mk.get('prodi', '').upper()}"
        set_cell_text(header_cell, header_text)

    kode_cell = get_cell(0, 31)
    if kode_cell:
        set_cell_text(kode_cell, f"KODE DOKUMEN\n{data.get('kodeDokumen', '') or '.............'}")

    # ===== Row 3: Identitas =====
    set_cell_text(get_cell(3, 0), mk.get('nama', ''))
    set_cell_text(get_cell(3, 6), mk.get('kode', ''))
    set_cell_text(get_cell(3, 13), mk.get('rumpunMk', '') or '-')
    set_cell_text(get_cell(3, 20), f"T = {mk.get('sksTeori', 0)}")
    set_cell_text(get_cell(3, 23), f"P = {mk.get('sksPraktek', 0)}")
    set_cell_text(get_cell(3, 27), str(mk.get('semester', '')))
    tgl = data.get('tglPenyusunan', '')
    if tgl:
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(tgl.replace('Z', '+00:00'))
            tgl_str = dt.strftime('%d %B %Y')
        except:
            tgl_str = tgl[:10]
    else:
        tgl_str = '-'
    set_cell_text(get_cell(3, 30), tgl_str)

    # ===== Row 5: Otorisasi =====
    set_cell_text(get_cell(5, 6), data.get('otorisasiDosenPengembang', '') or '-')
    set_cell_text(get_cell(5, 20), data.get('otorisasiKoordinatorRmk', '') or '-')
    set_cell_text(get_cell(5, 25), data.get('otorisasiKaprodi', '') or '-')

    # ===== Rows 7-10: CPL Prodi =====
    cpl_list = data.get('cplProdi', [])
    for i in range(min(len(cpl_list), 4)):
        ri = 7 + i
        set_cell_text(get_cell(ri, 6), cpl_list[i].get('kode', ''))
        set_cell_text(get_cell(ri, 10), cpl_list[i].get('deskripsi', ''))

    # ===== Rows 12-17: CPMK =====
    cpmk_list = data.get('cpmk', [])
    for i in range(min(len(cpmk_list), 6)):
        ri = 12 + i
        set_cell_text(get_cell(ri, 6), cpmk_list[i].get('kode', ''))
        set_cell_text(get_cell(ri, 10), cpmk_list[i].get('deskripsi', ''))

    # ===== Rows 19-32: Sub-CPMK =====
    sub_list = []
    for c in cpmk_list:
        for s in c.get('subCpmk', []):
            sub_list.append(s)
    for i in range(min(len(sub_list), 14)):
        ri = 19 + i
        set_cell_text(get_cell(ri, 6), sub_list[i].get('kode', ''))
        set_cell_text(get_cell(ri, 10), sub_list[i].get('deskripsi', ''))

    # ===== Rows 34-47: Korelasi =====
    korelasi = data.get('korelasi', [])
    for i in range(min(len(korelasi), 14)):
        ri = 34 + i
        k = korelasi[i]
        set_cell_text(get_cell(ri, 6), k.get('subCpmkKode', ''))
        # CPL column values
        for ci, cpl in enumerate(cpl_list):
            col_off = 10 + ci * 4
            cell = get_cell(ri, col_off)
            if cell:
                set_cell_text(cell, k.get('bobot', '') if k.get('cplKode') == cpl.get('kode') else '')
        set_cell_text(get_cell(ri, 27), k.get('bobot', ''))
        set_cell_text(get_cell(ri, 32), str(k.get('jumlahMinggu', 0)))

    # ===== Row 48: Korelasi total =====
    total_bobot_kor = sum(float(k.get('bobot', '0').replace('%', '')) for k in korelasi if k.get('bobot') and '%' in str(k.get('bobot', '')))
    total_minggu = sum(k.get('jumlahMinggu', 0) for k in korelasi)
    set_cell_text(get_cell(48, 27), f"{total_bobot_kor}%")
    set_cell_text(get_cell(48, 32), str(total_minggu))

    # ===== Row 49: Deskripsi Singkat =====
    set_cell_text(get_cell(49, 6), data.get('deskripsiSingkat', '') or data.get('deskripsi', '') or '-')

    # ===== Row 50: Bahan Kajian =====
    set_cell_text(get_cell(50, 6), data.get('bahanKajian', '') or '-')

    # ===== Rows 51-52: Pustaka =====
    ref_utama = [r for r in data.get('referensi', []) if r.get('isUtama')]
    ref_pendukung = [r for r in data.get('referensi', []) if not r.get('isUtama')]
    utama_text = '\n'.join(f"{r.get('pengarang', '')}. {r.get('tahun', '')}. {r.get('judul', '')}. {r.get('penerbit', '')}" for r in ref_utama)
    set_cell_text(get_cell(51, 6), utama_text or '-')
    pendukung_text = '\n'.join(f"{r.get('judul', '')}" for r in ref_pendukung)
    set_cell_text(get_cell(52, 6), pendukung_text or '-')

    # ===== Rows 53-54: Media =====
    set_cell_text(get_cell(53, 6), f"Perangkat Lunak (software): {data.get('mediaSoftware', '') or '-'}")
    set_cell_text(get_cell(54, 6), f"Perangkat Keras (hardware): {data.get('mediaHardware', '') or '-'}")

    # ===== Row 55: Team Teaching =====
    set_cell_text(get_cell(55, 6), 'Ya' if data.get('teamTeaching') else 'Tidak')

    # ===== Row 56: Mata Kuliah Syarat =====
    set_cell_text(get_cell(56, 6), data.get('mataKuliahSyarat', '') or mk.get('prasyarat', '') or '-')

    # ===== Rows 60-75: Rencana Pembelajaran =====
    pertemuan = data.get('pertemuan', [])
    for i in range(min(len(pertemuan), 16)):
        p = pertemuan[i]
        ri = 60 + i
        is_uts = p.get('mingguKe') == 8
        is_uas = p.get('mingguKe') == 16

        if is_uts:
            set_cell_text(get_cell(67, 0), '')
            set_cell_text(get_cell(67, 1), 'Ujian Tengah Semester')
            set_cell_text(get_cell(67, 27), f"{p.get('bobotPenilaian', 0)}%")
            continue
        if is_uas:
            set_cell_text(get_cell(75, 0), '')
            set_cell_text(get_cell(75, 1), 'Ujian Akhir Semester')
            set_cell_text(get_cell(75, 27), f"{p.get('bobotPenilaian', 0)}%")
            continue

        set_cell_text(get_cell(ri, 0), str(p.get('mingguKe', '')))
        set_cell_text(get_cell(ri, 1), p.get('subCpmkKode', '') or p.get('subCpmkUtama', '') or '-')
        set_cell_text(get_cell(ri, 5), p.get('kemampuanAkhir', '') or '-')
        set_cell_text(get_cell(ri, 10), p.get('indikator', '') or '-')
        teknik_kriteria = f"{p.get('teknikPenilaian', '')}\n{p.get('kriteriaPenilaian', '')}"
        set_cell_text(get_cell(ri, 14), teknik_kriteria or '-')
        set_cell_text(get_cell(ri, 18), p.get('tmDaring', '') or 'TM')
        set_cell_text(get_cell(ri, 21), p.get('materi', '') or '-')
        set_cell_text(get_cell(ri, 27), f"{p.get('bobotPenilaian', 0)}%")

    # ===== Row 76: TOTAL =====
    total_bobot = sum(p.get('bobotPenilaian', 0) for p in pertemuan)
    set_cell_text(get_cell(76, 0), 'TOTAL BOBOT PENILAIAN')
    set_cell_text(get_cell(76, 27), str(total_bobot))

    doc.save(output_path)
    return output_path

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python3 fill-rps-template.py <template> <data_json> <output>")
        sys.exit(1)
    fill_template(sys.argv[1], sys.argv[2], sys.argv[3])
    print(f"OK: {sys.argv[3]}")
