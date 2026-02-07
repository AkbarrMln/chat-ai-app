import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerPushToken } from './api';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

const DEVICE_ID_KEY = '@device_id';
const PUSH_TOKEN_KEY = '@push_token';

/**
 * Generate or retrieve device ID
 * @returns {Promise<string>}
 */
export async function getDeviceId() {
    try {
        let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

        if (!deviceId) {
            // Generate a unique device ID
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
        }

        return deviceId;
    } catch (error) {
        console.error('Error getting device ID:', error);
        return 'unknown_device';
    }
}

/**
 * Request push notification permissions
 * @returns {Promise<boolean>}
 */
export async function requestNotificationPermissions() {
    if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return false;
    }

    return true;
}

/**
 * Get Expo push token and register with backend
 * @returns {Promise<string|null>}
 */
export async function registerForPushNotifications() {
    try {
        const hasPermission = await requestNotificationPermissions();

        if (!hasPermission) {
            return null;
        }

        // Get Expo push token
        const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId: 'your-project-id' // Will be auto-detected from app.json
        });

        const pushToken = tokenData.data;
        const deviceId = await getDeviceId();

        // Store locally
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, pushToken);

        // Register with backend
        await registerPushToken(deviceId, pushToken);

        console.log('Push token registered:', pushToken.substring(0, 30) + '...');

        // Set up notification channel for Android
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('digest-notifications', {
                name: 'Daily Digest',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#356899',
            });
        }

        return pushToken;

    } catch (error) {
        console.error('Error registering for push notifications:', error);
        return null;
    }
}

/**
 * Get stored push token
 * @returns {Promise<string|null>}
 */
export async function getStoredPushToken() {
    try {
        return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    } catch (error) {
        return null;
    }
}

/**
 * Add notification received listener
 * @param {Function} callback - Called when notification received while app is foregrounded
 * @returns {Object} Subscription to remove later
 */
export function addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add notification response listener (when user taps notification)
 * @param {Function} callback - Called with notification response
 * @returns {Object} Subscription to remove later
 */
export function addNotificationResponseListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the last notification response (if app opened via notification)
 * @returns {Promise<Object|null>}
 */
export async function getLastNotificationResponse() {
    return await Notifications.getLastNotificationResponseAsync();
}
