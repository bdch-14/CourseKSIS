import type {
    AuthResponse,
    LoginPayload,
    RegisterPayload,
    User,
} from '../types/auth.types';
import { apiFetch } from './api';

export const AuthService = {
    register(payload: RegisterPayload) {
        return apiFetch<AuthResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    login(payload: LoginPayload) {
        return apiFetch<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    },

    refresh() {
        return apiFetch<AuthResponse>('/auth/refresh', {
            method: 'POST',
        });
    },

    getMe() {
        return apiFetch<User>('/auth/me', {
            method: 'GET',
            auth: true,
        });
    },

    logout() {
        return apiFetch<{ message: string }>('/auth/logout', {
            method: 'POST',
            auth: true,
        });
    },
};