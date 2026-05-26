import { IsEmail, IsString, Length, Matches } from 'class-validator';

export class RegisterDto {
    @IsString()
    @Length(3, 20)
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Логин может содержать только буквы, цифры и _',
    })
    login: string;

    @IsEmail({}, { message: 'Некорректный email' })
    email: string;

    @IsString()
    @Length(2, 30)
    displayName: string;

    @IsString()
    @Length(6, 32)
    password: string;
}