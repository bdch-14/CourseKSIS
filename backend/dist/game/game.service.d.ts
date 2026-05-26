import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { GamePlayerState } from './interfaces/game-state.interface';
export declare class GameService {
    private readonly prisma;
    private readonly roomsService;
    private readonly activeGames;
    constructor(prisma: PrismaService, roomsService: RoomsService);
    createGameForRoom(roomId: string): Promise<{
        roomId: string;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        startedAt: Date;
        currentTurnUserId: string;
        status: "FINISHED" | "IN_PROGRESS";
        players: GamePlayerState[];
        openedCardIndexes: number[];
        board: {
            id: string;
            value: string;
            isMatched: boolean;
            isFaceUp: boolean;
        }[];
    }>;
    getGameState(roomId: string): {
        roomId: string;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        startedAt: Date;
        currentTurnUserId: string;
        status: "FINISHED" | "IN_PROGRESS";
        players: GamePlayerState[];
        openedCardIndexes: number[];
        board: {
            id: string;
            value: string;
            isMatched: boolean;
            isFaceUp: boolean;
        }[];
    };
    flipCard(roomId: string, userId: string, cardIndex: number): Promise<{
        type: string;
        state: {
            roomId: string;
            difficulty: import(".prisma/client").$Enums.Difficulty;
            startedAt: Date;
            currentTurnUserId: string;
            status: "FINISHED" | "IN_PROGRESS";
            players: GamePlayerState[];
            openedCardIndexes: number[];
            board: {
                id: string;
                value: string;
                isMatched: boolean;
                isFaceUp: boolean;
            }[];
        };
        openedIndexes?: undefined;
    } | {
        type: string;
        state: {
            roomId: string;
            difficulty: import(".prisma/client").$Enums.Difficulty;
            startedAt: Date;
            currentTurnUserId: string;
            status: "FINISHED" | "IN_PROGRESS";
            players: GamePlayerState[];
            openedCardIndexes: number[];
            board: {
                id: string;
                value: string;
                isMatched: boolean;
                isFaceUp: boolean;
            }[];
        };
        openedIndexes: number[];
    }>;
    hideMismatchedCards(roomId: string): {
        roomId: string;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        startedAt: Date;
        currentTurnUserId: string;
        status: "FINISHED" | "IN_PROGRESS";
        players: GamePlayerState[];
        openedCardIndexes: number[];
        board: {
            id: string;
            value: string;
            isMatched: boolean;
            isFaceUp: boolean;
        }[];
    };
    handlePlayerDisconnect(roomId: string, disconnectedUserId: string): Promise<{
        roomId: string;
        winnerUserId: string;
        disconnectedUserId: string;
        reason: string;
    }>;
    private finishGame;
    private toPublicState;
}
