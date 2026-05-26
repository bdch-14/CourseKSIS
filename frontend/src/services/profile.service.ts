import type {
    MatchHistoryItem,
    ProfileStats,
    ProfileUser,
    UserProfileResponse,
} from '../types/profile.types';
import { apiFetch } from './api';

export const ProfileService = {
    async getMyProfile(): Promise<UserProfileResponse> {
        const [user, stats, history] = await Promise.all([
            apiFetch<ProfileUser>('/users/me', {
                method: 'GET',
                auth: true,
            }),
            apiFetch<ProfileStats>('/users/me/stats', {
                method: 'GET',
                auth: true,
            }),
            apiFetch<MatchHistoryItem[]>('/users/me/matches', {
                method: 'GET',
                auth: true,
            }),
        ]);

        const winRate =
            stats.totalGames > 0
                ? Math.round((stats.wins / stats.totalGames) * 100)
                : 0;

        return {
            user,
            stats: {
                ...stats,
                winRate,
            },
            history: history.map((item) => ({
                ...item,
                status: 'FINISHED',
            })),
        };
    },

    async updateMyProfile(payload: { displayName: string }): Promise<ProfileUser> {
        return apiFetch<ProfileUser>('/users/me', {
            method: 'PATCH',
            auth: true,
            body: JSON.stringify(payload),
        });
    },
};