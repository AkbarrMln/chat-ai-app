const { GoogleGenAI } = require('@google/genai');

// Initialize Google GenAI with API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Available topics for digest
const TOPICS = {
    'Teknologi': 'berita teknologi terkini, AI, startup, gadget',
    'Bisnis': 'berita bisnis, ekonomi, pasar saham, finansial',
    'Olahraga': 'berita olahraga, sepak bola, badminton, MotoGP',
    'Hiburan': 'berita hiburan, film, musik, selebriti',
    'Politik': 'berita politik Indonesia, pemerintahan, kebijakan',
    'Kesehatan': 'berita kesehatan, tips sehat, COVID, medis',
    'Gaming': 'berita gaming, esports, game mobile, console'
};

/**
 * Generate a news digest using Gemini with Google Grounding
 * @param {string} topic - The topic to generate digest for
 * @param {string} customPrompt - Optional custom prompt from user
 * @returns {Promise<{success: boolean, content?: string, error?: string}>}
 */
async function generateDigest(topic, customPrompt = '') {
    try {
        const topicContext = TOPICS[topic] || topic;

        // Build the prompt
        let prompt = customPrompt
            ? `${customPrompt}\n\nFokus pada: ${topicContext}`
            : `Berikan ringkasan berita terkini hari ini tentang ${topicContext}. 
               
               Format respons:
               📰 **DAILY DIGEST: ${topic.toUpperCase()}**
               
               Berikan 3-5 berita paling penting dengan:
               - Judul berita
               - Ringkasan singkat (2-3 kalimat)
               - Sumber jika tersedia
               
               Gunakan bahasa Indonesia yang mudah dipahami.
               Berikan emoji yang relevan untuk setiap berita.`;

        console.log(`🔍 Generating digest for topic: ${topic}`);

        // Call Gemini with Google Grounding (Google Search)
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }] // Enable Google Grounding!
            }
        });

        // Extract the text response
        const content = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!content) {
            throw new Error('No content generated');
        }

        console.log(`✅ Digest generated successfully for topic: ${topic}`);

        return {
            success: true,
            content: content,
            topic: topic
        };

    } catch (error) {
        console.error(`❌ Error generating digest for ${topic}:`, error.message);

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Test the Gemini connection
 * @returns {Promise<boolean>}
 */
async function testGeminiConnection() {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Halo, apakah kamu bisa menjawab?'
        });
        return !!response.text;
    } catch (error) {
        console.error('Gemini connection test failed:', error.message);
        return false;
    }
}

module.exports = {
    generateDigest,
    testGeminiConnection,
    TOPICS
};
