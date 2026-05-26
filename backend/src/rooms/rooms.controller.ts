import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateRoomDto } from './dto/create-room.dto';
import { QuickJoinDto } from './dto/quick-join.dto';
import { RoomsQueryDto } from './dto/rooms-query.dto';
import { RoomsService } from './rooms.service';

@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) {}

    @Get()
    getRooms(@Query() query: RoomsQueryDto) {
        return this.roomsService.getRooms(query);
    }

    @Get(':id')
    getRoom(@Param('id') id: string) {
        return this.roomsService.getRoomById(id);
    }

    @Post()
    createRoom(
        @CurrentUser() user: { id: string },
        @Body() dto: CreateRoomDto,
    ) {
        return this.roomsService.createRoom(user.id, dto);
    }

    @Post('quick-join')
    quickJoin(
        @CurrentUser() user: { id: string },
        @Body() dto: QuickJoinDto,
    ) {
        return this.roomsService.quickJoin(user.id, dto.difficulty);
    }

    @Post(':id/join')
    joinRoom(
        @CurrentUser() user: { id: string },
        @Param('id') id: string,
    ) {
        return this.roomsService.joinRoom(user.id, id);
    }

    @Delete(':id/leave')
    leaveRoom(
        @CurrentUser() user: { id: string },
        @Param('id') id: string,
    ) {
        return this.roomsService.leaveRoom(user.id, id);
    }

    @Delete(':id')
    deleteRoom(
        @CurrentUser() user: { id: string },
        @Param('id') id: string,
    ) {
        return this.roomsService.deleteRoom(user.id, id);
    }
}