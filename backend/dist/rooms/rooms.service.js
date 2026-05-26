"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let RoomsService = class RoomsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getRooms(query) {
        return this.prisma.room.findMany({
            where: {
                ...(query.difficulty ? { difficulty: query.difficulty } : {}),
                ...(query.status ? { status: query.status } : { status: client_1.RoomStatus.WAITING }),
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        login: true,
                        displayName: true,
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                login: true,
                                displayName: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async getRoomById(roomId) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        login: true,
                        displayName: true,
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                login: true,
                                displayName: true,
                            },
                        },
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
            },
        });
        if (!room) {
            throw new common_1.NotFoundException('Комната не найдена');
        }
        return room;
    }
    async createRoom(userId, dto) {
        const code = await this.generateUniqueRoomCode();
        return this.prisma.room.create({
            data: {
                code,
                difficulty: dto.difficulty,
                status: client_1.RoomStatus.WAITING,
                createdById: userId,
                participants: {
                    create: {
                        userId,
                    },
                },
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        login: true,
                        displayName: true,
                    },
                },
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                login: true,
                                displayName: true,
                            },
                        },
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
            },
        });
    }
    async joinRoom(userId, roomId) {
        return this.prisma.$transaction(async (tx) => {
            const room = await tx.room.findUnique({
                where: { id: roomId },
                include: {
                    participants: {
                        orderBy: {
                            joinedAt: 'asc',
                        },
                    },
                },
            });
            if (!room) {
                throw new common_1.NotFoundException('Комната не найдена');
            }
            if (room.status !== client_1.RoomStatus.WAITING) {
                throw new common_1.BadRequestException('Комната уже недоступна для входа');
            }
            const alreadyInRoom = room.participants.some((participant) => participant.userId === userId);
            if (alreadyInRoom) {
                return tx.room.findUnique({
                    where: { id: roomId },
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                login: true,
                                displayName: true,
                            },
                        },
                        participants: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        login: true,
                                        displayName: true,
                                    },
                                },
                            },
                            orderBy: {
                                joinedAt: 'asc',
                            },
                        },
                    },
                });
            }
            if (room.createdById === userId) {
                throw new common_1.BadRequestException('Нельзя войти в свою же комнату повторно');
            }
            if (room.participants.length >= 2) {
                throw new common_1.BadRequestException('Комната заполнена');
            }
            await tx.roomParticipant.create({
                data: {
                    roomId,
                    userId,
                },
            });
            const participantsCount = await tx.roomParticipant.count({
                where: { roomId },
            });
            if (participantsCount === 2) {
                await tx.room.update({
                    where: { id: roomId },
                    data: {
                        status: client_1.RoomStatus.IN_GAME,
                    },
                });
            }
            return tx.room.findUnique({
                where: { id: roomId },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            login: true,
                            displayName: true,
                        },
                    },
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    login: true,
                                    displayName: true,
                                },
                            },
                        },
                        orderBy: {
                            joinedAt: 'asc',
                        },
                    },
                },
            });
        });
    }
    async quickJoin(userId, difficulty) {
        const room = await this.prisma.room.findFirst({
            where: {
                status: client_1.RoomStatus.WAITING,
                ...(difficulty ? { difficulty } : {}),
                createdById: {
                    not: userId,
                },
                participants: {
                    none: {
                        userId,
                    },
                },
            },
            include: {
                participants: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        if (!room) {
            throw new common_1.NotFoundException('Подходящая комната не найдена');
        }
        if (room.participants.length >= 2) {
            throw new common_1.BadRequestException('Комната уже заполнена');
        }
        return this.joinRoom(userId, room.id);
    }
    async leaveRoom(userId, roomId) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: {
                participants: true,
            },
        });
        if (!room) {
            throw new common_1.NotFoundException('Комната не найдена');
        }
        if (room.status !== client_1.RoomStatus.WAITING) {
            throw new common_1.BadRequestException('Нельзя покинуть комнату после старта матча');
        }
        const participant = room.participants.find((item) => item.userId === userId);
        if (!participant) {
            throw new common_1.BadRequestException('Вы не состоите в этой комнате');
        }
        await this.prisma.roomParticipant.delete({
            where: {
                roomId_userId: {
                    roomId,
                    userId,
                },
            },
        });
        const updatedCount = await this.prisma.roomParticipant.count({
            where: { roomId },
        });
        if (updatedCount === 0) {
            await this.prisma.room.delete({
                where: { id: roomId },
            });
            return {
                deleted: true,
            };
        }
        return {
            deleted: false,
            room: await this.getRoomById(roomId),
        };
    }
    async deleteRoom(userId, roomId) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: {
                participants: true,
            },
        });
        if (!room) {
            throw new common_1.NotFoundException('Комната не найдена');
        }
        if (room.createdById !== userId) {
            throw new common_1.ForbiddenException('Удалять комнату может только создатель');
        }
        if (room.status !== client_1.RoomStatus.WAITING) {
            throw new common_1.BadRequestException('Нельзя удалить комнату после старта матча');
        }
        await this.prisma.room.delete({
            where: { id: roomId },
        });
        return {
            message: 'Комната удалена',
        };
    }
    async generateUniqueRoomCode() {
        while (true) {
            const code = Math.random().toString(36).slice(2, 8).toUpperCase();
            const existingRoom = await this.prisma.room.findUnique({
                where: { code },
            });
            if (!existingRoom) {
                return code;
            }
        }
    }
};
exports.RoomsService = RoomsService;
exports.RoomsService = RoomsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RoomsService);
//# sourceMappingURL=rooms.service.js.map