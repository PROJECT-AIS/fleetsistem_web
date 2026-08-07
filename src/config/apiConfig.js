const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const DEFAULT_BACKEND_ORIGIN = `http://${hostname}:6969`;
const DEFAULT_API_BASE_URL = `${DEFAULT_BACKEND_ORIGIN}/api`;

const configuredApiUrl = trimTrailingSlash(import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL);
const configuredBackendUrl = trimTrailingSlash(import.meta.env.VITE_BACKEND_URL || DEFAULT_BACKEND_ORIGIN);

export const API_BASE_URL = configuredApiUrl;

const isRelative = configuredApiUrl.startsWith("/");
const backendFromApi = configuredApiUrl.endsWith("/api")
    ? configuredApiUrl.slice(0, -4)
    : configuredApiUrl;

export const BACKEND_BASE_URL = configuredBackendUrl || (isRelative ? "" : backendFromApi) || DEFAULT_BACKEND_ORIGIN;

export const resolveBackendUrl = (path = "") => {
    if (!path) {
        return "";
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${BACKEND_BASE_URL}${normalizedPath}`;
};
