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
 * Extract sources from Google Grounding response
 * @param {object} response - Gemini API response
 * @returns {Array} Array of source objects {title, url}
 */
function extractSources(response) {
    const sources = [];

    try {
        // Try to get grounding metadata from response
        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

        if (groundingMetadata?.groundingChunks) {
            for (const chunk of groundingMetadata.groundingChunks) {
                if (chunk.web) {
                    sources.push({
                        title: chunk.web.title || 'Sumber Berita',
                        url: chunk.web.uri || ''
                    });
                }
            }
        }

        // Also check searchEntryPoint for web sources
        if (groundingMetadata?.webSearchQueries) {
            // Log the queries used for transparency
            console.log('📚 Search queries used:', groundingMetadata.webSearchQueries);
        }

        // If no sources found in metadata, try to extract from content
        if (sources.length === 0) {
            const content = response.text || '';
            // Look for common source patterns in the text
            const urlPattern = /https?:\/\/[^\s)]+/g;
            const urls = content.match(urlPattern) || [];

            urls.forEach((url, index) => {
                sources.push({
                    title: `Sumber ${index + 1}`,
                    url: url
                });
            });
        }
    } catch (error) {
        console.log('Could not extract sources:', error.message);
    }

    // Remove duplicates and limit to 10 sources
    const uniqueSources = sources.filter((source, index, self) =>
        index === self.findIndex(s => s.url === source.url)
    ).slice(0, 10);

    return uniqueSources;
}

/**
 * Generate a news digest using Gemini with Google Grounding
 * @param {string} topic - The topic to generate digest for
 * @param {string} customPrompt - Optional custom prompt from user
 * @returns {Promise<{success: boolean, content?: string, sources?: array, error?: string}>}
 */
async function generateDigest(topic, customPrompt = '') {
    try {
        const topicContext = TOPICS[topic] || topic;

        // Build the prompt - ask Gemini to include sources
        let prompt = customPrompt
            ? `${customPrompt}\n\nFokus pada: ${topicContext}\n\nSertakan sumber berita jika tersedia.`
            : `Berikan ringkasan berita terkini hari ini tentang ${topicContext}. 
               
               Format respons:
               📰 **DAILY DIGEST: ${topic.toUpperCase()}**
               
               Berikan 3-5 berita paling penting dengan:
               - Judul berita
               - Ringkasan singkat (2-3 kalimat)
               - Sumber/link berita
               
               Di akhir, berikan daftar sumber berita yang digunakan.
               
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

        // Extract sources from grounding metadata
        const sources = extractSources(response);

        console.log(`✅ Digest generated successfully for topic: ${topic}`);
        console.log(`📚 Found ${sources.length} sources`);

        return {
            success: true,
            content: content,
            topic: topic,
            sources: sources
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
