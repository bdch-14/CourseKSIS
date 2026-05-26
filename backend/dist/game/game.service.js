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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const rooms_service_1 = require("../rooms/rooms.service");
const emoji_sets_1 = require("./constants/emoji-sets");
const shuffle_util_1 = require("./utils/shuffle.util");
let GameService = class GameService {
    constructor(prisma, roomsService) {
        this.prisma = prisma;
        this.roomsService = roomsService;
        this.activeGames = new Map();
    }
    async createGameForRoom(roomId) {
        const existingGame = this.activeGames.get(roomId);
        if (existingGame) {
            return this.toPublicState(existingGame);
        }
        const room = await this.roomsService.getRoomById(roomId);
        if (room.participants.length !== 2) {
            throw new common_1.BadRequestException('Для старта игры требуется 2 игрока');
        }
        const existingMatch = await this.prisma.match.findUnique({
            where: { roomId },
        });
        if (existingMatch && existingMatch.status === client_1.MatchStatus.FINISHED) {
            throw new common_1.BadRequestException('Матч для этой комнаты уже завершён');
        }
        const difficulty = room.difficulty;
        const values = emoji_sets_1.EMOJI_SETS[difficulty];
        const boardValues = (0, shuffle_util_1.shuffleArray)([...values, ...values]);
        const board = boardValues.map((value, index) => ({
            id: `${roomId}_${index}`,
            value,
            isMatched: false,
            isFaceUp: false,
        }));
        const players = room.participants.map((participant) => ({
            userId: participant.user.id,
            login: participant.user.login,
            displayName: participant.user.displayName,
            score: 0,
        }));
        const gameState = {
            roomId,
            difficulty,
            startedAt: new Date(),
            currentTurnUserId: players[0].userId,
            board,
            players,
            openedCardIndexes: [],
            status: 'IN_PROGRESS',
        };
        if (!existingMatch) {
            try {
                await this.prisma.match.create({
                    data: {
                        roomId,
                        difficulty,
                        status: client_1.MatchStatus.IN_PROGRESS,
                        players: {
                            create: players.map((player, index) => ({
                                userId: player.userId,
                                score: 0,
                                result: client_1.MatchResult.DRAW,
                                position: index + 1,
                            })),
                        },
                    },
                });
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                    error.code !== 'P2002') {
                    throw error;
                }
            }
        }
        this.activeGames.set(roomId, gameState);
        return this.toPublicState(gameState);
    }
    getGameState(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) {
            throw new common_1.NotFoundException('Игра не найдена');
        }
        return this.toPublicState(game);
    }
    async flipCard(roomId, userId, cardIndex) {
        const game = this.activeGames.get(roomId);
        if (!game) {
            throw new common_1.NotFoundException('Игра не найдена');
        }
        if (game.status !== 'IN_PROGRESS') {
            throw new common_1.BadRequestException('Игра уже завершена');
        }
        if (game.currentTurnUserId !== userId) {
            throw new common_1.BadRequestException('Сейчас не ваш ход');
        }
        if (game.openedCardIndexes.length >= 2) {
            throw new common_1.BadRequestException('Дождитесь завершения текущего хода');
        }
        const card = game.board[cardIndex];
        if (!card) {
            throw new common_1.BadRequestException('Карточка не найдена');
        }
        if (card.isMatched || card.isFaceUp) {
            throw new common_1.BadRequestException('Эту карточку нельзя открыть');
        }
        card.isFaceUp = true;
        game.openedCardIndexes.push(cardIndex);
        if (game.openedCardIndexes.length < 2) {
            return {
                type: 'FIRST_CARD_OPENED',
                state: this.toPublicState(game),
            };
        }
        const [firstIndex, secondIndex] = game.openedCardIndexes;
        const firstCard = game.board[firstIndex];
        const secondCard = game.board[secondIndex];
        if (firstCard.value === secondCard.value) {
            firstCard.isMatched = true;
            secondCard.isMatched = true;
            const currentPlayer = game.players.find((player) => player.userId === userId);
            if (currentPlayer) {
                currentPlayer.score += 1;
            }
            game.openedCardIndexes = [];
            const allMatched = game.board.every((item) => item.isMatched);
            if (allMatched) {
                const finalResult = await this.finishGame(roomId);
                return {
                    type: 'GAME_FINISHED',
                    state: finalResult,
                };
            }
            return {
                type: 'MATCH_SUCCESS',
                state: this.toPublicState(game),
            };
        }
        const nextPlayer = game.players.find((player) => player.userId !== userId);
        game.currentTurnUserId = nextPlayer?.userId ?? game.currentTurnUserId;
        return {
            type: 'MATCH_FAIL',
            state: this.toPublicState(game),
            openedIndexes: [...game.openedCardIndexes],
        };
    }
    hideMismatchedCards(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) {
            throw new common_1.NotFoundException('Игра не найдена');
        }
        if (game.openedCardIndexes.length !== 2) {
            return this.toPublicState(game);
        }
        for (const index of game.openedCardIndexes) {
            game.board[index].isFaceUp = false;
        }
        game.openedCardIndexes = [];
        return this.toPublicState(game);
    }
    async handlePlayerDisconnect(roomId, disconnectedUserId) {
        const game = this.activeGames.get(roomId);
        if (!game) {
            return null;
        }
        const winner = game.players.find((player) => player.userId !== disconnectedUserId);
        game.status = 'FINISHED';
        const durationSeconds = Math.floor((Date.now() - game.startedAt.getTime()) / 1000);
        await this.prisma.$transaction(async (tx) => {
            await tx.match.update({
                where: { roomId },
                data: {
                    status: client_1.MatchStatus.FINISHED,
                    finishedAt: new Date(),
                    durationSeconds,
                    winnerId: winner?.userId,
                    disconnectedUserId,
                },
            });
            const match = await tx.match.findUniqueOrThrow({
                where: { roomId },
            });
            for (const player of game.players) {
                await tx.matchPlayer.update({
                    where: {
                        matchId_userId: {
                            matchId: match.id,
                            userId: player.userId,
                        },
                    },
                    data: {
                        score: player.score,
                        result: player.userId === disconnectedUserId
                            ? client_1.MatchResult.LOSE
                            : client_1.MatchResult.WIN,
                    },
                });
            }
            await tx.room.update({
                where: { id: roomId },
                data: {
                    status: client_1.RoomStatus.FINISHED,
                },
            });
        });
        this.activeGames.delete(roomId);
        return {
            roomId,
            winnerUserId: winner?.userId ?? null,
            disconnectedUserId,
            reason: 'PLAYER_DISCONNECTED',
        };
    }
    async finishGame(roomId) {
        const game = this.activeGames.get(roomId);
        if (!game) {
            throw new common_1.NotFoundException('Игра не найдена');
        }
        game.status = 'FINISHED';
        const [firstPlayer, secondPlayer] = game.players;
        const winner = firstPlayer.score > secondPlayer.score
            ? firstPlayer
            : secondPlayer.score > firstPlayer.score
                ? secondPlayer
                : null;
        const durationSeconds = Math.floor((Date.now() - game.startedAt.getTime()) / 1000);
        const match = await this.prisma.match.findUnique({
            where: { roomId },
        });
        if (!match) {
            throw new common_1.NotFoundException('Матч не найден');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.match.update({
                where: { roomId },
                data: {
                    status: client_1.MatchStatus.FINISHED,
                    finishedAt: new Date(),
                    durationSeconds,
                    winnerId: winner?.userId ?? null,
                },
            });
            for (const player of game.players) {
                let result = client_1.MatchResult.DRAW;
                if (winner) {
                    result =
                        player.userId === winner.userId ? client_1.MatchResult.WIN : client_1.MatchResult.LOSE;
                }
                await tx.matchPlayer.update({
                    where: {
                        matchId_userId: {
                            matchId: match.id,
                            userId: player.userId,
                        },
                    },
                    data: {
                        score: player.score,
                        result,
                    },
                });
            }
            await tx.room.update({
                where: { id: roomId },
                data: {
                    status: client_1.RoomStatus.FINISHED,
                },
            });
        });
        const publicState = this.toPublicState(game);
        this.activeGames.delete(roomId);
        return publicState;
    }
    toPublicState(game) {
        return {
            roomId: game.roomId,
            difficulty: game.difficulty,
            startedAt: game.startedAt,
            currentTurnUserId: game.currentTurnUserId,
            status: game.status,
            players: game.players,
            openedCardIndexes: game.openedCardIndexes,
            board: game.board.map((card) => ({
                id: card.id,
                value: card.isFaceUp || card.isMatched ? card.value : null,
                isMatched: card.isMatched,
                isFaceUp: card.isFaceUp,
            })),
        };
    }
};
exports.GameService = GameService;
exports.GameService = GameService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rooms_service_1.RoomsService])
], GameService);
//# sourceMappingURL=game.service.js.map