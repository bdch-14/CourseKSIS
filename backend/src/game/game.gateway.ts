import { BadRequestException } from "@nestjs/common";
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
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
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly gameService: GameService,
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
        } catch {
            client.disconnect();
        }
    }

    async handleDisconnect(client: AuthenticatedSocket) {
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
    }

    @SubscribeMessage('game:join-room')
    async joinRoom(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() body: { roomId: string },
    ) {
        if (!client.user) {
            throw new BadRequestException('Пользователь не авторизован');
        }

        client.join(body.roomId);
        client.currentRoomId = body.roomId;

        const game = await this.gameService.createGameForRoom(body.roomId);

        this.server.to(body.roomId).emit('game:started', game);

        return game;
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