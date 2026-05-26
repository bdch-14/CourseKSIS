import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { GameCard } from '../../components/GameCard/GameCard';
import { useAuthContext } from '../../context/AuthContext';
import { socketService } from '../../services/socket.service';
import type {
    GameFinishedPayload,
    GameState,
    GameUpdatePayload,
} from '../../types/game.types';

const difficultyLabel: Record<GameState['difficulty'], string> = {
    EASY: 'Лёгкий',
    MEDIUM: 'Средний',
    HARD: 'Сложный',
};

export const GamePage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, accessToken } = useAuthContext();

    const [gameState, setGameState] = useState<GameState | null>(null);
    const [connectionStatus, setConnectionStatus] = useState('Подключение...');
    const [resultModal, setResultModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
    } | null>(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const currentPlayer = useMemo(() => {
        return gameState?.players.find((player) => player.userId === user?.id) ?? null;
    }, [gameState, user?.id]);

    const isMyTurn = gameState?.currentTurnUserId === user?.id;
    const openedCardsCount = gameState?.openedCardIndexes.length ?? 0;

    const handleConnectError = useCallback((connectError: Error) => {
        setConnectionStatus('Ошибка подключения');
        setError(connectError.message || 'Не удалось подключиться к игровому серверу');
    }, []);

    const handleGameFinished = useCallback(
        (payload: GameFinishedPayload) => {
            if (!user) {
                return;
            }

            if (payload.reason === 'PLAYER_DISCONNECTED') {
                if (payload.winnerUserId === user.id) {
                    setResultModal({
                        isOpen: true,
                        title: 'Вы выиграли',
                        description: 'Противник отключился. Победа засчитана вам.',
                    });
                    setMessage('Матч завершён: соперник отключился.');
                    return;
                }

                if (payload.disconnectedUserId === user.id) {
                    setResultModal({
                        isOpen: true,
                        title: 'Вы проиграли',
                        description: 'Соединение было прервано. Матч завершён.',
                    });
                    setMessage('Матч завершён из-за разрыва соединения.');
                    return;
                }

                setResultModal({
                    isOpen: true,
                    title: 'Игра завершена',
                    description: 'Один из игроков отключился.',
                });
                setMessage('Матч завершён из-за отключения игрока.');
                return;
            }

            if (payload.winnerUserId === null) {
                setResultModal({
                    isOpen: true,
                    title: 'Ничья',
                    description: 'Игра завершилась вничью.',
                });
                setMessage('Игра завершена.');
                return;
            }

            if (payload.winnerUserId === user.id) {
                setResultModal({
                    isOpen: true,
                    title: 'Вы выиграли',
                    description: 'Поздравляем! Вы победили в матче.',
                });
                setMessage('Игра завершена.');
                return;
            }

            setResultModal({
                isOpen: true,
                title: 'Вы проиграли',
                description: 'В этот раз победил соперник.',
            });
            setMessage('Игра завершена.');
        },
        [user],
    );

    useEffect(() => {
        if (!id || !accessToken) {
            return;
        }

        const socket = socketService.connect(accessToken);

        const handleConnect = () => {
            setConnectionStatus('Соединение установлено');
            socketService.joinGameRoom(id);
        };

        const handleDisconnect = () => {
            setConnectionStatus('Соединение потеряно');
        };

        const handleStarted = (payload: GameState) => {
            setGameState(payload);
            setError('');
            setMessage('Игра началась');
        };

        const handleUpdate = (payload: GameUpdatePayload) => {
            setGameState(payload.state);

            if (payload.type === 'FIRST_CARD_OPENED') {
                setMessage('Выберите вторую карточку');
            }

            if (payload.type === 'MATCH_SUCCESS') {
                setMessage('Пара найдена. Вы ходите снова.');
            }

            if (payload.type === 'MATCH_FAIL') {
                setMessage('Карты не совпали. Ход переходит сопернику.');
            }

            if (payload.type === 'CARDS_HIDDEN') {
                setMessage('Карточки снова закрыты.');
            }

            if (payload.type === 'GAME_FINISHED') {
                setMessage('Игра завершена.');
            }
        };

        const handleFinished = (payload: GameFinishedPayload) => {
            handleGameFinished(payload);
        };

        socketService.onConnectError(handleConnectError);
        socketService.onConnect(handleConnect);
        socketService.onDisconnect(handleDisconnect);
        socketService.onGameStarted(handleStarted);
        socketService.onGameUpdate(handleUpdate);
        socketService.onGameFinished(handleFinished);

        if (socket.connected) {
            handleConnect();
        }

        return () => {
            socketService.offConnect(handleConnect);
            socketService.offDisconnect(handleDisconnect);
            socketService.offGameStarted(handleStarted);
            socketService.offConnectError(handleConnectError);
            socketService.offGameUpdate(handleUpdate);
            socketService.offGameFinished(handleFinished);
            socketService.disconnect();
        };
    }, [id, accessToken, handleConnectError, handleGameFinished]);

    const handleCardClick = (cardIndex: number) => {
        if (!id || !gameState) {
            return;
        }

        if (!isMyTurn) {
            setError('Сейчас не ваш ход');
            return;
        }

        if (openedCardsCount >= 2) {
            return;
        }

        if (gameState.board[cardIndex].isMatched || gameState.board[cardIndex].isFaceUp) {
            return;
        }

        setError('');
        socketService.flipCard(id, cardIndex);
    };

    const handleBackToLobby = () => {
        setResultModal(null);
        navigate('/lobby');
    };

    const modalAccentColor =
        resultModal?.title === 'Вы выиграли'
            ? '#16a34a'
            : resultModal?.title === 'Вы проиграли'
                ? '#dc2626'
                : '#475569';

    if (!id) {
        return <div style={{ padding: 24 }}>Идентификатор комнаты не найден.</div>;
    }

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
                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        padding: 24,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
                    }}
                >
                    <h1 style={{ fontSize: 28, marginBottom: 8 }}>Игра</h1>
                    <div
                        style={{
                            color: '#6b7280',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                        }}
                    >
                        <span>Статус соединения: {connectionStatus}</span>
                        <span>
              Сложность: {gameState ? difficultyLabel[gameState.difficulty] : 'Загрузка...'}
            </span>
                        <span>Ваш ход: {isMyTurn ? 'Да' : 'Нет'}</span>
                    </div>
                </div>

                {message ? (
                    <div
                        style={{
                            padding: 12,
                            borderRadius: 8,
                            background: '#eff6ff',
                            color: '#1d4ed8',
                        }}
                    >
                        {message}
                    </div>
                ) : null}

                {error ? (
                    <div
                        style={{
                            padding: 12,
                            borderRadius: 8,
                            background: '#fef2f2',
                            color: '#b91c1c',
                        }}
                    >
                        {error}
                    </div>
                ) : null}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(260px, 320px) 1fr',
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
                        <h2 style={{ fontSize: 22, marginBottom: 16 }}>Игроки</h2>

                        {gameState ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {gameState.players.map((player) => {
                                    const isCurrentTurn = player.userId === gameState.currentTurnUserId;
                                    const isMe = player.userId === user?.id;

                                    return (
                                        <div
                                            key={player.userId}
                                            style={{
                                                padding: 16,
                                                borderRadius: 12,
                                                background: isCurrentTurn ? '#eff6ff' : '#f9fafb',
                                                border: isCurrentTurn
                                                    ? '1px solid #93c5fd'
                                                    : '1px solid #e5e7eb',
                                            }}
                                        >
                                            <div style={{ fontWeight: 700 }}>
                                                {player.displayName} {isMe ? '(Вы)' : ''}
                                            </div>
                                            <div style={{ fontSize: 14, color: '#6b7280' }}>
                                                Логин: {player.login}
                                            </div>
                                            <div style={{ marginTop: 8, fontSize: 16 }}>Очки: {player.score}</div>
                                            {isCurrentTurn && (
                                                <div style={{ marginTop: 8, color: '#2563eb', fontWeight: 600 }}>
                                                    Сейчас ходит
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <div
                                    style={{
                                        marginTop: 8,
                                        padding: 12,
                                        borderRadius: 10,
                                        background: '#f9fafb',
                                        color: '#4b5563',
                                        fontSize: 14,
                                    }}
                                >
                                    Ваш счёт: {currentPlayer?.score ?? 0}
                                </div>
                            </div>
                        ) : (
                            <div>Ожидание старта игры...</div>
                        )}
                    </div>

                    <div
                        style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            padding: 24,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 12,
                                marginBottom: 16,
                            }}
                        >
                            <h2 style={{ fontSize: 22 }}>Игровое поле</h2>
                            <Button type="button" onClick={() => navigate('/lobby')}>
                                В лобби
                            </Button>
                        </div>

                        {!gameState ? (
                            <div>Ожидание данных игры...</div>
                        ) : (
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns:
                                        gameState.difficulty === 'EASY'
                                            ? 'repeat(4, minmax(70px, 1fr))'
                                            : gameState.difficulty === 'MEDIUM'
                                                ? 'repeat(5, minmax(70px, 1fr))'
                                                : 'repeat(6, minmax(70px, 1fr))',
                                    gap: 12,
                                }}
                            >
                                {gameState.board.map((card, index) => (
                                    <GameCard
                                        key={card.id}
                                        card={card}
                                        index={index}
                                        disabled={
                                            !isMyTurn ||
                                            gameState.status === 'FINISHED' ||
                                            openedCardsCount >= 2 ||
                                            card.isMatched ||
                                            card.isFaceUp
                                        }
                                        onClick={handleCardClick}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {resultModal?.isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.55)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            maxWidth: 420,
                            background: '#ffffff',
                            borderRadius: 20,
                            padding: 24,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                            textAlign: 'center',
                        }}
                    >
                        <h2
                            style={{
                                fontSize: 28,
                                marginBottom: 12,
                                color: modalAccentColor,
                            }}
                        >
                            {resultModal.title}
                        </h2>

                        <p style={{ color: '#6b7280', marginBottom: 20 }}>
                            {resultModal.description}
                        </p>

                        <Button type="button" onClick={handleBackToLobby}>
                            Вернуться в лобби
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};