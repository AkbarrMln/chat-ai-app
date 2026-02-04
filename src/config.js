// API Configuration
// Change this URL when deploying to production

const DEV_API_URL = 'http://localhost:3001';
const PROD_API_URL = 'https://your-backend.railway.app'; // Update after deployment

// For development, we use local. For production builds, use PROD_API_URL
// Note: On Android emulator, use 10.0.2.2 instead of localhost
// For physical device, use your computer's local IP address

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// Get the appropriate URL for the current platform
export const getApiUrl = () => {
    // For Android physical device or Expo Go, you might need your local IP
    // Example: return 'http://192.168.1.100:3001';
    return API_URL;
};
