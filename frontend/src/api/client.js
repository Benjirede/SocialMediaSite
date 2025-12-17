const API_URL = "http://127.0.0.1:5000"

export function api(path, options = {}) {
    return fetch(`${API_URL}${path}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
        },
        ...options,
    });
}