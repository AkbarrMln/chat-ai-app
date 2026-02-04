# 🤖 Chat AI App

Aplikasi mobile **Chat AI** yang terhubung dengan **Gemini AI** backend, dibangun menggunakan **React Native** dan **Expo**.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)

## ✨ Fitur Utama

### 🤖 AI Integration
- ✅ **Backend API** - Express.js dengan Gemini AI
- ✅ **Real AI Response** - Menggunakan Gemini 2.0 Flash
- ✅ **Conversation History** - AI mengingat konteks percakapan
- ✅ **Loading Indicator** - Indikator saat AI sedang memproses
- ✅ **Error Handling** - Penanganan error yang user-friendly

### 📱 UI/UX Features
- ✅ **Conversation List** - Daftar percakapan dengan preview
- ✅ **Chat Detail** - Bubble chat AI vs User
- ✅ **Profile Screen** - Pengaturan dan dark mode
- ✅ **Pull to Refresh** - Refresh daftar percakapan
- ✅ **Typing Indicator** - Animasi saat AI mengetik
- ✅ **Dark Mode Toggle** - Switch tema gelap/terang

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│  Express.js API │────▶│   Gemini AI     │
│  (React Native) │◀────│   (Backend)     │◀────│   (Google)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🚀 Cara Menjalankan Project

### Prasyarat
- Node.js (versi 18 atau lebih baru)
- npm atau yarn
- Expo Go app di smartphone

### 1. Setup Backend

```bash
# Masuk ke folder backend
cd backend

# Install dependencies
npm install

# Setup environment (copy dan edit API key)
cp .env.example .env

# Jalankan server
npm start
```

Backend akan berjalan di `http://localhost:3001`

### 2. Setup Mobile App

```bash
# Masuk ke folder mobile app
cd chat-ai-app

# Install dependencies
npm install

# Jalankan aplikasi
npx expo start
```

### 3. Konfigurasi API URL

Edit file `src/config.js` untuk mengatur URL backend:

```javascript
// Untuk development lokal
const DEV_API_URL = 'http://localhost:3001';

// Untuk production (setelah deploy)
const PROD_API_URL = 'https://your-backend.railway.app';
```

> **Note untuk Android**: Gunakan IP lokal komputer (contoh: `http://192.168.1.100:3001`) jika menggunakan perangkat fisik.

## 📁 Struktur Project

```
Tugas 5/
├── backend/                    # Express.js Backend
│   ├── server.js               # Main server + Gemini integration
│   ├── package.json
│   ├── .env                    # API Key (gitignored)
│   └── README.md
│
└── chat-ai-app/                # React Native Mobile App
    ├── App.js                  # Navigation setup
    ├── src/
    │   ├── config.js           # API URL configuration
    │   ├── services/
    │   │   └── api.js          # API service module
    │   ├── context/
    │   │   └── ThemeContext.js # Dark mode context
    │   ├── data/
    │   │   └── mockData.js     # Sample data
    │   └── screens/
    │       ├── ConversationListScreen.js
    │       ├── ChatDetailScreen.js
    │       └── ProfileScreen.js
    └── README.md
```

## 🔧 API Endpoints

### Health Check
```
GET /api/health
```

### Chat
```
POST /api/chat
Content-Type: application/json

{
  "message": "Halo, siapa kamu?",
  "history": [
    {"text": "pesan sebelumnya", "isUser": true},
    {"text": "respons AI", "isUser": false}
  ]
}
```

## 🎨 System Prompt

AI menggunakan persona **Akbar AI** dengan karakteristik:
- Ramah dan santai dalam berkomunikasi
- Menggunakan bahasa Indonesia yang baik
- Membantu berbagai topik (programming, travel, resep, dll)
- Menggunakan emoji untuk percakapan yang lebih hidup 🚀

## 🛠️ Teknologi yang Digunakan

### Mobile App
- **React Native** - Framework mobile app
- **Expo** - Development platform
- **React Navigation** - Navigation library
- **React Native Reanimated** - Animasi

### Backend
- **Express.js** - Web framework
- **@google/generative-ai** - Gemini AI SDK
- **CORS** - Cross-origin support

### AI Model
- **Gemini 2.0 Flash** - Model AI tercepat dari Google

## 📸 Screenshots

| Conversation List | Chat with AI | Profile |
|:---:|:---:|:---:|
| Daftar chat | Real AI response | Settings |

## 🌐 Deployment

### Backend (Railway/Render)
1. Push ke GitHub
2. Connect ke Railway/Render
3. Set environment variable `GEMINI_API_KEY`
4. Deploy!

## 👨‍💻 Author

- **Akbar Maulana**
- Internship @ Ashari-Tech

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
