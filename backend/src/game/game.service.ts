import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Difficulty, MatchResult, MatchStatus, RoomStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { EMOJI_SETS } from './constants/emoji-sets';
import { GameCard, GamePlayerState, GameState } from './interfaces/game-state.interface';
import { shuffleArray } from './utils/shuffle.util';

@Injectable()
export class GameService {
    private readonly activeGames = new Map<string, GameState>();

    constructor(
        private readonly prisma: PrismaService,
        private readonly roomsService: RoomsService,
    ) {}

    async createGameForRoom(roomId: string) {
        const existingGame = this.activeGames.get(roomId);

        if (existingGame) {
            return this.toPublicState(existingGame);
        }

        const room = await this.roomsService.getRoomById(roomId);

        if (room.participants.length !== 2) {
            throw new BadRequestException('Для старта игры требуется 2 игрока');
        }

        const existingMatch = await this.prisma.match.findUnique({
            where: { roomId },
        });

        if (existingMatch && existingMatch.status === MatchStatus.FINISHED) {
            throw new BadRequestException('Матч для этой комнаты уже завершён');
        }

        const difficulty = room.difficulty;
        const values = EMOJI_SETS[difficulty];
        const boardValues = shuffleArray([...values, ...values]);

        const board: GameCard[] = boardValues.map((value, index) => ({
            id: `${roomId}_${index}`,
            value,
            isMatched: false,
            isFaceUp: false,
        }));

        const players: GamePlayerState[] = room.participants.map((participant) => ({
            userId: participant.user.id,
            login: participant.user.login,
            displayName: participant.user.displayName,
            score: 0,
        }));

        const gameState: GameState = {
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
                        status: MatchStatus.IN_PROGRESS,
                        players: {
                            create: players.map((player, index) => ({
                                userId: player.userId,
                                score: 0,
                                result: MatchResult.DRAW,
                                position: index + 1,
                            })),
                        },
                    },
                });
            } catch (error) {
                if (
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code !== 'P2002'
                ) {
                    throw error;
                }
            }
        }

        this.activeGames.set(roomId, gameState);

        return this.toPublicState(gameState);
    }

    getGameState(roomId: string) {
        const game = this.activeGames.get(roomId);

        if (!game) {
            throw new NotFoundException('Игра не найдена');
        }

        return this.toPublicState(game);
    }

    async flipCard(roomId: string, userId: string, cardIndex: number) {
        const game = this.activeGames.get(roomId);

        if (!game) {
            throw new NotFoundException('Игра не найдена');
        }

        if (game.status !== 'IN_PROGRESS') {
            throw new BadRequestException('Игра уже завершена');
        }

        if (game.currentTurnUserId !== userId) {
            throw new BadRequestException('Сейчас не ваш ход');
        }

        if (game.openedCardIndexes.length >= 2) {
            throw new BadRequestException('Дождитесь завершения текущего хода');
        }

        const card = game.board[cardIndex];

        if (!card) {
            throw new BadRequestException('Карточка не найдена');
        }

        if (card.isMatched || card.isFaceUp) {
            throw new BadRequestException('Эту карточку нельзя открыть');
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

    hideMismatchedCards(roomId: string) {
        const game = this.activeGames.get(roomId);

        if (!game) {
            throw new NotFoundException('Игра не найдена');
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

    async handlePlayerDisconnect(roomId: string, disconnectedUserId: string) {
        const game = this.activeGames.get(roomId);

        if (!game) {
            return null;
        }

        const winner = game.players.find((player) => player.userId !== disconnectedUserId);

        game.status = 'FINISHED';

        const durationSeconds = Math.floor(
            (Date.now() - game.startedAt.getTime()) / 1000,
        );

        await this.prisma.$transaction(async (tx) => {
            await tx.match.update({
                where: { roomId },
                data: {
                    status: MatchStatus.FINISHED,
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
                        result:
                            player.userId === disconnectedUserId
                                ? MatchResult.LOSE
                                : MatchResult.WIN,
                    },
                });
            }

            await tx.room.update({
                where: { id: roomId },
                data: {
                    status: RoomStatus.FINISHED,
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

    private async finishGame(roomId: string) {
        const game = this.activeGames.get(roomId);

        if (!game) {
            throw new NotFoundException('Игра не найдена');
        }

        game.status = 'FINISHED';

        const [firstPlayer, secondPlayer] = game.players;
        const winner =
            firstPlayer.score > secondPlayer.score
                ? firstPlayer
                : secondPlayer.score > firstPlayer.score
                    ? secondPlayer
                    : null;

        const durationSeconds = Math.floor(
            (Date.now() - game.startedAt.getTime()) / 1000,
        );

        const match = await this.prisma.match.findUnique({
            where: { roomId },
        });

        if (!match) {
            throw new NotFoundException('Матч не найден');
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.match.update({
                where: { roomId },
                data: {
                    status: MatchStatus.FINISHED,
                    finishedAt: new Date(),
                    durationSeconds,
                    winnerId: winner?.userId ?? null,
                },
            });

            for (const player of game.players) {
                let result: MatchResult = MatchResult.DRAW;

                if (winner) {
                    result =
                        player.userId === winner.userId ? MatchResult.WIN : MatchResult.LOSE;
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
                    status: RoomStatus.FINISHED,
                },
            });
        });

        const publicState = this.toPublicState(game);
        this.activeGames.delete(roomId);

        return publicState;
    }

    private toPublicState(game: GameState) {
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
}