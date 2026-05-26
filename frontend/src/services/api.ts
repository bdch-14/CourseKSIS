const API_URL = '/api';

let accessToken: string | null = localStorage.getItem('find_pair_access_token');
let refreshPromise: Promise<string | null> | null = null;

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
    _retry?: boolean;
};

const buildHeaders = (auth: boolean, headers?: HeadersInit): HeadersInit => {
    return {
        'Content-Type': 'application/json',
        ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(headers ?? {}),
    };
};

const refreshAccessToken = async (): Promise<string | null> => {
    if (!refreshPromise) {
        refreshPromise = (async () => {
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                setAccessToken(null);
                return null;
            }

            const data = (await response.json()) as { accessToken: string };

            if (!data.accessToken) {
                setAccessToken(null);
                return null;
            }

            setAccessToken(data.accessToken);
            return data.accessToken;
        })().finally(() => {
            refreshPromise = null;
        });
    }

    return refreshPromise;
};

export const apiFetch = async <T>(
    endpoint: string,
    options: RequestOptions = {},
): Promise<T> => {
    const { auth = false, headers, _retry = false, ...restOptions } = options;

    const normalizedEndpoint = endpoint.startsWith('/api')
        ? endpoint
        : `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const response = await fetch(normalizedEndpoint, {
        ...restOptions,
        credentials: 'include',
        headers: buildHeaders(auth, headers),
    });

    if (response.status === 401 && auth && !_retry) {
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
            return apiFetch<T>(endpoint, {
                ...options,
                _retry: true,
            });
        }

        throw new Error('Сессия истекла. Выполните вход снова.');
    }

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