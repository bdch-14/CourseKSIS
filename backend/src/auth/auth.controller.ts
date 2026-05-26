import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Res,
    UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshJwtAuthGuard } from './guards/refresh-jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async register(
        @Body() dto: RegisterDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.register(dto);
        const refreshToken = await this.authService.createRefreshToken(
            result.user.id,
            result.user.login,
        );

        this.setRefreshTokenCookie(res, refreshToken);

        return result;
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.login(dto);
        const refreshToken = await this.authService.createRefreshToken(
            result.user.id,
            result.user.login,
        );

        this.setRefreshTokenCookie(res, refreshToken);

        return result;
    }

    @UseGuards(RefreshJwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    async refresh(
        @CurrentUser()
        user: {
            id: string;
            login: string;
            refreshToken: string;
        },
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.refreshTokens(user.id, user.refreshToken);
        const refreshToken = await this.authService.createRefreshToken(
            result.user.id,
            result.user.login,
        );

        this.setRefreshTokenCookie(res, refreshToken);

        return result;
    }

    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('logout')
    async logout(
        @CurrentUser() user: { id: string },
        @Res({ passthrough: true }) res: Response,
    ) {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/api/auth/refresh',
        });

        return this.authService.logout(user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@CurrentUser() user: unknown) {
        return user;
    }

    private setRefreshTokenCookie(res: Response, refreshToken: string) {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/api/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }
}