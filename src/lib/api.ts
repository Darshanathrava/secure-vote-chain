import axios from 'axios';

// VITE_API_URL may be the bare server URL or end in /api; always end up with exactly one /api.
const rawBase: string = import.meta.env.VITE_API_URL || 'http://localhost:1322';
const baseURL = rawBase.trim().replace(/\/+$/, '').replace(/\/api$/, '') + '/api';

const api = axios.create({ baseURL });

/** Turn an axios error into a message that says what actually went wrong. */
export function describeApiError(err: any, fallback = "Something went wrong"): string {
  const serverMsg = err?.response?.data?.error;
  if (serverMsg) return serverMsg;
  const base = api.defaults.baseURL;
  if (err?.response) {
    return `Server at ${base} answered ${err.response.status} but not with an API error. It may be running the wrong service.`;
  }
  if (err?.request) {
    if (/localhost|127\.0\.0\.1/.test(String(base)) && window.location.hostname !== "localhost") {
      return `The site is calling ${base}. Set VITE_API_URL on Vercel to your Render API URL and redeploy.`;
    }
    return `Cannot reach the server at ${base}. It may be asleep, down, or blocking this site (CORS).`;
  }
  return err?.message || fallback;
}

export default api;
