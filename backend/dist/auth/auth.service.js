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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async register(dto) {
        const existingUser = await this.usersService.findByLogin(dto.login);
        if (existingUser) {
            throw new common_1.BadRequestException('Логин уже занят');
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
    async login(dto) {
        const user = await this.usersService.findByLogin(dto.login);
        if (!user) {
            throw new common_1.UnauthorizedException('Неверный логин или пароль');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Неверный логин или пароль');
        }
        const tokens = await this.generateTokens(user.id, user.login);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
        return {
            user: this.sanitizeUser(user),
            accessToken: tokens.accessToken,
        };
    }
    async refreshTokens(userId, refreshToken) {
        const user = await this.usersService.findById(userId);
        if (!user || !user.refreshTokenHash) {
            throw new common_1.UnauthorizedException('Доступ запрещен');
        }
        const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!isRefreshTokenValid) {
            throw new common_1.UnauthorizedException('Невалидный refresh token');
        }
        const tokens = await this.generateTokens(user.id, user.login);
        await this.updateRefreshTokenHash(user.id, tokens.refreshToken);
        return {
            user: this.sanitizeUser(user),
            accessToken: tokens.accessToken,
        };
    }
    async logout(userId) {
        await this.usersService.updateRefreshTokenHash(userId, null);
        return {
            message: 'Вы успешно вышли из системы',
        };
    }
    async createRefreshToken(userId, login) {
        const tokens = await this.generateTokens(userId, login);
        await this.updateRefreshTokenHash(userId, tokens.refreshToken);
        return tokens.refreshToken;
    }
    async generateTokens(userId, login) {
        const payload = {
            sub: userId,
            login,
        };
        const accessExpiresIn = this.configService.get('JWT_ACCESS_EXPIRES_IN');
        const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN');
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_ACCESS_SECRET'),
                expiresIn: accessExpiresIn,
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: refreshExpiresIn,
            }),
        ]);
        return {
            accessToken,
            refreshToken,
        };
    }
    async updateRefreshTokenHash(userId, refreshToken) {
        const saltRounds = Number(this.configService.get('BCRYPT_SALT_ROUNDS')) || 10;
        const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);
        await this.usersService.updateRefreshTokenHash(userId, refreshTokenHash);
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
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map