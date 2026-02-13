# 🏠 HomeCheck: AI Building Damage Detection System 🚨

**HomeCheck** adalah asisten cerdas berbasis web yang dirancang untuk melakukan inspeksi visual terhadap struktur bangunan pasca-bencana. Aplikasi ini membantu masyarakat atau petugas lapangan menentukan tingkat keamanan suatu hunian secara instan menggunakan teknologi *Computer Vision*.

---

## 📌 Problem Statement
Setelah terjadi bencana seperti gempa bumi, banyak bangunan mengalami kerusakan struktur tersembunyi. Menunggu tim ahli untuk survei manual memerlukan waktu lama, sementara warga sering terpaksa kembali ke rumah tanpa kepastian keamanan. **HomeCheck** hadir untuk memberikan penilaian awal yang cepat guna meminimalisir risiko kecelakaan akibat bangunan yang tidak stabil secara struktur.

## 🏗️ Arsitektur & Teknologi
Aplikasi ini dibangun dengan struktur modern yang memisahkan sisi tampilan dan mesin AI:
* **Frontend**: React.js (Dideploy di **Vercel**) – Memberikan pengalaman pengguna yang mulus dengan desain Glassmorphism yang intuitif.
* **Backend AI API**: Python (**Gradio Client**) – Di-host di **Hugging Face Spaces** untuk mengolah permintaan analisis gambar.
* **Core Model**: Deep Learning yang dioptimalkan untuk deteksi klasifikasi kerusakan bangunan.
* **Integrasi**: Menghubungkan antarmuka React dengan model AI melalui protokol API yang aman dan cepat.

---

## ✨ Fitur Utama
* **Analisis Kerusakan Visual**: Deteksi otomatis tingkat kerusakan bangunan hanya melalui unggahan foto.
* **Rekomendasi Keamanan**: Memberikan panduan instan apakah gedung masih layak huni atau harus segera ditinggalkan.
* **Proses Cepat & Ringan**: Dirancang agar dapat diakses dengan cepat di lapangan menggunakan perangkat seluler.
* **Bagian dari HelpApp AI**: Terintegrasi dalam ekosistem manajemen bencana terpadu untuk koordinasi yang lebih baik.

---

## 📖 Cara Penggunaan
1.  **Akses Aplikasi**: Buka tautan resmi **HomeCheck di Vercel**.
2.  **Unggah Foto**: Ambil foto bagian bangunan yang retak atau rusak langsung dari lokasi.
3.  **Inspeksi AI**: Tunggu beberapa detik sementara AI di Hugging Face menganalisis tingkat keparahan kerusakan.
4.  **Tindak Lanjut**: Baca rekomendasi keamanan yang muncul untuk menentukan langkah evakuasi atau pemulihan selanjutnya.

