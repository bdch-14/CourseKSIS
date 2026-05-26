import { Difficulty, RoomStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class RoomsQueryDto {
    @IsEnum(Difficulty)
    @IsOptional()
    difficulty?: Difficulty;

    @IsEnum(RoomStatus)
    @IsOptional()
    status?: RoomStatus;
}