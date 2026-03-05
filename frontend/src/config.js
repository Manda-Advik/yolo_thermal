// Use environment variable for production, fallback to empty string for local proxy
export const API_URL = import.meta.env.VITE_API_URL || "";
