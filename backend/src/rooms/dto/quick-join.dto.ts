import { Difficulty } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class QuickJoinDto {
    @IsEnum(Difficulty)
    @IsOptional()
    difficulty?: Difficulty;
}