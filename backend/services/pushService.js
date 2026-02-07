const { Expo } = require('expo-server-sdk');

// Initialize Expo SDK
const expo = new Expo();

/**
 * Send push notification to a device
 * @param {string} pushToken - Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data to send with notification
 * @returns {Promise<{success: boolean, ticketId?: string, error?: string}>}
 */
async function sendPushNotification(pushToken, title, body, data = {}) {
    try {
        // Validate push token
        if (!Expo.isExpoPushToken(pushToken)) {
            console.error(`❌ Invalid Expo push token: ${pushToken}`);
            return {
                success: false,
                error: 'Invalid push token'
            };
        }

        // Build the message
        const message = {
            to: pushToken,
            sound: 'default',
            title: title,
            body: body,
            data: data,
            priority: 'high',
            channelId: 'digest-notifications', // Android notification channel
        };

        console.log(`📤 Sending push notification to: ${pushToken.substring(0, 30)}...`);

        // Send notification
        const chunks = expo.chunkPushNotifications([message]);
        const tickets = [];

        for (let chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error('❌ Error sending notification chunk:', error);
            }
        }

        // Check for errors in tickets
        const ticket = tickets[0];
        if (ticket.status === 'ok') {
            console.log(`✅ Push notification sent successfully. Ticket ID: ${ticket.id}`);
            return {
                success: true,
                ticketId: ticket.id
            };
        } else {
            console.error(`❌ Push notification failed:`, ticket.message);
            return {
                success: false,
                error: ticket.message || 'Unknown error'
            };
        }

    } catch (error) {
        console.error('❌ Error sending push notification:', error.message);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Send digest notification
 * @param {string} pushToken - Expo push token
 * @param {string} topic - Digest topic
 * @param {string} digestId - ID of the digest for deep linking
 * @param {string} preview - Short preview of digest content
 */
async function sendDigestNotification(pushToken, topic, digestId, preview) {
    const title = `📰 Daily Digest: ${topic}`;
    const body = preview.length > 100 ? preview.substring(0, 100) + '...' : preview;

    return sendPushNotification(pushToken, title, body, {
        type: 'digest',
        digestId: digestId,
        topic: topic
    });
}

module.exports = {
    sendPushNotification,
    sendDigestNotification
};
