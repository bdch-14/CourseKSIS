import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RoomsModule } from '../rooms/rooms.module';
import { UsersModule } from '../users/users.module';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';

@Module({
    imports: [JwtModule.register({}), UsersModule, RoomsModule],
    providers: [GameGateway, GameService],
    exports: [GameService],
})
export class GameModule {}