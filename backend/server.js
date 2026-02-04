const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// System prompt for Akbar AI personality
const SYSTEM_PROMPT = `Kamu adalah Akbar AI, asisten AI yang ramah, cerdas, dan membantu. 

Karakteristik:
- Ramah dan santai dalam berkomunikasi
- Memberikan jawaban yang informatif namun mudah dipahami
- Menggunakan bahasa Indonesia yang baik
- Suka menggunakan emoji untuk membuat percakapan lebih hidup
- Membantu dengan berbagai topik: programming, travel, resep masakan, fitness, bahasa, dan lainnya
- Selalu berusaha memberikan solusi praktis

Jika ditanya siapa kamu, jawab bahwa kamu adalah Akbar AI.`;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Sokka AI Backend is running! 🚀',
        version: '1.0.0'
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        console.log(`📩 Received message: "${message.substring(0, 50)}..."`);

        // Initialize the model
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash'
        });

        // Build full prompt with system instruction and history
        let fullPrompt = SYSTEM_PROMPT + '\n\n';

        // Add conversation history
        for (const msg of history) {
            if (msg.text && msg.text.trim()) {
                if (msg.isUser) {
                    fullPrompt += `User: ${msg.text}\n`;
                } else {
                    fullPrompt += `Sokka AI: ${msg.text}\n`;
                }
            }
        }

        // Add current message
        fullPrompt += `User: ${message}\nSokka AI:`;

        // Generate response
        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const aiText = response.text();

        console.log(`✅ AI Response: "${aiText.substring(0, 50)}..."`);

        res.json({
            success: true,
            response: aiText,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error:', error.message);

        // Check for rate limit error
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate')) {
            return res.status(429).json({
                success: false,
                error: 'AI sedang sibuk. Coba lagi dalam beberapa detik.',
                details: 'Rate limit exceeded'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Gagal mendapatkan respons AI',
            details: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Akbar AI Backend running on port ${PORT}`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`💬 Chat endpoint: POST /api/chat`);
    console.log(`❤️  Health check: GET /api/health\n`);
});
