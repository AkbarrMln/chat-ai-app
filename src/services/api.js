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
