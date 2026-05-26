import { Difficulty } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsQueryDto } from './dto/rooms-query.dto';
export declare class RoomsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRooms(query: RoomsQueryDto): Promise<({
        createdBy: {
            displayName: string;
            id: string;
            login: string;
        };
        participants: ({
            user: {
                displayName: string;
                id: string;
                login: string;
            };
        } & {
            id: string;
            roomId: string;
            userId: string;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        status: import(".prisma/client").$Enums.RoomStatus;
        code: string;
        createdById: string;
    })[]>;
    getRoomById(roomId: string): Promise<{
        createdBy: {
            displayName: string;
            id: string;
            login: string;
        };
        participants: ({
            user: {
                displayName: string;
                id: string;
                login: string;
            };
        } & {
            id: string;
            roomId: string;
            userId: string;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        status: import(".prisma/client").$Enums.RoomStatus;
        code: string;
        createdById: string;
    }>;
    createRoom(userId: string, dto: CreateRoomDto): Promise<{
        createdBy: {
            displayName: string;
            id: string;
            login: string;
        };
        participants: ({
            user: {
                displayName: string;
                id: string;
                login: string;
            };
        } & {
            id: string;
            roomId: string;
            userId: string;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        status: import(".prisma/client").$Enums.RoomStatus;
        code: string;
        createdById: string;
    }>;
    joinRoom(userId: string, roomId: string): Promise<{
        createdBy: {
            displayName: string;
            id: string;
            login: string;
        };
        participants: ({
            user: {
                displayName: string;
                id: string;
                login: string;
            };
        } & {
            id: string;
            roomId: string;
            userId: string;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        status: import(".prisma/client").$Enums.RoomStatus;
        code: string;
        createdById: string;
    }>;
    quickJoin(userId: string, difficulty?: Difficulty): Promise<{
        createdBy: {
            displayName: string;
            id: string;
            login: string;
        };
        participants: ({
            user: {
                displayName: string;
                id: string;
                login: string;
            };
        } & {
            id: string;
            roomId: string;
            userId: string;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        status: import(".prisma/client").$Enums.RoomStatus;
        code: string;
        createdById: string;
    }>;
    leaveRoom(userId: string, roomId: string): Promise<{
        deleted: boolean;
        room?: undefined;
    } | {
        deleted: boolean;
        room: {
            createdBy: {
                displayName: string;
                id: string;
                login: string;
            };
            participants: ({
                user: {
                    displayName: string;
                    id: string;
                    login: string;
                };
            } & {
                id: string;
                roomId: string;
                userId: string;
                joinedAt: Date;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            difficulty: import(".prisma/client").$Enums.Difficulty;
            status: import(".prisma/client").$Enums.RoomStatus;
            code: string;
            createdById: string;
        };
    }>;
    deleteRoom(userId: string, roomId: string): Promise<{
        message: string;
    }>;
    private generateUniqueRoomCode;
}
