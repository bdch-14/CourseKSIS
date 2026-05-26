import type { Difficulty } from './shared.types';

export interface GameCard {
    id: string;
    value: string | null;
    isMatched: boolean;
    isFaceUp: boolean;
}

export interface GamePlayer {
    userId: string;
    login: string;
    displayName: string;
    score: number;
}

export interface GameState {
    roomId: string;
    difficulty: Difficulty;
    startedAt: string;
    currentTurnUserId: string;
    status: 'IN_PROGRESS' | 'FINISHED';
    players: GamePlayer[];
    openedCardIndexes: number[];
    board: GameCard[];
}

export interface GameUpdatePayload {
    type: 'FIRST_CARD_OPENED' | 'MATCH_SUCCESS' | 'MATCH_FAIL' | 'CARDS_HIDDEN' | 'GAME_FINISHED';
    state: GameState;
    openedIndexes?: number[];
}

export interface GameFinishedPayload {
    roomId: string;
    winnerUserId: string | null;
    disconnectedUserId: string;
    reason: 'PLAYER_DISCONNECTED';
}