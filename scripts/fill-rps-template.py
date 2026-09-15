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
from docx.shared import Pt, RGBColor

def set_cell_text(cell, text, bold=None, font_name='Palatino Linotype', font_size=12):
    """Set cell text, preserving template formatting.
    
    Preserves the first paragraph's first run font (Palatino Linotype 12pt etc).
    For multi-line text, uses the first paragraph's formatting for all lines.
    Only creates new runs with explicit font when the paragraph has NO runs.
    
    bold: None = preserve template's bold, True = force bold, False = force not bold
    """
    if cell is None:
        return
    
    text = str(text) if text else ''
    lines = text.split('\n')
    
    # Keep first paragraph, remove the rest
    first_p = cell.paragraphs[0] if cell.paragraphs else cell.add_paragraph()
    for p in cell.paragraphs[1:]:
        p._element.getparent().remove(p._element)
    
    # Capture formatting from first run before clearing
    ref_run = first_p.runs[0] if first_p.runs else None
    # Only capture non-None values — preserve "inherit" if template uses it
    ref_font_name = ref_run.font.name if (ref_run and ref_run.font.name) else None  # None = inherit
    ref_font_size = ref_run.font.size if (ref_run and ref_run.font.size) else None  # None = inherit
    ref_bold = ref_run.bold if ref_run else bold
    
    # Clear all runs in first paragraph
    for run in first_p.runs:
        run._element.getparent().remove(run._element)
    
    # Add new runs with captured formatting
    for i, line in enumerate(lines):
        if i > 0:
            run = first_p.add_run()
            run.add_break()  # line break before subsequent lines
        run = first_p.add_run(line)
        # Only set font name if template had explicit name (not inherit)
        if ref_font_name:
            run.font.name = ref_font_name
        # Only set font size if template had explicit size (not inherit)
        if ref_font_size:
            run.font.size = ref_font_size
        # Bold: use explicit override if provided, otherwise use template's
        if bold is not None:
            run.bold = bold
        else:
            run.bold = ref_bold

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
    # Col 0-3 = empty cell (logo area), Col 8-30 = university header (28pt), Col 31-33 = kode dokumen
    header_cell = get_cell(0, 8)
    if header_cell and data.get('universitas'):
        header_text = f"{data.get('universitas', '')}\nFAKULTAS {data.get('fakultas', '').upper()}\nPROGRAM STUDI {mk.get('prodi', '').upper()}"
        set_cell_text(header_cell, header_text, bold=True)

    kode_cell = get_cell(0, 31)
    if kode_cell:
        set_cell_text(kode_cell, f"KODE DOKUMEN\n{data.get('kodeDokumen', '') or '.............'}", bold=True)

    # ===== Row 3: Identitas =====
    # Structure: col0(6)=MK name, col6(7)=Kode, col13(7)=Rumpun, col20(3)=T, col23(1)=P, col24(4)=empty, col28(3)=Semester, col31(3)=Tgl
    set_cell_text(get_cell(3, 0), mk.get('nama', ''))
    set_cell_text(get_cell(3, 6), mk.get('kode', ''))
    set_cell_text(get_cell(3, 13), mk.get('rumpunMk', '') or '-')
    set_cell_text(get_cell(3, 20), f"T = {mk.get('sksTeori', 0)}")
    set_cell_text(get_cell(3, 23), f"P = {mk.get('sksPraktek', 0)}")
    set_cell_text(get_cell(3, 28), str(mk.get('semester', '')))
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
    set_cell_text(get_cell(3, 31), tgl_str)

    # ===== Row 5: Otorisasi =====
    # Structure: col0(6)=label, col6(7)=Dosen Pengembang, col13(7)=Koordinator RMK, col25(9)=Kaprodi
    set_cell_text(get_cell(5, 6), data.get('otorisasiDosenPengembang', '') or '-')
    set_cell_text(get_cell(5, 13), data.get('otorisasiKoordinatorRmk', '') or '-')
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
    # Structure: col0(6)=label, col6(4)=sub-label, col10(24)=content
    set_cell_text(get_cell(49, 10), data.get('deskripsiSingkat', '') or data.get('deskripsi', '') or '-')

    # ===== Row 50: Bahan Kajian =====
    set_cell_text(get_cell(50, 10), data.get('bahanKajian', '') or '-')

    # ===== Rows 51-52: Pustaka =====
    ref_utama = [r for r in data.get('referensi', []) if r.get('isUtama')]
    ref_pendukung = [r for r in data.get('referensi', []) if not r.get('isUtama')]
    utama_text = '\n'.join(f"{r.get('pengarang', '')}. {r.get('tahun', '')}. {r.get('judul', '')}. {r.get('penerbit', '')}" for r in ref_utama)
    set_cell_text(get_cell(51, 10), 'Sumber Utama:\n' + (utama_text or '-'))
    pendukung_text = '\n'.join(f"{r.get('judul', '')}" for r in ref_pendukung)
    set_cell_text(get_cell(52, 10), 'Pendukung:\n' + (pendukung_text or '-'))

    # ===== Rows 53-54: Media =====
    set_cell_text(get_cell(53, 10), f"Perangkat Lunak (software): {data.get('mediaSoftware', '') or '-'}")
    set_cell_text(get_cell(54, 10), f"Perangkat Keras (hardware): {data.get('mediaHardware', '') or '-'}")

    # ===== Row 55: Team Teaching =====
    set_cell_text(get_cell(55, 10), 'Ya' if data.get('teamTeaching') else 'Tidak')

    # ===== Row 56: Mata Kuliah Syarat =====
    set_cell_text(get_cell(56, 10), data.get('mataKuliahSyarat', '') or mk.get('prasyarat', '') or '-')

    # ===== Rows 60-75: Rencana Pembelajaran =====
    # Structure: col0(1)=minggu, col1(5)=Sub-CPMK, col6(8)=KemampuanAkhir+Indikator, col14(4)=Teknik+Kriteria, col18(3)=TM/Daring, col21(5)=empty, col26(4)=Materi, col30(3)=empty, col33(1)=Bobot
    pertemuan = data.get('pertemuan', [])
    for i in range(min(len(pertemuan), 16)):
        p = pertemuan[i]
        ri = 60 + i
        is_uts = p.get('mingguKe') == 8
        is_uas = p.get('mingguKe') == 16

        if is_uts:
            # Row 67: col5(28)=UTS label, col33(1)=bobot
            set_cell_text(get_cell(67, 5), 'Ujian Tengah Semester')
            set_cell_text(get_cell(67, 33), f"{p.get('bobotPenilaian', 0)}%")
            continue
        if is_uas:
            # Row 75: col3(30)=UAS label, col33(1)=bobot
            set_cell_text(get_cell(75, 3), 'Ujian Akhir Semester')
            set_cell_text(get_cell(75, 33), f"{p.get('bobotPenilaian', 0)}%")
            continue

        # Regular week — fill correct cells
        set_cell_text(get_cell(ri, 0), str(p.get('mingguKe', '')))
        set_cell_text(get_cell(ri, 1), p.get('subCpmkKode', '') or p.get('subCpmkUtama', '') or '-')
        set_cell_text(get_cell(ri, 6), p.get('kemampuanAkhir', '') or '-')
        # Indikator goes in the same merged cell as kemampuanAkhir (col6, span=8)
        # We append it as a second line
        if p.get('indikator'):
            current = get_cell(ri, 6)
            if current:
                set_cell_text(current, f"{p.get('kemampuanAkhir', '') or '-'}\nIndikator: {p.get('indikator', '')}")
        teknik_kriteria = f"{p.get('teknikPenilaian', '')}\n{p.get('kriteriaPenilaian', '')}"
        set_cell_text(get_cell(ri, 14), teknik_kriteria or '-')
        set_cell_text(get_cell(ri, 18), p.get('tmDaring', '') or 'TM')
        set_cell_text(get_cell(ri, 26), p.get('materi', '') or '-')
        set_cell_text(get_cell(ri, 33), f"{p.get('bobotPenilaian', 0)}%")

    # ===== Row 76: TOTAL =====
    # Structure: col0(2)=empty, col2(31)=TOTAL label, col33(1)=value
    total_bobot = sum(p.get('bobotPenilaian', 0) for p in pertemuan)
    set_cell_text(get_cell(76, 2), 'TOTAL BOBOT PENILAIAN', bold=True)
    set_cell_text(get_cell(76, 33), str(total_bobot), bold=True)

    # ===== Hapus Catatan (template says: "Jika sudah diisi, hapus poin catatan") =====
    # Find the "Catatan:" paragraph and delete it + all subsequent paragraphs
    paragraphs_to_delete = []
    found_catatan = False
    for i, p in enumerate(doc.paragraphs):
        text = p.text.strip()
        if 'Catatan' in text and len(text) < 20:
            found_catatan = True
        if found_catatan:
            paragraphs_to_delete.append(p)
    
    if paragraphs_to_delete:
        for p in paragraphs_to_delete:
            p._element.getparent().remove(p._element)

    doc.save(output_path)
    return output_path

if __name__ == '__main__':
    if len(sys.argv) != 4:
        print("Usage: python3 fill-rps-template.py <template> <data_json> <output>")
        sys.exit(1)
    fill_template(sys.argv[1], sys.argv[2], sys.argv[3])
    print(f"OK: {sys.argv[3]}")
