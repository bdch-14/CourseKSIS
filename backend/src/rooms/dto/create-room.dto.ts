import { Difficulty } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class CreateRoomDto {
    @IsEnum(Difficulty)
    difficulty: Difficulty;
}