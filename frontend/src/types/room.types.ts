import type { Difficulty, RoomStatus } from './shared.types';

export interface RoomParticipantUser {
    id: string;
    login: string;
    displayName: string;
}

export interface RoomParticipant {
    user: RoomParticipantUser;
}

export interface Room {
    id: string;
    code: string;
    difficulty: Difficulty;
    status: RoomStatus;
    createdAt: string;
    createdBy: RoomParticipantUser;
    participants: RoomParticipant[];
}