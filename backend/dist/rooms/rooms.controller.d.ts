import { CreateRoomDto } from './dto/create-room.dto';
import { QuickJoinDto } from './dto/quick-join.dto';
import { RoomsQueryDto } from './dto/rooms-query.dto';
import { RoomsService } from './rooms.service';
export declare class RoomsController {
    private readonly roomsService;
    constructor(roomsService: RoomsService);
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
    getRoom(id: string): Promise<{
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
    createRoom(user: {
        id: string;
    }, dto: CreateRoomDto): Promise<{
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
    quickJoin(user: {
        id: string;
    }, dto: QuickJoinDto): Promise<{
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
    joinRoom(user: {
        id: string;
    }, id: string): Promise<{
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
    leaveRoom(user: {
        id: string;
    }, id: string): Promise<{
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
    deleteRoom(user: {
        id: string;
    }, id: string): Promise<{
        message: string;
    }>;
}
