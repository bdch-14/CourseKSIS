import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
declare const RefreshJwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class RefreshJwtStrategy extends RefreshJwtStrategy_base {
    private readonly configService;
    private readonly usersService;
    constructor(configService: ConfigService, usersService: UsersService);
    validate(req: Request, payload: {
        sub: string;
        login: string;
    }): Promise<{
        id: string;
        login: string;
        email: string;
        displayName: string;
        createdAt: Date;
        updatedAt: Date;
        refreshToken: any;
    }>;
}
export {};
