const API_URL = import.meta.env.VITE_API_URL;

let accessToken: string | null = localStorage.getItem('find_pair_access_token');

export const setAccessToken = (token: string | null) => {
    accessToken = token;

    if (token) {
        localStorage.setItem('find_pair_access_token', token);
    } else {
        localStorage.removeItem('find_pair_access_token');
    }
};

type RequestOptions = RequestInit & {
    auth?: boolean;
};

export const apiFetch = async <T>(
    endpoint: string,
    options: RequestOptions = {},
): Promise<T> => {
    const { auth = false, headers, ...restOptions } = options;

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...restOptions,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(headers ?? {}),
        },
    });

    if (!response.ok) {
        let message = 'Ошибка запроса';

        try {
            const errorData = await response.json();
            message = errorData.message || message;
        } catch {
            message = response.statusText || message;
        }

        throw new Error(message);
    }

    if (response.status === 204) {
        return null as T;
    }

    return response.json() as Promise<T>;
};