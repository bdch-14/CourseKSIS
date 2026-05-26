import { IsString, Length } from 'class-validator';

export class LoginDto {
    @IsString()
    @Length(3, 20)
    login: string;

    @IsString()
    @Length(6, 32)
    password: string;
}