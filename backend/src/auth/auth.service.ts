import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { StringValue } from 'ms';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { TokenPair } from './interfaces/token-pair.interface';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async register(dto: RegisterDto) {
        const existingUser = await this.usersService.findByLogin(dto.login);

        if (existingUser) {
            throw new BadRequestException('Логин уже занят');
        }

        const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS')) || 10;
        const passwordHash = await bcrypt.hash(dto.password, saltRounds);

        const user = await this.usersService.create({
            login: dto.login,
            email: dto.email,
            displayName: dto.displayName,
            passwordHash,
        });

        const tokens = await this.generateTokens(user.id, user.login);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

        return {
            user: this.sanitizeUser(user),
            accessToken: tokens.accessToken,
        };
    }

    async login(dto: LoginDto) {
        const user = await this.usersService.findByLogin(dto.login);

        if (!user) {
            throw new UnauthorizedException('Неверный логин или пароль');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Неверный логин или пароль');
        }

        const tokens = await this.generateTokens(user.id, user.login);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

        return {
            user: this.sanitizeUser(user),
            accessToken: tokens.accessToken,
        };
    }

    async refreshTokens(userId: string, refreshToken: string) {
        const user = await this.usersService.findById(userId);

        if (!user || !user.refreshTokenHash) {
            throw new UnauthorizedException('Доступ запрещен');
        }

        const isRefreshTokenValid = await bcrypt.compare(
            refreshToken,
            user.refreshTokenHash,
        );

        if (!isRefreshTokenValid) {
            throw new UnauthorizedException('Невалидный refresh token');
        }

        const tokens = await this.generateTokens(user.id, user.login);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

        return {
            user: this.sanitizeUser(user),
            accessToken: tokens.accessToken,
        };
    }

    async logout(userId: string) {
        await this.usersService.updateRefreshTokenHash(userId, null);

        return {
            message: 'Вы успешно вышли из системы',
        };
    }

    async createRefreshToken(userId: string, login: string) {
        const tokens = await this.generateTokens(userId, login);
        await this.updateRefreshTokenHash(userId, tokens.refreshToken);

        return tokens.refreshToken;
    }

    private async generateTokens(userId: string, login: string): Promise<TokenPair> {
        const payload: JwtPayload = {
            sub: userId,
            login,
        };

        const accessExpiresIn = this.configService.get<string>(
            'JWT_ACCESS_EXPIRES_IN',
        ) as StringValue;

        const refreshExpiresIn = this.configService.get<string>(
            'JWT_REFRESH_EXPIRES_IN',
        ) as StringValue;

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
                expiresIn: accessExpiresIn,
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: refreshExpiresIn,
            }),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    private async updateRefreshTokenHash(userId: string, refreshToken: string) {
        const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS')) || 10;
        const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);

        await this.usersService.updateRefreshTokenHash(userId, refreshTokenHash);
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