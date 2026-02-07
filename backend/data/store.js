const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// File path for persistence
const DATA_FILE = path.join(__dirname, 'data.json');

// In-memory store
let store = {
    // User digest settings: { [deviceId]: { enabled, time, topic, customPrompt, pushToken, timezone } }
    userSettings: {},
    // Digest history: { [deviceId]: [{ id, content, topic, createdAt }] }
    digestHistory: {}
};

// Load data from file on startup
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            store = JSON.parse(data);
            console.log('📂 Loaded data from file');
        }
    } catch (error) {
        console.error('Error loading data:', error.message);
    }
}

// Save data to file
function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
    } catch (error) {
        console.error('Error saving data:', error.message);
    }
}

// Initialize data
loadData();

/**
 * Get user digest settings
 * @param {string} deviceId - Device identifier
 * @returns {Object|null} User settings or null
 */
function getUserSettings(deviceId) {
    return store.userSettings[deviceId] || null;
}

/**
 * Save user digest settings
 * @param {string} deviceId - Device identifier
 * @param {Object} settings - { enabled, time, topic, customPrompt, timezone }
 */
function saveUserSettings(deviceId, settings) {
    store.userSettings[deviceId] = {
        ...store.userSettings[deviceId],
        ...settings,
        updatedAt: new Date().toISOString()
    };
    saveData();
    return store.userSettings[deviceId];
}

/**
 * Register push token for device
 * @param {string} deviceId - Device identifier
 * @param {string} pushToken - Expo push token
 */
function registerPushToken(deviceId, pushToken) {
    if (!store.userSettings[deviceId]) {
        store.userSettings[deviceId] = {};
    }
    store.userSettings[deviceId].pushToken = pushToken;
    store.userSettings[deviceId].updatedAt = new Date().toISOString();
    saveData();
}

/**
 * Get all users who should receive digest at a specific UTC hour
 * @param {number} hour - UTC hour (0-23)
 * @returns {Array} Array of { deviceId, settings }
 */
function getUsersForDigestAtHour(hour) {
    const users = [];

    for (const [deviceId, settings] of Object.entries(store.userSettings)) {
        if (settings.enabled && settings.pushToken && settings.time) {
            // Parse stored time (format: "HH:MM")
            const [storedHour] = settings.time.split(':').map(Number);

            // Check if time matches (stored time is in UTC)
            if (storedHour === hour) {
                users.push({ deviceId, settings });
            }
        }
    }

    return users;
}

/**
 * Add digest to history
 * @param {string} deviceId - Device identifier
 * @param {string} content - Digest content
 * @param {string} topic - Topic of digest
 * @returns {Object} The created digest entry
 */
function addDigestToHistory(deviceId, content, topic) {
    if (!store.digestHistory[deviceId]) {
        store.digestHistory[deviceId] = [];
    }

    const digest = {
        id: uuidv4(),
        content: content,
        topic: topic,
        createdAt: new Date().toISOString()
    };

    // Add to beginning of array (newest first)
    store.digestHistory[deviceId].unshift(digest);

    // Keep only last 50 digests per user
    if (store.digestHistory[deviceId].length > 50) {
        store.digestHistory[deviceId] = store.digestHistory[deviceId].slice(0, 50);
    }

    saveData();
    return digest;
}

/**
 * Get digest history for user
 * @param {string} deviceId - Device identifier
 * @param {number} limit - Max number of digests to return
 * @returns {Array} Array of digest entries
 */
function getDigestHistory(deviceId, limit = 20) {
    const history = store.digestHistory[deviceId] || [];
    return history.slice(0, limit);
}

/**
 * Get single digest by ID
 * @param {string} deviceId - Device identifier
 * @param {string} digestId - Digest ID
 * @returns {Object|null} Digest entry or null
 */
function getDigestById(deviceId, digestId) {
    const history = store.digestHistory[deviceId] || [];
    return history.find(d => d.id === digestId) || null;
}

/**
 * Get all device IDs with enabled digest
 * @returns {Array} Array of device IDs
 */
function getAllEnabledDevices() {
    return Object.entries(store.userSettings)
        .filter(([_, settings]) => settings.enabled && settings.pushToken)
        .map(([deviceId]) => deviceId);
}

module.exports = {
    getUserSettings,
    saveUserSettings,
    registerPushToken,
    getUsersForDigestAtHour,
    addDigestToHistory,
    getDigestHistory,
    getDigestById,
    getAllEnabledDevices
};
