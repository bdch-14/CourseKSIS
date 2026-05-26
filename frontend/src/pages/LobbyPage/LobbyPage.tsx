import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { RoomCard } from '../../components/RoomCard/RoomCard';
import { Select } from '../../components/Select/Select';
import { useAuthContext } from '../../context/AuthContext';
import { RoomsService } from '../../services/rooms.service';
import type { Room } from '../../types/room.types';
import type { Difficulty } from '../../types/shared.types';

const difficultyOptions: { value: Difficulty; label: string }[] = [
    { value: 'EASY', label: 'Лёгкий' },
    { value: 'MEDIUM', label: 'Средний' },
    { value: 'HARD', label: 'Сложный' },
];

export const LobbyPage = () => {
    const navigate = useNavigate();
    const { user } = useAuthContext();

    const [difficulty, setDifficulty] = useState<Difficulty>('EASY');
    const [rooms, setRooms] = useState<Room[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isQuickJoining, setIsQuickJoining] = useState(false);
    const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
    const [error, setError] = useState('');

    const loadRooms = async () => {
        try {
            setError('');
            setIsLoading(true);
            const data = await RoomsService.getRooms({ status: 'WAITING' });
            setRooms(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось загрузить комнаты');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadRooms();
    }, []);

    const handleCreateRoom = async () => {
        try {
            setIsCreating(true);
            setError('');
            const room = await RoomsService.createRoom(difficulty);
            navigate(`/rooms/${room.id}`);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Не удалось создать комнату',
            );
        } finally {
            setIsCreating(false);
        }
    };

    const handleQuickJoin = async () => {
        try {
            setIsQuickJoining(true);
            setError('');
            const room = await RoomsService.quickJoin(difficulty);
            navigate(`/rooms/${room.id}`);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Не удалось найти подходящую комнату',
            );
        } finally {
            setIsQuickJoining(false);
        }
    };

    const handleJoinRoom = async (roomId: string) => {
        try {
            setJoiningRoomId(roomId);
            setError('');
            const room = await RoomsService.joinRoom(roomId);
            navigate(`/rooms/${room.id}`);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Не удалось присоединиться к комнате',
            );
        } finally {
            setJoiningRoomId(null);
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <div
                style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                }}
            >
                <div>
                    <h1 style={{ fontSize: 28, marginBottom: 4 }}>Лобби</h1>
                    <p style={{ color: '#6b7280' }}>
                        Привет, {user?.displayName}! Выберите сложность, создайте комнату или присоединитесь к уже созданной.
                    </p>
                </div>

                <div
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 16,
                        alignItems: 'flex-end',
                    }}
                >
                    <Select
                        id="difficulty"
                        label="Сложность"
                        value={difficulty}
                        onChange={(event) => {
                            setDifficulty(event.target.value as Difficulty);
                        }}
                    >
                        {difficultyOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button type="button" onClick={handleCreateRoom} disabled={isCreating}>
                            {isCreating ? 'Создаём...' : 'Создать комнату'}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleQuickJoin}
                            disabled={isQuickJoining}
                        >
                            {isQuickJoining ? 'Поиск игры...' : 'Быстрая игра'}
                        </Button>
                        <Button type="button" onClick={() => void loadRooms()} disabled={isLoading}>
                            Обновить список
                        </Button>
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

                <div>
                    {isLoading ? (
                        <div>Загрузка комнат...</div>
                    ) : rooms.length === 0 ? (
                        <div style={{ color: '#6b7280' }}>Пока нет доступных комнат.</div>
                    ) : (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                gap: 16,
                            }}
                        >
                            {rooms.map((room) => (
                                <RoomCard
                                    key={room.id}
                                    room={room}
                                    onJoin={handleJoinRoom}
                                    isJoining={joiningRoomId === room.id}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};