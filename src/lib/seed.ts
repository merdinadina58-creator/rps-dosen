import { db } from '@/lib/db'

/**
 * Seed data awal untuk demo RPS Dosen
 * Menjalankan: bun run src/lib/seed.ts
 */
async function main() {
  console.log('🌱 Seeding database...')

  // ===== Dosen =====
  const dosen1 = await db.dosen.create({
    data: {
      nama: 'Dr. Ahmad Wijaya, M.Kom.',
      nip: '198501012010011001',
      email: 'ahmad.wijaya@univ.ac.id',
      telepon: '081234567890',
      prodi: 'Teknik Informatika',
      jabatan: 'Lektor Kepala',
    },
  })

  const dosen2 = await db.dosen.create({
    data: {
      nama: 'Siti Rahmawati, M.Sc.',
      nip: '198706152012012002',
      email: 'siti.rahmawati@univ.ac.id',
      telepon: '081234567891',
      prodi: 'Teknik Informatika',
      jabatan: 'Lektor',
    },
  })

  const dosen3 = await db.dosen.create({
    data: {
      nama: 'Budi Santoso, M.T.',
      nip: '199002102015011003',
      email: 'budi.santoso@univ.ac.id',
      telepon: '081234567892',
      prodi: 'Sistem Informasi',
      jabatan: 'Asisten Ahli',
    },
  })

  // ===== Mata Kuliah =====
  const mk1 = await db.mataKuliah.create({
    data: {
      kode: 'IF-201',
      nama: 'Pemrograman Web',
      sks: 4,
      semester: 3,
      prodi: 'Teknik Informatika',
      deskripsi:
        'Mata kuliah ini membahas pengembangan aplikasi web modern meliputi HTML, CSS, JavaScript, framework frontend, backend, REST API, dan database. Mahasiswa mampu merancang dan membangun aplikasi web full-stack.',
      prasyarat: 'IF-101, IF-102',
    },
  })

  const mk2 = await db.mataKuliah.create({
    data: {
      kode: 'IF-301',
      nama: 'Basis Data',
      sks: 3,
      semester: 4,
      prodi: 'Teknik Informatika',
      deskripsi:
        'Mempelajari konsep basis data relasional, normalisasi, SQL, perancangan ERD, transaksi, dan optimasi query.',
      prasyarat: 'IF-101',
    },
  })

  const mk3 = await db.mataKuliah.create({
    data: {
      kode: 'IF-401',
      nama: 'Kecerdasan Buatan',
      sks: 3,
      semester: 5,
      prodi: 'Teknik Informatika',
      deskripsi:
        'Pengenalan konsep AI, machine learning, algoritma searching, knowledge representation, dan neural networks.',
      prasyarat: 'IF-202',
    },
  })

  const mk4 = await db.mataKuliah.create({
    data: {
      kode: 'SI-201',
      nama: 'Analisis dan Perancangan Sistem',
      sks: 3,
      semester: 3,
      prodi: 'Sistem Informasi',
      deskripsi:
        'Mempelajari metodologi analisis dan perancangan sistem informasi, UML, dan studi kasus pengembangan sistem.',
      prasyarat: 'SI-101',
    },
  })

  // ===== RPS Sample =====
  const rps1 = await db.rps.create({
    data: {
      judul: 'RPS Pemrograman Web - Semester Ganjil 2024/2025',
      tahunAjaran: '2024/2025',
      semester: 'Ganjil',
      kelas: 'TI-3A',
      mataKuliahId: mk1.id,
      dosenId: dosen1.id,
      deskripsi: mk1.deskripsi,
      cpl: 'Mampu merancang dan mengembangkan aplikasi web full-stack sesuai standar industri dengan mempertimbangkan aspek usability, keamanan, dan performa.',
      mingguPertemuan: 16,
      status: 'final',
      kurikulum: 'MBKM',
    },
  })

  // CPMK untuk RPS 1
  const cpmk1a = await db.cpmk.create({
    data: {
      rpsId: rps1.id,
      kode: 'CPMK1',
      deskripsi: 'Mahasiswa mampu memahami konsep dasar pengembangan aplikasi web dan arsitektur client-server.',
      urutan: 1,
    },
  })
  await db.subCpmk.createMany({
    data: [
      { cpmkId: cpmk1a.id, kode: 'Sub-CPMK1.1', deskripsi: 'Menjelaskan arsitektur client-server dan protokol HTTP/HTTPS', urutan: 1 },
      { cpmkId: cpmk1a.id, kode: 'Sub-CPMK1.2', deskripsi: 'Membandingkan berbagai teknologi web (frontend & backend)', urutan: 2 },
      { cpmkId: cpmk1a.id, kode: 'Sub-CPMK1.3', deskripsi: 'Mengidentifikasi komponen utama aplikasi web modern', urutan: 3 },
    ],
  })

  const cpmk1b = await db.cpmk.create({
    data: {
      rpsId: rps1.id,
      kode: 'CPMK2',
      deskripsi: 'Mahasiswa mampu merancang antarmuka web responsif menggunakan HTML5, CSS3, dan JavaScript.',
      urutan: 2,
    },
  })
  await db.subCpmk.createMany({
    data: [
      { cpmkId: cpmk1b.id, kode: 'Sub-CPMK2.1', deskripsi: 'Membuat struktur halaman web dengan HTML5 semantik', urutan: 1 },
      { cpmkId: cpmk1b.id, kode: 'Sub-CPMK2.2', deskripsi: 'Menerapkan styling responsif dengan CSS3 dan flexbox/grid', urutan: 2 },
      { cpmkId: cpmk1b.id, kode: 'Sub-CPMK2.3', deskripsi: 'Mengembangkan interaktivitas dengan JavaScript DOM', urutan: 3 },
    ],
  })

  const cpmk1c = await db.cpmk.create({
    data: {
      rpsId: rps1.id,
      kode: 'CPMK3',
      deskripsi: 'Mahasiswa mampu membangun aplikasi web full-stack dengan framework modern.',
      urutan: 3,
    },
  })
  await db.subCpmk.createMany({
    data: [
      { cpmkId: cpmk1c.id, kode: 'Sub-CPMK3.1', deskripsi: 'Mengembangkan RESTful API dengan framework backend', urutan: 1 },
      { cpmkId: cpmk1c.id, kode: 'Sub-CPMK3.2', deskripsi: 'Mengintegrasikan frontend dengan backend via API', urutan: 2 },
      { cpmkId: cpmk1c.id, kode: 'Sub-CPMK3.3', deskripsi: 'Menerapkan autentikasi dan otorisasi', urutan: 3 },
    ],
  })

  // Referensi
  await db.referensi.createMany({
    data: [
      { rpsId: rps1.id, jenis: 'buku', judul: 'Web Development with Node & Express', pengarang: 'Ethan Brown', penerbit: "O'Reilly Media", tahun: '2019', isUtama: true, urutan: 1 },
      { rpsId: rps1.id, jenis: 'buku', judul: 'Full-Stack React, Next.js & Node.js', pengarang: 'Adam Scott', penerbit: 'Apress', tahun: '2022', isUtama: true, urutan: 2 },
      { rpsId: rps1.id, jenis: 'buku', judul: 'Eloquent JavaScript', pengarang: 'Marijn Haverbeke', penerbit: 'No Starch Press', tahun: '2018', isUtama: false, urutan: 3 },
      { rpsId: rps1.id, jenis: 'website', judul: 'MDN Web Docs', pengarang: 'Mozilla', url: 'https://developer.mozilla.org', isUtama: false, urutan: 4 },
    ],
  })

  // Komponen penilaian
  await db.komponenPenilaian.createMany({
    data: [
      { rpsId: rps1.id, nama: 'Kehadiran & Keaktifan', bobot: 10, bentuk: 'Presensi & partisipasi', urutan: 1 },
      { rpsId: rps1.id, nama: 'Tugas Individu', bobot: 15, bentuk: 'Tugas praktik', urutan: 2 },
      { rpsId: rps1.id, nama: 'Tugas Kelompok / Proyek', bobot: 20, bentuk: 'Proyek mini', urutan: 3 },
      { rpsId: rps1.id, nama: 'UTS', bobot: 25, bentuk: 'Ujian tulisan', urutan: 4 },
      { rpsId: rps1.id, nama: 'UAS', bobot: 30, bentuk: 'Proyek final + presentasi', urutan: 5 },
    ],
  })

  // Pertemuan
  const pertemuanData = [
    { mingguKe: 1, materi: 'Pengantar Pengembangan Web, arsitektur client-server', metode: 'Ceramah & Diskusi', bobot: 0 },
    { mingguKe: 2, materi: 'HTML5 semantik & struktur halaman modern', metode: 'Ceramah & Praktik', bobot: 5 },
    { mingguKe: 3, materi: 'CSS3 - styling, layout flexbox', metode: 'Praktik Lab', bobot: 5 },
    { mingguKe: 4, materi: 'CSS Grid & desain responsif', metode: 'Praktik Lab', bobot: 5 },
    { mingguKe: 5, materi: 'JavaScript dasar & DOM manipulation', metode: 'Ceramah & Praktik', bobot: 5 },
    { mingguKe: 6, materi: 'JavaScript async, fetch API, promises', metode: 'Praktik Lab', bobot: 10 },
    { mingguKe: 7, materi: 'Pengantar backend & REST API', metode: 'Ceramah & Diskusi', bobot: 5 },
    { mingguKe: 8, materi: 'UTS - Ujian Tengah Semester', metode: 'Ujian', bobot: 25 },
    { mingguKe: 9, materi: 'Node.js & Express basics', metode: 'Praktik Lab', bobot: 5 },
    { mingguKe: 10, materi: 'RESTful API development', metode: 'Praktik Lab', bobot: 10 },
    { mingguKe: 11, materi: 'Database integration (Prisma/SQL)', metode: 'Praktik Lab', bobot: 5 },
    { mingguKe: 12, materi: 'Autentikasi & otorisasi (JWT)', metode: 'Praktik Lab', bobot: 5 },
    { mingguKe: 13, materi: 'Frontend-backend integration', metode: 'Praktik Lab', bobot: 5 },
    { mingguKe: 14, materi: 'Deployment & best practices', metode: 'Ceramah & Praktik', bobot: 5 },
    { mingguKe: 15, materi: 'Presentasi proyek akhir', metode: 'Presentasi', bobot: 10 },
    { mingguKe: 16, materi: 'UAS - Final Project Submission & Review', metode: 'Ujian & Review', bobot: 30 },
  ]

  for (const p of pertemuanData) {
    await db.pertemuan.create({
      data: {
        rpsId: rps1.id,
        mingguKe: p.mingguKe,
        materi: p.materi,
        metode: p.metode,
        aktivitasDosen: 'Menjelaskan konsep, memberikan demo, membimbing praktik',
        aktivitasMhs: 'Mendengarkan, berdiskusi, mengerjakan latihan praktik',
        pengalamanBelajar: 'Studi kasus, latihan koding, mini project',
        indikatorPenilaian: `Ketuntasan materi pertemuan ${p.mingguKe}`,
        bobotPenilaian: p.bobot,
        estimasiWaktu: '150 menit',
        urutan: p.mingguKe,
      },
    })
  }

  // ===== RPS Sample 2 (draft) =====
  const rps2 = await db.rps.create({
    data: {
      judul: 'RPS Basis Data - Semester Genap 2023/2024',
      tahunAjaran: '2023/2024',
      semester: 'Genap',
      kelas: 'TI-4B',
      mataKuliahId: mk2.id,
      dosenId: dosen2.id,
      deskripsi: mk2.deskripsi,
      cpl: 'Mampu merancang, mengimplementasikan, dan mengoptimalkan basis data relasional untuk aplikasi.',
      mingguPertemuan: 16,
      status: 'draft',
      kurikulum: 'MBKM',
    },
  })

  await db.cpmk.create({
    data: {
      rpsId: rps2.id,
      kode: 'CPMK1',
      deskripsi: 'Mahasiswa mampu memahami konsep basis data relasional dan normalisasi.',
      urutan: 1,
    },
  })

  await db.komponenPenilaian.createMany({
    data: [
      { rpsId: rps2.id, nama: 'Tugas', bobot: 30, urutan: 1 },
      { rpsId: rps2.id, nama: 'UTS', bobot: 30, urutan: 2 },
      { rpsId: rps2.id, nama: 'UAS', bobot: 40, urutan: 3 },
    ],
  })

  // ===== RPS Sample 3 (revisi) =====
  const rps3 = await db.rps.create({
    data: {
      judul: 'RPS Kecerdasan Buatan - Semester Ganjil 2024/2025',
      tahunAjaran: '2024/2025',
      semester: 'Ganjil',
      kelas: 'TI-5A',
      mataKuliahId: mk3.id,
      dosenId: dosen1.id,
      deskripsi: mk3.deskripsi,
      cpl: 'Mampu menerapkan konsep dan algoritma kecerdasan buatan untuk menyelesaikan permasalahan nyata.',
      mingguPertemuan: 16,
      status: 'revisi',
      kurikulum: 'MBKM',
    },
  })

  await db.komponenPenilaian.createMany({
    data: [
      { rpsId: rps3.id, nama: 'Quiz', bobot: 10, urutan: 1 },
      { rpsId: rps3.id, nama: 'Tugas & Project', bobot: 30, urutan: 2 },
      { rpsId: rps3.id, nama: 'UTS', bobot: 25, urutan: 3 },
      { rpsId: rps3.id, nama: 'UAS', bobot: 35, urutan: 4 },
    ],
  })

  console.log('✅ Seeding selesai!')
  console.log(`   - ${3} dosen`)
  console.log(`   - ${4} mata kuliah`)
  console.log(`   - ${3} RPS`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
