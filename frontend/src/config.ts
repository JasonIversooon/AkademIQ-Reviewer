// Central configuration file
// Change the API_BASE here or in .env file to update across the entire app

// By default prefer the deployed HTTPS backend so the frontend served over HTTPS
// doesn't try to call an insecure local IP (which browsers block as mixed content).
// For local development override with an environment variable or an `.env` file:
//   VITE_API_BASE="http://localhost:8000"
export const API_BASE = import.meta.env.VITE_API_BASE || 'https://akademiq-reviewer-backend.onrender.com';
