import type { Difficulty } from './shared.types';

export interface ProfileUser {
    id: string;
    login: string;
    email: string;
    displayName: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProfileStats {
    totalGames: number;
    wins: number;
    losses: number;
    draws: number;
}

export interface MatchHistoryItem {
    matchId: string;
    date: string;
    difficulty: Difficulty;
    score: number;
    opponentScore: number;
    opponent: {
        id: string;
        login: string;
        displayName: string;
    } | null;
    winner: {
        id: string;
        login: string;
        displayName: string;
    } | null;
    durationSeconds: number | null;
    result: 'WIN' | 'LOSE' | 'DRAW';
}

export interface UserProfileResponse {
    user: ProfileUser;
    stats: ProfileStats & {
        winRate: number;
    };
    history: Array<
        MatchHistoryItem & {
        status: 'FINISHED' | 'ABORTED';
    }
    >;
}