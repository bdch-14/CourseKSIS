import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        displayName: string;
        id: string;
        login: string;
        email: string;
        passwordHash: string;
        refreshTokenHash: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findByLogin(login: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        displayName: string;
        id: string;
        login: string;
        email: string;
        passwordHash: string;
        refreshTokenHash: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    create(data: {
        login: string;
        email: string;
        passwordHash: string;
        displayName: string;
    }): import(".prisma/client").Prisma.Prisma__UserClient<{
        displayName: string;
        id: string;
        login: string;
        email: string;
        passwordHash: string;
        refreshTokenHash: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    updateRefreshTokenHash(userId: string, refreshTokenHash: string | null): import(".prisma/client").Prisma.Prisma__UserClient<{
        displayName: string;
        id: string;
        login: string;
        email: string;
        passwordHash: string;
        refreshTokenHash: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<{
        id: string;
        login: string;
        email: string;
        displayName: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        login: string;
        email: string;
        displayName: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getStats(userId: string): Promise<{
        totalGames: number;
        wins: number;
        losses: number;
        draws: number;
    }>;
    getMatchHistory(userId: string): Promise<{
        matchId: string;
        date: Date;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        score: number;
        opponentScore: number;
        opponent: {
            id: string;
            login: string;
            displayName: string;
        };
        winner: {
            id: string;
            login: string;
            displayName: string;
        };
        durationSeconds: number;
        result: import(".prisma/client").$Enums.MatchResult;
    }[]>;
    getProfileBundle(userId: string): Promise<{
        user: {
            id: string;
            login: string;
            email: string;
            displayName: string;
            createdAt: Date;
            updatedAt: Date;
        };
        stats: {
            winRate: number;
            totalGames: number;
            wins: number;
            losses: number;
            draws: number;
        };
        history: {
            id: string;
            playedAt: Date;
            difficulty: import(".prisma/client").$Enums.Difficulty;
            status: string;
            myScore: number;
            opponentScore: number;
            result: string;
            opponent: {
                id: string;
                login: string;
                displayName: string;
            };
            durationSeconds: number;
        }[];
    }>;
    private sanitizeUser;
}
