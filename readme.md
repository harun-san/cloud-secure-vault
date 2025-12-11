# Cloud Secure Vault

Platform penyimpanan file terenkripsi end-to-end dengan standar keamanan AES-256.

## 📋 Fitur Utama

- 🔐 **Enkripsi AES-256** - File dienkripsi di perangkat sebelum diupload
- 👤 **Autentikasi Aman** - Sistem login/register dengan Supabase
- 📁 **Manajemen File** - Upload, download, dan hapus file terenkripsi
- 📱 **Responsive Design** - Tampilan optimal untuk desktop dan mobile
- 🔑 **Zero-Knowledge** - Hanya Anda yang memiliki kunci enkripsi

## 🚀 Cara Mulai

### 1. Setup Supabase
1. Buat akun di [supabase.com](https://supabase.com)
2. Buat project baru
3. Dapatkan URL dan anon key dari Settings > API
4. Update file `js/utils.js`:
```javascript
const SUPABASE_CONFIG = {
  url: 'URL_ANDA_DISINI',
  anonKey: 'ANON_KEY_ANDA_DISINI'
};
```

### 2. Setup Storage
1. Di Supabase, buka menu Storage
2. Buat bucket baru dengan nama `secure-files`
3. Atur policy menjadi public (untuk testing)

### 3. Deploy Website
Upload semua file ke hosting web atau jalankan dengan live server.

## 📁 Struktur File

```
cloud-secure-vault/
├── index.html          # Halaman utama
├── login.html          # Login
├── register.html       # Register
├── dashboard.html      # Dashboard user
├── css/
│   ├── style.css      # Style utama
│   ├── auth.css       # Style auth pages
│   └── dashboard.css  # Style dashboard
└── js/
    ├── utils.js       # Utility functions
    ├── auth.js        # Auth logic
    └── dashboard.js   # Dashboard logic
```

## 🛠️ Teknologi

- **HTML5/CSS3** - Struktur dan styling
- **JavaScript ES6** - Logika aplikasi
- **Supabase** - Backend dan authentication
- **Crypto-JS** - Enkripsi AES-256
- **Font Awesome** - Ikon

## 🔧 Penggunaan

### Upload File
1. Login ke dashboard
2. Klik "Pilih File" atau drag & drop
3. Masukkan kunci enkripsi (minimal 8 karakter)
4. Klik "Enkripsi & Upload"

### Download File
1. Pilih file yang ingin didownload
2. Masukkan kunci enkripsi yang sama saat upload
3. File akan didekripsi dan didownload

## 📱 Responsive

Website dirancang untuk semua ukuran layar:
- **Desktop**: Layout dengan sidebar
- **Tablet/Mobile**: Menu navigasi sederhana

## ⚠️ Penting

- **Simpan kunci enkripsi Anda!** Jika hilang, file tidak dapat dipulihkan
- Maksimum ukuran file: 100MB
- File disimpan terenkripsi dengan ekstensi `.enc`

## 📝 Lisensi

MIT License - bebas digunakan dan dimodifikasi.

## 🔧 Troubleshooting

### Login gagal
- Pastikan email sudah diverifikasi
- Cek koneksi internet

### Upload gagal
- Pastikan file < 100MB
- Kunci enkripsi minimal 8 karakter

### Download gagal
- Gunakan kunci enkripsi yang sama dengan saat upload

---