import type { Difficulty, RoomStatus } from '../types/shared.types';
import type { Room } from '../types/room.types';
import { apiFetch } from './api';

export interface RoomsQuery {
    difficulty?: Difficulty;
    status?: RoomStatus;
}

export const RoomsService = {
    getRooms(query?: RoomsQuery) {
        const params = new URLSearchParams();

        if (query?.difficulty) {
            params.set('difficulty', query.difficulty);
        }

        if (query?.status) {
            params.set('status', query.status);
        }

        const queryString = params.toString();
        const endpoint = queryString ? `/rooms?${queryString}` : '/rooms';

        return apiFetch<Room[]>(endpoint, {
            method: 'GET',
            auth: true,
        });
    },

    getRoom(id: string) {
        return apiFetch<Room>(`/rooms/${id}`, {
            method: 'GET',
            auth: true,
        });
    },

    createRoom(difficulty: Difficulty) {
        return apiFetch<Room>('/rooms', {
            method: 'POST',
            auth: true,
            body: JSON.stringify({ difficulty }),
        });
    },

    quickJoin(difficulty?: Difficulty) {
        return apiFetch<Room>('/rooms/quick-join', {
            method: 'POST',
            auth: true,
            body: difficulty ? JSON.stringify({ difficulty }) : undefined,
        });
    },

    joinRoom(id: string) {
        return apiFetch<Room>(`/rooms/${id}/join`, {
            method: 'POST',
            auth: true,
        });
    },

    leaveRoom(id: string) {
        return apiFetch<{ deleted: boolean; room?: Room }>(`/rooms/${id}/leave`, {
            method: 'DELETE',
            auth: true,
        });
    },

    deleteRoom(id: string) {
        return apiFetch<{ message: string }>(`/rooms/${id}`, {
            method: 'DELETE',
            auth: true,
        });
    },
};