import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Difficulty, RoomStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomsQueryDto } from './dto/rooms-query.dto';

@Injectable()
export class RoomsService {
    constructor(private readonly prisma: PrismaService) {}

    async getRooms(query: RoomsQueryDto) {
        return this.prisma.room.findMany({
            where: {
                ...(query.difficulty ? { difficulty: query.difficulty } : {}),
                ...(query.status ? { status: query.status } : { status: RoomStatus.WAITING }),
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

    async getRoomById(roomId: string) {
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
            throw new NotFoundException('Комната не найдена');
        }

        return room;
    }

    async createRoom(userId: string, dto: CreateRoomDto) {
        const code = await this.generateUniqueRoomCode();

        return this.prisma.room.create({
            data: {
                code,
                difficulty: dto.difficulty,
                status: RoomStatus.WAITING,
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

    async joinRoom(userId: string, roomId: string) {
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
                throw new NotFoundException('Комната не найдена');
            }

            if (room.status !== RoomStatus.WAITING) {
                throw new BadRequestException('Комната уже недоступна для входа');
            }

            const alreadyInRoom = room.participants.some(
                (participant) => participant.userId === userId,
            );

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
                throw new BadRequestException('Нельзя войти в свою же комнату повторно');
            }

            if (room.participants.length >= 2) {
                throw new BadRequestException('Комната заполнена');
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
                        status: RoomStatus.IN_GAME,
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

    async quickJoin(userId: string, difficulty?: Difficulty) {
        const room = await this.prisma.room.findFirst({
            where: {
                status: RoomStatus.WAITING,
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
            throw new NotFoundException('Подходящая комната не найдена');
        }

        if (room.participants.length >= 2) {
            throw new BadRequestException('Комната уже заполнена');
        }

        return this.joinRoom(userId, room.id);
    }

    async leaveRoom(userId: string, roomId: string) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: {
                participants: true,
            },
        });

        if (!room) {
            throw new NotFoundException('Комната не найдена');
        }

        if (room.status !== RoomStatus.WAITING) {
            throw new BadRequestException('Нельзя покинуть комнату после старта матча');
        }

        const participant = room.participants.find((item) => item.userId === userId);

        if (!participant) {
            throw new BadRequestException('Вы не состоите в этой комнате');
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

    async deleteRoom(userId: string, roomId: string) {
        const room = await this.prisma.room.findUnique({
            where: { id: roomId },
            include: {
                participants: true,
            },
        });

        if (!room) {
            throw new NotFoundException('Комната не найдена');
        }

        if (room.createdById !== userId) {
            throw new ForbiddenException('Удалять комнату может только создатель');
        }

        if (room.status !== RoomStatus.WAITING) {
            throw new BadRequestException('Нельзя удалить комнату после старта матча');
        }

        await this.prisma.room.delete({
            where: { id: roomId },
        });

        return {
            message: 'Комната удалена',
        };
    }

    private async generateUniqueRoomCode() {
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
}