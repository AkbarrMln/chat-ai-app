import { getApiUrl } from '../config';

const API_URL = getApiUrl();

/**
 * Send a message to the AI backend and get a response
 * @param {string} message - The user's message
 * @param {Array} history - Previous messages for context
 * @returns {Promise<{success: boolean, response?: string, error?: string}>}
 */
export async function sendMessageToAI(message, history = []) {
    try {
        const response = await fetch(`${API_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                history: history.map(msg => ({
                    text: msg.text,
                    isUser: msg.isUser
                }))
            }),

        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to get AI response');
        }

        return {
            success: true,
            response: data.response
        };
    } catch (error) {
        console.error('API Error:', error);

        // Provide user-friendly error messages
        let errorMessage = 'Maaf, terjadi kesalahan. Silakan coba lagi.';

        if (error.message.includes('Network request failed')) {
            errorMessage = 'Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Koneksi timeout. Silakan coba lagi.';
        }

        return {
            success: false,
            error: errorMessage
        };
    }
}

/**
 * Check if the backend is available
 * @returns {Promise<boolean>}
 */
export async function checkBackendHealth() {
    try {
        const response = await fetch(`${API_URL}/api/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.ok;
    } catch (error) {
        console.error('Health check failed:', error);
        return false;
    }
}

// ============================================
// DIGEST API FUNCTIONS
// ============================================

/**
 * Get available digest topics
 * @returns {Promise<{success: boolean, topics?: string[], error?: string}>}
 */
export async function getDigestTopics() {
    try {
        const response = await fetch(`${API_URL}/api/digest/topics`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to get topics');
        }

        return { success: true, topics: data.topics };
    } catch (error) {
        console.error('Error getting topics:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get user digest settings
 * @param {string} deviceId - Device identifier
 * @returns {Promise<{success: boolean, settings?: object, error?: string}>}
 */
export async function getDigestSettings(deviceId) {
    try {
        const response = await fetch(`${API_URL}/api/digest/settings?deviceId=${deviceId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to get settings');
        }

        return { success: true, settings: data.settings };
    } catch (error) {
        console.error('Error getting digest settings:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Save user digest settings
 * @param {string} deviceId - Device identifier
 * @param {object} settings - { enabled, time, topic, customPrompt, timezone }
 * @returns {Promise<{success: boolean, settings?: object, error?: string}>}
 */
export async function saveDigestSettings(deviceId, settings) {
    try {
        const response = await fetch(`${API_URL}/api/digest/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId, ...settings })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to save settings');
        }

        return { success: true, settings: data.settings };
    } catch (error) {
        console.error('Error saving digest settings:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Register push token with backend
 * @param {string} deviceId - Device identifier
 * @param {string} pushToken - Expo push token
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function registerPushToken(deviceId, pushToken) {
    try {
        const response = await fetch(`${API_URL}/api/digest/register-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId, pushToken })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to register push token');
        }

        return { success: true };
    } catch (error) {
        console.error('Error registering push token:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get digest history
 * @param {string} deviceId - Device identifier
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise<{success: boolean, history?: array, error?: string}>}
 */
export async function getDigestHistory(deviceId, limit = 20) {
    try {
        const response = await fetch(`${API_URL}/api/digest/history?deviceId=${deviceId}&limit=${limit}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to get history');
        }

        return { success: true, history: data.history };
    } catch (error) {
        console.error('Error getting digest history:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get single digest detail
 * @param {string} deviceId - Device identifier
 * @param {string} digestId - Digest ID
 * @returns {Promise<{success: boolean, digest?: object, error?: string}>}
 */
export async function getDigestDetail(deviceId, digestId) {
    try {
        const response = await fetch(`${API_URL}/api/digest/history/${digestId}?deviceId=${deviceId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to get digest');
        }

        return { success: true, digest: data.digest };
    } catch (error) {
        console.error('Error getting digest detail:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Test digest generation (for development)
 * @param {string} deviceId - Device identifier
 * @param {string} topic - Topic for digest
 * @param {string} customPrompt - Optional custom prompt
 * @param {string} pushToken - Optional push token
 * @returns {Promise<{success: boolean, digest?: object, content?: string, error?: string}>}
 */
export async function testDigest(deviceId, topic, customPrompt = '', pushToken = null) {
    try {
        const response = await fetch(`${API_URL}/api/test-digest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId, topic, customPrompt, pushToken })
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate test digest');
        }

        return { success: true, digest: data.digest, content: data.content };
    } catch (error) {
        console.error('Error generating test digest:', error);
        return { success: false, error: error.message };
    }
}
