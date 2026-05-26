import { useNavigate } from 'react-router-dom';
import type { Room } from '../../types/room.types';
import { Button } from '../Button/Button';

interface RoomCardProps {
    room: Room;
    onJoin: (roomId: string) => Promise<void>;
    isJoining: boolean;
}

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

export const RoomCard = ({ room, onJoin, isJoining }: RoomCardProps) => {
    const navigate = useNavigate();
    const playersCount = room.participants.length;

    const handleOpen = () => {
        navigate(`/rooms/${room.id}`);
    };

    const handleJoin = async (event: React.MouseEvent) => {
        event.stopPropagation();
        await onJoin(room.id);
    };

    const canJoin = room.status === 'WAITING' && playersCount < 2;

    return (
        <div
            onClick={handleOpen}
            style={{
                borderRadius: 12,
                padding: 16,
                background: '#ffffff',
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                cursor: 'pointer',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    alignItems: 'center',
                }}
            >
                <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>
                        Комната {room.code}
                    </div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>
                        Создатель: {room.createdBy.displayName}
                    </div>
                </div>
                <span
                    style={{
                        fontSize: 13,
                        padding: '4px 8px',
                        borderRadius: 999,
                        background:
                            room.status === 'WAITING'
                                ? '#ecfdf3'
                                : room.status === 'IN_GAME'
                                    ? '#eff6ff'
                                    : '#f9fafb',
                        color:
                            room.status === 'WAITING'
                                ? '#16a34a'
                                : room.status === 'IN_GAME'
                                    ? '#2563eb'
                                    : '#4b5563',
                    }}
                >
          {statusLabel[room.status]}
        </span>
            </div>

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    alignItems: 'center',
                    marginTop: 8,
                }}
            >
                <div style={{ fontSize: 14, color: '#4b5563' }}>
                    Сложность: {difficultyLabel[room.difficulty]}
                    <br />
                    Игроки: {playersCount}/2
                </div>
                <Button
                    type="button"
                    disabled={!canJoin || isJoining}
                    onClick={handleJoin}
                >
                    {isJoining ? 'Подключение...' : 'Присоединиться'}
                </Button>
            </div>
        </div>
    );
};