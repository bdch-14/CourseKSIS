import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { useAuthContext } from '../../context/AuthContext';
import { RoomsService } from '../../services/rooms.service';
import { socketService } from '../../services/socket.service';
import type { Room } from '../../types/room.types';

const difficultyLabel: Record<Room['difficulty'], string> = {
    EASY: 'Лёгкий',
    MEDIUM: 'Средний',
    HARD: 'Сложный',
};

const statusLabel: Record<Room['status'], string> = {
    WAITING: 'Ожидание',
    IN_GAME: 'В игре',
    FINISHED: 'Завершена',
};

export const RoomPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, accessToken } = useAuthContext();

    const [room, setRoom] = useState<Room | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('Подключение...');

    const isCreator = useMemo(() => {
        return room?.createdBy.id === user?.id;
    }, [room, user?.id]);

    const isParticipant = useMemo(() => {
        return room?.participants.some(
            (participant) => participant.user.id === user?.id,
        );
    }, [room, user?.id]);

    const canJoin = useMemo(() => {
        if (!room) {
            return false;
        }

        return (
            room.status === 'WAITING' &&
            room.participants.length < 2 &&
            !isParticipant
        );
    }, [room, isParticipant]);

    const loadRoom = async () => {
        if (!id) {
            return;
        }

        try {
            setError('');
            setIsLoading(true);
            const data = await RoomsService.getRoom(id);
            setRoom(data);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Не удалось загрузить комнату',
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadRoom();
    }, [id]);

    useEffect(() => {
        if (!id || !accessToken) {
            return;
        }

        const socket = socketService.connect(accessToken);

        const handleConnect = () => {
            console.log('[room] socket connected');
            setConnectionStatus('Соединение установлено');
            socketService.joinGameRoom(id);
        };

        const handleDisconnect = () => {
            console.log('[room] socket disconnected');
            setConnectionStatus('Соединение потеряно');
        };

        const handleConnectError = (connectError: Error) => {
            console.log('[room] socket connect_error', connectError);
            setConnectionStatus('Ошибка подключения');
            setError(
                connectError.message || 'Не удалось подключиться к игровому серверу',
            );
        };

        const handleRoomUpdated = (updatedRoom: Room) => {
            console.log('[room] room:updated', updatedRoom);

            if (updatedRoom.id !== id) {
                return;
            }

            setRoom(updatedRoom);
        };

        const handleGameStarted = () => {
            console.log('[room] game:started');
            navigate(`/game/${id}`);
        };

        socketService.onConnect(handleConnect);
        socketService.onDisconnect(handleDisconnect);
        socketService.onConnectError(handleConnectError);
        socketService.onRoomUpdated(handleRoomUpdated);
        socketService.onGameStarted(handleGameStarted);

        if (socket.connected) {
            handleConnect();
        }

        return () => {
            socketService.offConnect(handleConnect);
            socketService.offDisconnect(handleDisconnect);
            socketService.offConnectError(handleConnectError);
            socketService.offRoomUpdated(handleRoomUpdated);
            socketService.offGameStarted(handleGameStarted);
        };
    }, [id, accessToken, navigate]);

    useEffect(() => {
        if (room?.status === 'IN_GAME') {
            navigate(`/game/${room.id}`);
        }
    }, [room, navigate]);

    const handleJoin = async () => {
        if (!id) {
            return;
        }

        try {
            setError('');
            setIsProcessing(true);
            const updatedRoom = await RoomsService.joinRoom(id);
            setRoom(updatedRoom);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось войти в комнату');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleLeave = async () => {
        if (!id) {
            return;
        }

        try {
            setError('');
            setIsProcessing(true);
            await RoomsService.leaveRoom(id);
            navigate('/lobby');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось покинуть комнату');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!id) {
            return;
        }

        try {
            setError('');
            setIsProcessing(true);
            await RoomsService.deleteRoom(id);
            navigate('/lobby');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось удалить комнату');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRefresh = async () => {
        await loadRoom();
    };

    if (isLoading) {
        return <div style={{ padding: 24 }}>Загрузка комнаты...</div>;
    }

    if (!room) {
        return (
            <div style={{ padding: 24 }}>
                <h1>Комната не найдена</h1>
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <div
                style={{
                    maxWidth: 1000,
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                }}
            >
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        padding: 24,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
                    }}
                >
                    <h1 style={{ fontSize: 28, marginBottom: 8 }}>
                        Комната {room.code}
                    </h1>

                    <div style={{ color: '#6b7280', display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span>Сложность: {difficultyLabel[room.difficulty]}</span>
                        <span>Статус: {statusLabel[room.status]}</span>
                        <span>Создатель: {room.createdBy.displayName}</span>
                        <span>Socket: {connectionStatus}</span>
                    </div>
                </div>

                {error ? (
                    <div
                        style={{
                            padding: 12,
                            borderRadius: 8,
                            background: '#fef2f2',
                            color: '#b91c1c',
                            fontSize: 14,
                        }}
                    >
                        {error}
                    </div>
                ) : null}

                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        padding: 24,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
                    }}
                >
                    <h2 style={{ fontSize: 22, marginBottom: 16 }}>Игроки</h2>

                    <div style={{ display: 'grid', gap: 12 }}>
                        {room.participants.map((participant, index) => (
                            <div
                                key={participant.user.id}
                                style={{
                                    padding: 16,
                                    borderRadius: 12,
                                    background: '#f9fafb',
                                    border: '1px solid #e5e7eb',
                                }}
                            >
                                <div style={{ fontWeight: 600 }}>
                                    Игрок {index + 1}: {participant.user.displayName}
                                    {participant.user.id === user?.id ? ' (Вы)' : ''}
                                </div>
                                <div style={{ color: '#6b7280', fontSize: 14 }}>
                                    Логин: {participant.user.login}
                                </div>
                            </div>
                        ))}

                        {room.participants.length < 2 && (
                            <div
                                style={{
                                    padding: 16,
                                    borderRadius: 12,
                                    background: '#f9fafb',
                                    border: '1px dashed #cbd5e1',
                                    color: '#6b7280',
                                }}
                            >
                                Ожидаем второго игрока...
                            </div>
                        )}
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: 12,
                        flexWrap: 'wrap',
                    }}
                >
                    <Button type="button" onClick={() => void handleRefresh()} disabled={isProcessing}>
                        Обновить
                    </Button>

                    {canJoin && (
                        <Button type="button" onClick={() => void handleJoin()} disabled={isProcessing}>
                            {isProcessing ? 'Подключаем...' : 'Присоединиться'}
                        </Button>
                    )}

                    {isParticipant && room.status === 'WAITING' && (
                        <Button type="button" onClick={() => void handleLeave()} disabled={isProcessing}>
                            {isProcessing ? 'Выходим...' : 'Покинуть комнату'}
                        </Button>
                    )}

                    {isCreator && room.status === 'WAITING' && (
                        <Button type="button" onClick={() => void handleDelete()} disabled={isProcessing}>
                            {isProcessing ? 'Удаляем...' : 'Удалить комнату'}
                        </Button>
                    )}

                    {room.status === 'IN_GAME' && (
                        <Button type="button" onClick={() => navigate(`/game/${room.id}`)}>
                            Перейти к игре
                        </Button>
                    )}

                    <Button type="button" onClick={() => navigate('/lobby')}>
                        Назад в лобби
                    </Button>
                </div>
            </div>
        </div>
    );
};