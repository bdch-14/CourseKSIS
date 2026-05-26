import type { Room } from '../types/room.types';
import { io, type Socket } from 'socket.io-client';
import type {
    GameFinishedPayload,
    GameState,
    GameUpdatePayload,
} from '../types/game.types';

class SocketService {
    private socket: Socket | null = null;

    connect(token: string) {
        if (this.socket) {
            this.socket.auth = { token };

            if (!this.socket.connected) {
                this.socket.connect();
            }

            return this.socket;
        }

        this.socket = io({
            autoConnect: false,
            auth: {
                token,
            },
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });

        this.socket.connect();

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        return this.socket;
    }

    joinGameRoom(roomId: string) {
        this.socket?.emit('game:join-room', { roomId });
    }

    getGameState(roomId: string) {
        this.socket?.emit('game:get-state', { roomId });
    }

    flipCard(roomId: string, cardIndex: number) {
        this.socket?.emit('game:flip-card', { roomId, cardIndex });
    }

    onGameStarted(callback: (payload: GameState) => void) {
        this.socket?.on('game:started', callback);
    }

    onGameUpdate(callback: (payload: GameUpdatePayload) => void) {
        this.socket?.on('game:update', callback);
    }

    onGameFinished(callback: (payload: GameFinishedPayload) => void) {
        this.socket?.on('game:finished', callback);
    }

    onConnect(callback: () => void) {
        this.socket?.on('connect', callback);
    }

    onDisconnect(callback: () => void) {
        this.socket?.on('disconnect', callback);
    }

    onConnectError(callback: (error: Error) => void) {
        this.socket?.on('connect_error', callback);
    }

    offGameStarted(callback: (payload: GameState) => void) {
        this.socket?.off('game:started', callback);
    }

    offGameUpdate(callback: (payload: GameUpdatePayload) => void) {
        this.socket?.off('game:update', callback);
    }

    offGameFinished(callback: (payload: GameFinishedPayload) => void) {
        this.socket?.off('game:finished', callback);
    }

    offConnect(callback: () => void) {
        this.socket?.off('connect', callback);
    }

    offDisconnect(callback: () => void) {
        this.socket?.off('disconnect', callback);
    }

    offConnectError(callback: (error: Error) => void) {
        this.socket?.off('connect_error', callback);
    }

    onRoomUpdated(callback: (payload: Room) => void) {
        this.socket?.on('room:updated', callback);
    }

    offRoomUpdated(callback: (payload: Room) => void) {
        this.socket?.off('room:updated', callback);
    }
}

export const socketService = new SocketService();