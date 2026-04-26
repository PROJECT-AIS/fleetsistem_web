const trimTrailingSlash = (value = "") => value.replace(/\/+$/, "");

const configuredApiUrl = trimTrailingSlash(import.meta.env.VITE_API_URL || "");
const configuredBackendUrl = trimTrailingSlash(import.meta.env.VITE_BACKEND_URL || "");

export const API_BASE_URL = configuredApiUrl || "/api";

const backendFromApi = configuredApiUrl.endsWith("/api")
    ? configuredApiUrl.slice(0, -4)
    : configuredApiUrl;

export const BACKEND_BASE_URL = configuredBackendUrl || backendFromApi || "";

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
