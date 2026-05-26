import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto, res: Response): Promise<{
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
    login(dto: LoginDto, res: Response): Promise<{
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
    refresh(user: {
        id: string;
        login: string;
        refreshToken: string;
    }, res: Response): Promise<{
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
    logout(user: {
        id: string;
    }, res: Response): Promise<{
        message: string;
    }>;
    getMe(user: unknown): unknown;
    private setRefreshTokenCookie;
}
