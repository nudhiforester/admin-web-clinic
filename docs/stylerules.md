# Aturan Gaya Visual

## Login
1. Gunakan `docs/login.png` sebagai acuan tampilan.
2. Susun halaman menjadi dua kolom: informasi fasilitas kesehatan di kiri dan formulir login di kanan.
3. Ambil nama, alamat, logo, dan kontak fasilitas kesehatan dari `data/json/config.json`.
4. Validasi kredensial demo terhadap `data/json/user.json`. Tombol Google hanya ditampilkan dan tidak diaktifkan.

## Dashboard
1. Gunakan `docs/dashboard.png` sebagai acuan tampilan.
2. Sediakan navigasi ikon di sisi kiri serta header dengan identitas fasilitas, profil pengguna, notifikasi, dan kontrol tema.
3. Tampilkan grafik kunjungan dengan pustaka ApexCharts yang tersedia secara lokal pada proyek.
4. Grafik kunjungan menampilkan tanggal untuk tujuh hari terakhir, menyediakan navigasi periode tujuh hari ke waktu sebelumnya, dan menandai tanggal hari ini dengan bar oranye.
5. Dashboard desktop memenuhi bidang browser tanpa bingkai atau celah luar; header dan navigasi kiri tetap menempel pada tepi viewport saat halaman digulir.
6. Header dan navigasi kiri tetap terlihat saat halaman dashboard digulir.
7. Peralihan ke mode gelap menggunakan circular reveal melalui overlay CSS klasik, tanpa View Transitions API, dan menghormati preferensi reduced motion.
8. Tampilkan footer hak cipta di bawah konten dashboard dan garis pemisah setebal garis kartu pada header grafik, header/footer indeks obat, serta footer riwayat resep yang menampilkan jumlah record. Daftar obat dan resep memiliki scroll internal; footer jumlah record tetap terlihat di luar area scroll. Daftar resep memakai nomor tebal, nama pasien kecil, status di sisi kanan, pencarian, dan pemisah tipis berwarna lembut tanpa tombol opsi.
9. Ikuti `docs/layout-dashboard.png`: tampilkan kartu ringkasan pasien, obat, dan resep di atas grafik, progres harian, dan aktivitas pada kolom kiri; tempatkan pasien terbaru di bagian atas kolom kanan, dengan indeks obat dan riwayat resep berjajar di bawahnya. Pada layar sempit, susun kolom dan kartu bawah secara vertikal agar tetap mudah dibaca.
10. Kartu ringkasan pasien, obat, dan resep mengikuti `docs/group-dashboard.png`: gunakan warna pastel berbeda, ikon di sudut kanan atas, angka utama, dan keterangan kecil di bagian bawah.
11. Tampilkan waktu kunjungan dan status penanganan pada kartu pasien; progres hari ini menghitung pasien yang sudah dan belum ditangani dari `data/json/patient.json`.
12. Kartu Pasien Terbaru dapat dibuka dengan klik atau keyboard untuk menampilkan modal detail tanpa garis pinggir; gunakan warna latar kartu terpilih, sediakan penutup yang jelas dan tombol Lihat Selengkapnya, serta susun detail dengan rapi di desktop maupun layar sempit.
13. Foto pasien bersifat opsional. Gunakan `assets/img/patient/no-image.png` jika foto tidak tersedia.
14. Kartu Aktivitas Anda menampilkan setiap jenis layanan dengan jumlah di atas indikator batang horizontal dan total layanan tebal di bagian bawah. Pada desktop, perluas kartu untuk mengisi sisa tinggi kolom agar tepi bawahnya sejajar dengan kartu Indeks Obat dan Riwayat Peresepan, lalu distribusikan baris aktivitas secara merata; pada layar sempit, biarkan kartu mengikuti isi.
15. Sumber indeks obat adalah `data/json/medication.json`; sumber daftar riwayat resep adalah `data/json/medication_request.json`.
16. Indeks obat menampilkan seluruh hasil dalam area scrollable tanpa paginasi, serta mempertahankan pencarian dan indikator stok berdasarkan jumlah serta batas minimum; item resep menyimpan ID obat sebagai referensi data.
17. Klik atau keyboard pada item indeks obat dan riwayat resep membuka modal detail dengan latar putih tanpa garis pinggir dan tombol Selengkapnya. Tampilkan seluruh informasi relevan dari record; pada detail resep, bagian obat dan aturan pakai membentang selebar modal.

## Prinsip Tampilan
1. Responsif dan mobile-first; gunakan Flexbox atau CSS Grid.
2. Gunakan ikon yang relevan, transisi lembut, dan kontras yang memadai pada tema terang maupun gelap.
3. Muat pustaka dari `node_modules`; jangan menambahkan dependensi CDN.
4. Pertahankan tampilan yang ringan dan konsisten pada halaman login dan dashboard.
