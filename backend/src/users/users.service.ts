import { Injectable, NotFoundException } from '@nestjs/common';
import { MatchResult, MatchStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
    constructor(private readonly prisma: PrismaService) {}

    findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    findByLogin(login: string) {
        return this.prisma.user.findUnique({
            where: { login },
        });
    }

    create(data: {
        login: string;
        email: string;
        passwordHash: string;
        displayName: string;
    }) {
        return this.prisma.user.create({
            data,
        });
    }

    updateRefreshTokenHash(userId: string, refreshTokenHash: string | null) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                refreshTokenHash,
            },
        });
    }

    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                displayName: dto.displayName,
            },
        });

        return this.sanitizeUser(user);
    }

    async getProfile(userId: string) {
        const user = await this.findById(userId);

        if (!user) {
            throw new NotFoundException('Пользователь не найден');
        }

        return this.sanitizeUser(user);
    }

    async getStats(userId: string) {
        const baseWhere = {
            userId,
            match: {
                status: {
                    in: [MatchStatus.FINISHED, MatchStatus.ABORTED],
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
                    result: MatchResult.WIN,
                },
            }),
            this.prisma.matchPlayer.count({
                where: {
                    ...baseWhere,
                    result: MatchResult.LOSE,
                },
            }),
            this.prisma.matchPlayer.count({
                where: {
                    ...baseWhere,
                    result: MatchResult.DRAW,
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
    async getMatchHistory(userId: string) {
        const matches = await this.prisma.matchPlayer.findMany({
            where: {
                userId,
                match: {
                    status: {
                        in: [MatchStatus.FINISHED, MatchStatus.ABORTED],
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
            const opponent = matchPlayer.match.players.find(
                (player) => player.userId !== userId,
            );

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

    async getProfileBundle(userId: string) {
        const [user, stats, matches] = await Promise.all([
            this.getProfile(userId),
            this.getStats(userId),
            this.getMatchHistory(userId),
        ]);

        const winRate =
            stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;

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

    private sanitizeUser(user: {
        id: string;
        login: string;
        email: string;
        displayName: string;
        createdAt: Date;
        updatedAt: Date;
    }) {
        return {
            id: user.id,
            login: user.login,
            email: user.email,
            displayName: user.displayName,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}