import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('me')
    getMe(@CurrentUser() user: { id: string }) {
        return this.usersService.getProfile(user.id);
    }

    @Patch('me')
    updateMe(
        @CurrentUser() user: { id: string },
        @Body() dto: UpdateProfileDto,
    ) {
        return this.usersService.updateProfile(user.id, dto);
    }

    @Get('me/stats')
    getMyStats(@CurrentUser() user: { id: string }) {
        return this.usersService.getStats(user.id);
    }

    @Get('me/matches')
    getMyMatches(@CurrentUser() user: { id: string }) {
        return this.usersService.getMatchHistory(user.id);
    }

    @Get('me/profile')
    getMyProfileBundle(@CurrentUser() user: { id: string }) {
        return this.usersService.getProfileBundle(user.id);
    }
}