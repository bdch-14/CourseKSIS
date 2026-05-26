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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    findById(id) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
    findByLogin(login) {
        return this.prisma.user.findUnique({
            where: { login },
        });
    }
    create(data) {
        return this.prisma.user.create({
            data,
        });
    }
    updateRefreshTokenHash(userId, refreshTokenHash) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                refreshTokenHash,
            },
        });
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                displayName: dto.displayName,
            },
        });
        return this.sanitizeUser(user);
    }
    async getProfile(userId) {
        const user = await this.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException('Пользователь не найден');
        }
        return this.sanitizeUser(user);
    }
    async getStats(userId) {
        const baseWhere = {
            userId,
            match: {
                status: {
                    in: [client_1.MatchStatus.FINISHED, client_1.MatchStatus.ABORTED],
                },
            },
        };
        const [totalGames, wins, losses, draws] = await Promise.all([
            this.prisma.matchPlayer.count({
                where: baseWhere,
            }),
            this.prisma.matchPlayer.count({
                where: {
                    ...baseWhere,
                    result: client_1.MatchResult.WIN,
                },
            }),
            this.prisma.matchPlayer.count({
                where: {
                    ...baseWhere,
                    result: client_1.MatchResult.LOSE,
                },
            }),
            this.prisma.matchPlayer.count({
                where: {
                    ...baseWhere,
                    result: client_1.MatchResult.DRAW,
                },
            }),
        ]);
        return {
            totalGames,
            wins,
            losses,
            draws,
        };
    }
    async getMatchHistory(userId) {
        const matches = await this.prisma.matchPlayer.findMany({
            where: {
                userId,
                match: {
                    status: {
                        in: [client_1.MatchStatus.FINISHED, client_1.MatchStatus.ABORTED],
                    },
                },
            },
            include: {
                user: true,
                match: {
                    include: {
                        winner: true,
                        players: {
                            include: {
                                user: true,
                            },
                            orderBy: {
                                position: 'asc',
                            },
                        },
                    },
                },
            },
            orderBy: {
                match: {
                    finishedAt: 'desc',
                },
            },
        });
        return matches.map((matchPlayer) => {
            const currentPlayer = matchPlayer;
            const opponent = matchPlayer.match.players.find((player) => player.userId !== userId);
            return {
                matchId: matchPlayer.match.id,
                date: matchPlayer.match.finishedAt ?? matchPlayer.match.startedAt,
                difficulty: matchPlayer.match.difficulty,
                score: currentPlayer.score,
                opponentScore: opponent?.score ?? 0,
                opponent: opponent
                    ? {
                        id: opponent.user.id,
                        login: opponent.user.login,
                        displayName: opponent.user.displayName,
                    }
                    : null,
                winner: matchPlayer.match.winner
                    ? {
                        id: matchPlayer.match.winner.id,
                        login: matchPlayer.match.winner.login,
                        displayName: matchPlayer.match.winner.displayName,
                    }
                    : null,
                durationSeconds: matchPlayer.match.durationSeconds,
                result: currentPlayer.result,
            };
        });
    }
    async getProfileBundle(userId) {
        const [user, stats, matches] = await Promise.all([
            this.getProfile(userId),
            this.getStats(userId),
            this.getMatchHistory(userId),
        ]);
        const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
        return {
            user,
            stats: {
                ...stats,
                winRate,
            },
            history: matches.map((match) => ({
                id: match.matchId,
                playedAt: match.date,
                difficulty: match.difficulty,
                status: match.winner ? 'FINISHED' : 'ABORTED',
                myScore: match.score,
                opponentScore: match.opponentScore,
                result: match.result === 'LOSE' ? 'LOSS' : match.result,
                opponent: match.opponent,
                durationSeconds: match.durationSeconds,
            })),
        };
    }
    sanitizeUser(user) {
        return {
            id: user.id,
            login: user.login,
            email: user.email,
            displayName: user.displayName,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map