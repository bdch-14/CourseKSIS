export interface User {
    id: string;
    login: string;
    email: string;
    displayName: string;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
}

export interface LoginPayload {
    login: string;
    password: string;
}

export interface RegisterPayload {
    login: string;
    email: string;
    displayName: string;
    password: string;
}