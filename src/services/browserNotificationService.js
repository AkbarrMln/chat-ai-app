/**
 * Browser Notification Service
 * Handles web browser notifications using the Notification API
 */

// Check if browser supports notifications
export const isBrowserNotificationSupported = () => {
    return typeof window !== 'undefined' && 'Notification' in window;
};

// Get current notification permission status
export const getNotificationPermission = () => {
    if (!isBrowserNotificationSupported()) return 'unsupported';
    return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async () => {
    if (!isBrowserNotificationSupported()) {
        console.log('Browser notifications not supported');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        console.log('Notification permission denied');
        return false;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

// Show browser notification
export const showBrowserNotification = (title, options = {}) => {
    if (!isBrowserNotificationSupported()) {
        console.log('Browser notifications not supported');
        return null;
    }

    if (Notification.permission !== 'granted') {
        console.log('Notification permission not granted');
        return null;
    }

    const defaultOptions = {
        icon: '/assets/icon.png',
        badge: '/assets/icon.png',
        vibrate: [200, 100, 200],
        requireInteraction: false,
        ...options
    };

    const notification = new Notification(title, defaultOptions);

    // Handle notification click
    notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        if (options.onClick) {
            options.onClick(event);
        }
        notification.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => {
        notification.close();
    }, 5000);

    return notification;
};

// Schedule a browser notification (for demo purposes)
export const scheduleBrowserNotification = (title, body, delay = 0, onClick = null) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const notification = showBrowserNotification(title, {
                body,
                onClick
            });
            resolve(notification);
        }, delay);
    });
};

export default {
    isBrowserNotificationSupported,
    getNotificationPermission,
    requestNotificationPermission,
    showBrowserNotification,
    scheduleBrowserNotification
};
