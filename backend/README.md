# 🤖 Sokka AI Backend

Backend API untuk aplikasi Chat AI Mobile menggunakan Express.js dan Google Gemini AI.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env dan masukkan API key Gemini kamu
```

### 3. Run Server
```bash
npm start
```

Server akan berjalan di `http://localhost:3001`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Chat
```
POST /api/chat
Content-Type: application/json

{
  "message": "Halo, siapa kamu?",
  "history": []
}
```

Response:
```json
{
  "success": true,
  "response": "Halo! Saya Sokka AI...",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API Key | Required |
| `PORT` | Server port | 3001 |

## 🌐 Deployment

### Railway
1. Push ke GitHub
2. Connect Railway ke repo
3. Set environment variable `GEMINI_API_KEY`
4. Deploy!

### Render
1. Push ke GitHub
2. Create new Web Service di Render
3. Set environment variables
4. Deploy!

## 👨‍💻 Author

- **Akbar Maulana**
- PKL @ Ashari-Tech
