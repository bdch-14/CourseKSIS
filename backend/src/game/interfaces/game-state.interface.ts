import { Difficulty } from '@prisma/client';

export interface GameCard {
    id: string;
    value: string;
    isMatched: boolean;
    isFaceUp: boolean;
}

export interface GamePlayerState {
    userId: string;
    login: string;
    displayName: string;
    score: number;
}

export interface GameState {
    roomId: string;
    difficulty: Difficulty;
    startedAt: Date;
    currentTurnUserId: string;
    board: GameCard[];
    players: GamePlayerState[];
    openedCardIndexes: number[];
    status: 'IN_PROGRESS' | 'FINISHED';
}