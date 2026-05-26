import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(user: {
        id: string;
    }): Promise<{
        id: string;
        login: string;
        email: string;
        displayName: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateMe(user: {
        id: string;
    }, dto: UpdateProfileDto): Promise<{
        id: string;
        login: string;
        email: string;
        displayName: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getMyStats(user: {
        id: string;
    }): Promise<{
        totalGames: number;
        wins: number;
        losses: number;
        draws: number;
    }>;
    getMyMatches(user: {
        id: string;
    }): Promise<{
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
    getMyProfileBundle(user: {
        id: string;
    }): Promise<{
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
}
