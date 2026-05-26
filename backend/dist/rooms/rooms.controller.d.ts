import { CreateRoomDto } from './dto/create-room.dto';
import { QuickJoinDto } from './dto/quick-join.dto';
import { RoomsQueryDto } from './dto/rooms-query.dto';
import { RoomsService } from './rooms.service';
export declare class RoomsController {
    private readonly roomsService;
    constructor(roomsService: RoomsService);
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
    getRoom(id: string): Promise<{
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
    createRoom(user: {
        id: string;
    }, dto: CreateRoomDto): Promise<{
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
    quickJoin(user: {
        id: string;
    }, dto: QuickJoinDto): Promise<{
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
    joinRoom(user: {
        id: string;
    }, id: string): Promise<{
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
    leaveRoom(user: {
        id: string;
    }, id: string): Promise<{
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
    deleteRoom(user: {
        id: string;
    }, id: string): Promise<{
        message: string;
    }>;
}
