import { IsString, Length } from 'class-validator';

export class UpdateProfileDto {
    @IsString()
    @Length(2, 30)
    displayName: string;
}