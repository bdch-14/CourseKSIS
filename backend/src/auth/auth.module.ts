import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshJwtStrategy } from './strategies/refresh-jwt.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [
        JwtModule.register({}),
        UsersModule,
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy, RefreshJwtStrategy],
    exports: [AuthService],
})
export class AuthModule {}