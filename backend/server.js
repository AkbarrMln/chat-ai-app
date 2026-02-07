const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

// Import services
const { generateDigest, TOPICS } = require('./services/geminiService');
const { startScheduler, triggerManualDigest } = require('./services/schedulerService');
const {
    getUserSettings,
    saveUserSettings,
    registerPushToken,
    getDigestHistory,
    getDigestById
} = require('./data/store');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Google GenAI for chat (keeping original functionality)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Akbar AI Backend is running! 🚀',
        version: '2.0.0',
        features: ['chat', 'daily-digest', 'push-notifications']
    });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================================
// CHAT ENDPOINT (Original functionality)
// ============================================
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

        // Build full prompt with system instruction and history
        let fullPrompt = SYSTEM_PROMPT + '\n\n';

        // Add conversation history
        for (const msg of history) {
            if (msg.text && msg.text.trim()) {
                if (msg.isUser) {
                    fullPrompt += `User: ${msg.text}\n`;
                } else {
                    fullPrompt += `Akbar AI: ${msg.text}\n`;
                }
            }
        }

        // Add current message
        fullPrompt += `User: ${message}\nAkbar AI:`;

        // Generate response using new @google/genai package
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt
        });

        const aiText = response.text;

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

// ============================================
// DIGEST SETTINGS ENDPOINTS
// ============================================

// Get available topics
app.get('/api/digest/topics', (req, res) => {
    res.json({
        success: true,
        topics: Object.keys(TOPICS)
    });
});

// Get user digest settings
app.get('/api/digest/settings', (req, res) => {
    const { deviceId } = req.query;

    if (!deviceId) {
        return res.status(400).json({
            success: false,
            error: 'deviceId is required'
        });
    }

    const settings = getUserSettings(deviceId);

    res.json({
        success: true,
        settings: settings || {
            enabled: false,
            time: '07:00',
            topic: 'Teknologi',
            customPrompt: ''
        }
    });
});

// Save user digest settings
app.post('/api/digest/settings', (req, res) => {
    const { deviceId, enabled, time, topic, customPrompt, timezone } = req.body;

    if (!deviceId) {
        return res.status(400).json({
            success: false,
            error: 'deviceId is required'
        });
    }

    const settings = saveUserSettings(deviceId, {
        enabled: enabled ?? false,
        time: time || '07:00', // Store in UTC
        topic: topic || 'Teknologi',
        customPrompt: customPrompt || '',
        timezone: timezone || 'Asia/Jakarta'
    });

    console.log(`⚙️ Settings saved for device: ${deviceId.substring(0, 15)}...`);

    res.json({
        success: true,
        settings: settings
    });
});

// Register push token
app.post('/api/digest/register-push', (req, res) => {
    const { deviceId, pushToken } = req.body;

    if (!deviceId || !pushToken) {
        return res.status(400).json({
            success: false,
            error: 'deviceId and pushToken are required'
        });
    }

    registerPushToken(deviceId, pushToken);

    console.log(`📱 Push token registered for device: ${deviceId.substring(0, 15)}...`);

    res.json({
        success: true,
        message: 'Push token registered'
    });
});

// ============================================
// DIGEST HISTORY ENDPOINTS
// ============================================

// Get digest history
app.get('/api/digest/history', (req, res) => {
    const { deviceId, limit } = req.query;

    if (!deviceId) {
        return res.status(400).json({
            success: false,
            error: 'deviceId is required'
        });
    }

    const history = getDigestHistory(deviceId, parseInt(limit) || 20);

    res.json({
        success: true,
        history: history
    });
});

// Get single digest detail
app.get('/api/digest/history/:digestId', (req, res) => {
    const { digestId } = req.params;
    const { deviceId } = req.query;

    if (!deviceId) {
        return res.status(400).json({
            success: false,
            error: 'deviceId is required'
        });
    }

    const digest = getDigestById(deviceId, digestId);

    if (!digest) {
        return res.status(404).json({
            success: false,
            error: 'Digest not found'
        });
    }

    res.json({
        success: true,
        digest: digest
    });
});

// ============================================
// TEST ENDPOINT
// ============================================

// Manual trigger for testing digest
app.post('/api/test-digest', async (req, res) => {
    const { deviceId, topic, customPrompt, pushToken } = req.body;

    if (!topic) {
        return res.status(400).json({
            success: false,
            error: 'topic is required'
        });
    }

    console.log(`🧪 Test digest requested for topic: ${topic}`);

    const result = await triggerManualDigest(
        deviceId || 'test-device',
        topic,
        customPrompt || '',
        pushToken
    );

    if (!result.success) {
        return res.status(500).json({
            success: false,
            error: result.error
        });
    }

    res.json({
        success: true,
        digest: result.digest,
        content: result.content
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`\n🚀 Akbar AI Backend running on port ${PORT}`);
    console.log(`📍 Local: http://localhost:${PORT}`);
    console.log(`💬 Chat endpoint: POST /api/chat`);
    console.log(`📰 Digest endpoints: /api/digest/*`);
    console.log(`🧪 Test digest: POST /api/test-digest`);
    console.log(`❤️  Health check: GET /api/health\n`);

    // Start the scheduler
    startScheduler();
});
