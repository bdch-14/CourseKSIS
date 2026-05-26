"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const jwt_1 = require("@nestjs/jwt");
const socket_io_1 = require("socket.io");
const config_1 = require("@nestjs/config");
const users_service_1 = require("../users/users.service");
const rooms_service_1 = require("../rooms/rooms.service");
const game_service_1 = require("./game.service");
let GameGateway = class GameGateway {
    constructor(jwtService, configService, usersService, gameService, roomsService) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.usersService = usersService;
        this.gameService = gameService;
        this.roomsService = roomsService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token;
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
            });
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
                const result = await this.gameService.handlePlayerDisconnect(client.currentRoomId, client.user.id);
                if (result) {
                    this.server.to(client.currentRoomId).emit('game:finished', result);
                }
            });
        }
        catch {
            client.disconnect();
        }
    }
    async handleJoinRoom(client, payload) {
        const { roomId } = payload;
        await client.join(roomId);
        client.currentRoomId = roomId;
        const room = await this.roomsService.getRoomById(roomId);
        this.server.to(roomId).emit('room:updated', room);
        if (room.participants.length === 2 && room.status === 'IN_GAME') {
            try {
                const gameState = await this.gameService.createGameForRoom(roomId);
                this.server.to(roomId).emit('game:started', gameState);
            }
            catch {
                const gameState = this.gameService.getGameState(roomId);
                if (gameState) {
                    this.server.to(roomId).emit('game:started', gameState);
                }
            }
        }
    }
    async getState(client, body) {
        if (!client.user) {
            throw new common_1.BadRequestException('Пользователь не авторизован');
        }
        return this.gameService.getGameState(body.roomId);
    }
    async flipCard(client, body) {
        if (!client.user) {
            throw new common_1.BadRequestException('Пользователь не авторизован');
        }
        const result = await this.gameService.flipCard(body.roomId, client.user.id, body.cardIndex);
        this.server.to(body.roomId).emit('game:update', result);
        if (result.type === 'GAME_FINISHED') {
            const players = result.state.players;
            const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
            const winnerUserId = sortedPlayers.length >= 2 && sortedPlayers[0].score === sortedPlayers[1].score
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
};
exports.GameGateway = GameGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], GameGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:join-room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:get-state'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "getState", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('game:flip-card'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "flipCard", null);
exports.GameGateway = GameGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: 'http://localhost:5173',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        users_service_1.UsersService,
        game_service_1.GameService,
        rooms_service_1.RoomsService])
], GameGateway);
//# sourceMappingURL=game.gateway.js.map