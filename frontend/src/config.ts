// Is the app running in production mode (on Render)?
const isProduction = import.meta.env.PROD;

// Get the base URL from the environment variables we will set.
// VITE_ is a special prefix that makes the variable accessible in the frontend code.
const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'localhost:3001';

// Export the full URLs for both HTTP and WebSocket connections
export const API_URL = isProduction ? `https://${backendBaseUrl}` : `http://${backendBaseUrl}`;
export const WS_URL = isProduction ? `wss://${backendBaseUrl}` : `ws://${backendBaseUrl}`;