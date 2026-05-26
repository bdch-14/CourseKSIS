import { BadRequestException } from "@nestjs/common";
import {
    OnGatewayConnection,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
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

@WebSocketGateway({
    cors: {
        origin: 'http://localhost:5173',
        credentials: true,
    },
})
export class GameGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly gameService: GameService,
        private readonly roomsService: RoomsService,
    ) {}

    async handleConnection(client: AuthenticatedSocket) {
        try {
            const token = client.handshake.auth?.token;

            if (!token) {
                client.disconnect();
                return;
            }

            const payload = await this.jwtService.verifyAsync<{ sub: string; login: string }>(
                token,
                {
                    secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
                },
            );

            const user = await this.usersService.findById(payload.sub);

            if (!user) {
                client.disconnect();
                return;
            }

            client.user = {
                id: user.id,
                login: user.login,
                displayName: user.displayName,
            };

            client.on('disconnecting', async () => {
                if (!client.user || !client.currentRoomId) {
                    return;
                }

                const result = await this.gameService.handlePlayerDisconnect(
                    client.currentRoomId,
                    client.user.id,
                );

                if (result) {
                    this.server.to(client.currentRoomId).emit('game:finished', result);
                }
            });
        } catch {
            client.disconnect();
        }
    }

    @SubscribeMessage('game:join-room')
    async handleJoinRoom(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() payload: { roomId: string },
    ) {
        const { roomId } = payload;

        await client.join(roomId);
        client.currentRoomId = roomId;

        const room = await this.roomsService.getRoomById(roomId);

        this.server.to(roomId).emit('room:updated', room);

        if (room.participants.length === 2 && room.status === 'IN_GAME') {
            try {
                const gameState = await this.gameService.createGameForRoom(roomId);
                this.server.to(roomId).emit('game:started', gameState);
            } catch {
                const gameState = this.gameService.getGameState(roomId);
                if (gameState) {
                    this.server.to(roomId).emit('game:started', gameState);
                }
            }
        }
    }

    @SubscribeMessage('game:get-state')
    async getState(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() body: { roomId: string },
    ) {
        if (!client.user) {
            throw new BadRequestException('Пользователь не авторизован');
        }

        return this.gameService.getGameState(body.roomId);
    }

    @SubscribeMessage('game:flip-card')
    async flipCard(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() body: { roomId: string; cardIndex: number },
    ) {
        if (!client.user) {
            throw new BadRequestException('Пользователь не авторизован');
        }

        const result = await this.gameService.flipCard(
            body.roomId,
            client.user.id,
            body.cardIndex,
        );

        this.server.to(body.roomId).emit('game:update', result);

        if (result.type === 'GAME_FINISHED') {
            const players = result.state.players;
            const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
            const winnerUserId =
                sortedPlayers.length >= 2 && sortedPlayers[0].score === sortedPlayers[1].score
                    ? null
                    : sortedPlayers[0]?.userId ?? null;

            this.server.to(body.roomId).emit('game:finished', {
                roomId: body.roomId,
                winnerUserId,
                reason: 'GAME_COMPLETED',
            });
        }

        if (result.type === 'MATCH_FAIL') {
            setTimeout(() => {
                const nextState = this.gameService.hideMismatchedCards(body.roomId);
                this.server.to(body.roomId).emit('game:update', {
                    type: 'CARDS_HIDDEN',
                    state: nextState,
                });
            }, 1000);
        }

        return result;
    }
}