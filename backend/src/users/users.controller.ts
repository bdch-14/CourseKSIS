import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@CurrentUser() user: unknown) {
        return user;
    }
}