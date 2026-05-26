import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        user: {
            id: string;
            login: string;
            email: string;
            displayName: string;
            createdAt: Date;
            updatedAt: Date;
        };
        accessToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            login: string;
            email: string;
            displayName: string;
            createdAt: Date;
            updatedAt: Date;
        };
        accessToken: string;
    }>;
    refreshTokens(userId: string, refreshToken: string): Promise<{
        user: {
            id: string;
            login: string;
            email: string;
            displayName: string;
            createdAt: Date;
            updatedAt: Date;
        };
        accessToken: string;
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
    createRefreshToken(userId: string, login: string): Promise<string>;
    private generateTokens;
    private updateRefreshTokenHash;
    private sanitizeUser;
}
