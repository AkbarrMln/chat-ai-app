const schedule = require('node-schedule');
const { generateDigest } = require('./geminiService');
const { sendDigestNotification } = require('./pushService');
const { getUsersForDigestAtHour, addDigestToHistory } = require('../data/store');

let schedulerJob = null;

/**
 * Process digest for a single user
 * @param {string} deviceId - Device identifier
 * @param {Object} settings - User settings
 */
async function processUserDigest(deviceId, settings) {
    console.log(`📨 Processing digest for device: ${deviceId.substring(0, 15)}...`);

    try {
        // Generate digest using Gemini with Grounding
        const result = await generateDigest(settings.topic, settings.customPrompt);

        if (!result.success) {
            console.error(`❌ Failed to generate digest for ${deviceId}:`, result.error);
            return;
        }

        // Save to history
        const digest = addDigestToHistory(deviceId, result.content, settings.topic);

        // Extract first line as preview
        const firstLine = result.content.split('\n').find(line => line.trim()) || 'Berita terbaru untuk kamu!';

        // Send push notification
        await sendDigestNotification(
            settings.pushToken,
            settings.topic,
            digest.id,
            firstLine
        );

        console.log(`✅ Digest processed and sent for device: ${deviceId.substring(0, 15)}...`);

    } catch (error) {
        console.error(`❌ Error processing digest for ${deviceId}:`, error.message);
    }
}

/**
 * Main scheduler function - runs every minute to check for due digests
 */
async function runScheduler() {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();

    // Only run at the start of each hour (minute 0)
    if (currentMinute !== 0) {
        return;
    }

    console.log(`\n⏰ Scheduler running for hour ${currentHour}:00 UTC`);

    // Get users who should receive digest at this hour
    const users = getUsersForDigestAtHour(currentHour);

    if (users.length === 0) {
        console.log('📭 No users scheduled for this hour');
        return;
    }

    console.log(`📬 Found ${users.length} user(s) to process`);

    // Process each user
    for (const { deviceId, settings } of users) {
        await processUserDigest(deviceId, settings);

        // Small delay between users to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('✅ Scheduler run completed\n');
}

/**
 * Start the scheduler
 */
function startScheduler() {
    console.log('🚀 Starting digest scheduler...');

    // Run every minute to check for due digests
    schedulerJob = schedule.scheduleJob('* * * * *', runScheduler);

    console.log('✅ Scheduler started - checking every minute for due digests');
}

/**
 * Stop the scheduler
 */
function stopScheduler() {
    if (schedulerJob) {
        schedulerJob.cancel();
        schedulerJob = null;
        console.log('⏹️ Scheduler stopped');
    }
}

/**
 * Manually trigger a digest for testing
 * @param {string} deviceId - Device identifier
 * @param {string} topic - Topic for digest
 * @param {string} customPrompt - Optional custom prompt
 * @param {string} pushToken - Optional push token (if not saved)
 */
async function triggerManualDigest(deviceId, topic, customPrompt = '', pushToken = null) {
    console.log(`🧪 Manual digest trigger for topic: ${topic}`);

    // Generate digest
    const result = await generateDigest(topic, customPrompt);

    if (!result.success) {
        return {
            success: false,
            error: result.error
        };
    }

    // Save to history
    const digest = addDigestToHistory(deviceId, result.content, topic);

    // Send push notification if token provided
    if (pushToken) {
        const firstLine = result.content.split('\n').find(line => line.trim()) || 'Berita terbaru!';
        await sendDigestNotification(pushToken, topic, digest.id, firstLine);
    }

    return {
        success: true,
        digest: digest,
        content: result.content
    };
}

module.exports = {
    startScheduler,
    stopScheduler,
    triggerManualDigest,
    processUserDigest
};
