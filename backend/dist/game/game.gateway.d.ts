import { OnGatewayConnection } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RoomsService } from '../rooms/rooms.service';
import { GameService } from './game.service';
interface AuthenticatedSocket extends Socket {
    user?: {
        id: string;
        login: string;
        displayName: string;
    };
    currentRoomId?: string;
}
export declare class GameGateway implements OnGatewayConnection {
    private readonly jwtService;
    private readonly configService;
    private readonly usersService;
    private readonly gameService;
    private readonly roomsService;
    server: Server;
    constructor(jwtService: JwtService, configService: ConfigService, usersService: UsersService, gameService: GameService, roomsService: RoomsService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleJoinRoom(client: AuthenticatedSocket, payload: {
        roomId: string;
    }): Promise<void>;
    getState(client: AuthenticatedSocket, body: {
        roomId: string;
    }): Promise<{
        roomId: string;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        startedAt: Date;
        currentTurnUserId: string;
        status: "IN_PROGRESS" | "FINISHED";
        players: import("./interfaces/game-state.interface").GamePlayerState[];
        openedCardIndexes: number[];
        board: {
            id: string;
            value: string;
            isMatched: boolean;
            isFaceUp: boolean;
        }[];
    }>;
    flipCard(client: AuthenticatedSocket, body: {
        roomId: string;
        cardIndex: number;
    }): Promise<{
        type: string;
        state: {
            roomId: string;
            difficulty: import(".prisma/client").$Enums.Difficulty;
            startedAt: Date;
            currentTurnUserId: string;
            status: "IN_PROGRESS" | "FINISHED";
            players: import("./interfaces/game-state.interface").GamePlayerState[];
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
            status: "IN_PROGRESS" | "FINISHED";
            players: import("./interfaces/game-state.interface").GamePlayerState[];
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
}
export {};
