# 🤖 Chat AI App

Aplikasi mobile **Chat AI** yang dibangun menggunakan **React Native** dan **Expo**. Aplikasi ini fokus pada UI/UX tanpa memerlukan backend.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)

## ✨ Fitur Utama

### 📱 Halaman Utama

1. **Conversation List** - Daftar Percakapan
   - Header dengan tombol New Chat
   - List item dengan avatar, judul, preview pesan, dan waktu
   - Navigasi ke Chat Detail saat tap item
   - Pull to refresh untuk memperbarui daftar

2. **Chat Detail** - Halaman Chat
   - Header dengan back button
   - Chat bubbles dengan warna berbeda (AI: kiri, User: kanan)
   - Timestamp di setiap pesan
   - Input field dengan tombol Send
   - Animasi send saat mengirim pesan
   - Typing indicator saat AI sedang membalas

3. **Profile** - Halaman Profil
   - Avatar dengan inisial nama + nama + email
   - 6 menu item dengan icon
   - Arrow indicator (>) untuk menu clickable
   - Dark mode toggle

### 🧭 Navigasi

- **Bottom Tab Navigation**: Home/Chat dan Profile
- **Stack Navigation**: List → Chat Detail → Back

### 🎁 Bonus Features (+20 poin)

- ✅ **Dark Mode Toggle** (+5) - Switch tema gelap/terang di halaman Profile
- ✅ **Animasi Send** (+5) - Animasi bounce pada tombol kirim
- ✅ **Typing Indicator** (+5) - Indikator AI sedang mengetik dengan animasi
- ✅ **Pull to Refresh** (+5) - Refresh daftar percakapan dengan pull down

## 🚀 Cara Menjalankan Project

### Prasyarat

- Node.js (versi 16 atau lebih baru)
- npm atau yarn
- Expo CLI (opsional, bisa menggunakan npx)
- Expo Go app di smartphone (untuk testing di device fisik)

### Langkah-langkah

1. **Clone repository**
   ```bash
   git clone https://github.com/username/chat-ai-app.git
   cd chat-ai-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Jalankan aplikasi**
   ```bash
   npx expo start
   ```

4. **Buka aplikasi**
   - Scan QR code dengan Expo Go (Android) atau Camera (iOS)
   - Atau tekan `a` untuk Android emulator
   - Atau tekan `w` untuk web browser

## 📁 Struktur Project

```
chat-ai-app/
├── App.js                          # Entry point & navigation setup
├── src/
│   ├── context/
│   │   └── ThemeContext.js         # Dark mode context
│   ├── data/
│   │   └── mockData.js             # Sample data
│   └── screens/
│       ├── ConversationListScreen.js
│       ├── ChatDetailScreen.js
│       └── ProfileScreen.js
├── package.json
└── README.md
```

## 🛠️ Teknologi yang Digunakan

- **React Native** - Framework mobile app
- **Expo** - Development platform
- **React Navigation** - Bottom tabs & Stack navigation
- **@expo/vector-icons** - Icon library (Ionicons)
- **React Native Animated** - Animasi

## 📸 Screenshots

### Light Mode
| Conversation List | Chat Detail | Profile |
|:---:|:---:|:---:|
| Daftar chat dengan avatar | Bubble chat AI & User | Menu dengan dark toggle |

### Dark Mode
| Conversation List | Chat Detail | Profile |
|:---:|:---:|:---:|
| Tema gelap | Tema gelap | Toggle aktif |

## 👨‍💻 Author

- **Akbar Maulana**
- Internship @ Ashari-Tech

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
