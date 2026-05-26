import { Difficulty } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsQueryDto } from './dto/rooms-query.dto';
export declare class RoomsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getRooms(query: RoomsQueryDto): Promise<({
        createdBy: {
            id: string;
            login: string;
            displayName: string;
        };
        participants: ({
            user: {
                id: string;
                login: string;
                displayName: string;
            };
        } & {
            id: string;
            roomId: string;
            userId: string;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        code: string;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        status: import(".prisma/client").$Enums.RoomStatus;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getRoomById(roomId: string): Promise<{
        createdBy: {
            id: string;
            login: string;
            displayName: string;
        };
        participants: ({
            user: {
                id: string;
                login: string;
                displayName: string;
            };
        } & {
            id: string;
            roomId: string;
            userId: string;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        code: string;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        status: import(".prisma/client").$Enums.RoomStatus;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createRoom(userId: string, dto: CreateRoomDto): Promise<{
        createdBy: {
            id: string;
            login: string;
            displayName: string;
        };
        participants: ({
            user: {
                id: string;
                login: string;
                displayName: string;
            };
        } & {
            id: string;
            roomId: string;
            userId: string;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        code: string;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        status: import(".prisma/client").$Enums.RoomStatus;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    joinRoom(userId: string, roomId: string): Promise<{
        createdBy: {
            id: string;
            login: string;
            displayName: string;
        };
        participants: ({
            user: {
                id: string;
                login: string;
                displayName: string;
            };
        } & {
            id: string;
            roomId: string;
            userId: string;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        code: string;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        status: import(".prisma/client").$Enums.RoomStatus;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    quickJoin(userId: string, difficulty?: Difficulty): Promise<{
        createdBy: {
            id: string;
            login: string;
            displayName: string;
        };
        participants: ({
            user: {
                id: string;
                login: string;
                displayName: string;
            };
        } & {
            id: string;
            roomId: string;
            userId: string;
            joinedAt: Date;
        })[];
    } & {
        id: string;
        code: string;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        status: import(".prisma/client").$Enums.RoomStatus;
        createdById: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    leaveRoom(userId: string, roomId: string): Promise<{
        deleted: boolean;
        room?: undefined;
    } | {
        deleted: boolean;
        room: {
            createdBy: {
                id: string;
                login: string;
                displayName: string;
            };
            participants: ({
                user: {
                    id: string;
                    login: string;
                    displayName: string;
                };
            } & {
                id: string;
                roomId: string;
                userId: string;
                joinedAt: Date;
            })[];
        } & {
            id: string;
            code: string;
            difficulty: import(".prisma/client").$Enums.Difficulty;
            status: import(".prisma/client").$Enums.RoomStatus;
            createdById: string;
            createdAt: Date;
            updatedAt: Date;
        };
    }>;
    deleteRoom(userId: string, roomId: string): Promise<{
        message: string;
    }>;
    private generateUniqueRoomCode;
}
