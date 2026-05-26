import { useEffect, useState } from 'react';
import { ProfileService } from '../../services/profile.service';
import type { UserProfileResponse } from '../../types/profile.types';

const resultLabel: Record<'WIN' | 'LOSE' | 'DRAW', string> = {
    WIN: 'Победа',
    LOSE: 'Поражение',
    DRAW: 'Ничья',
};

const difficultyLabel: Record<'EASY' | 'MEDIUM' | 'HARD', string> = {
    EASY: 'Лёгкий',
    MEDIUM: 'Средний',
    HARD: 'Сложный',
};

export const ProfilePage = () => {
    const [profile, setProfile] = useState<UserProfileResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setError('');
                setIsLoading(true);
                const data = await ProfileService.getMyProfile();
                setProfile(data);
                setDisplayName(data.user.displayName);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Не удалось загрузить профиль');
            } finally {
                setIsLoading(false);
            }
        };

        void loadProfile();
    }, []);

    const handleStartEditName = () => {
        if (!profile) return;
        setSaveError('');
        setSaveSuccess('');
        setDisplayName(profile.user.displayName);
        setIsEditingName(true);
    };

    const handleCancelEditName = () => {
        if (!profile) return;
        setDisplayName(profile.user.displayName);
        setSaveError('');
        setSaveSuccess('');
        setIsEditingName(false);
    };

    const handleSaveName = async (e: React.FormEvent) => {
        e.preventDefault();

        const trimmedName = displayName.trim();

        if (!trimmedName) {
            setSaveError('Имя не может быть пустым');
            return;
        }

        if (trimmedName.length < 2) {
            setSaveError('Имя должно содержать минимум 2 символа');
            return;
        }

        if (!profile) {
            return;
        }

        try {
            setIsSaving(true);
            setSaveError('');
            setSaveSuccess('');

            const updatedUser = await ProfileService.updateMyProfile({
                displayName: trimmedName,
            });

            setProfile((prev) => {
                if (!prev) return prev;

                return {
                    ...prev,
                    user: {
                        ...prev.user,
                        displayName: updatedUser.displayName,
                    },
                };
            });

            setDisplayName(updatedUser.displayName);
            setIsEditingName(false);
            setSaveSuccess('Имя успешно обновлено');
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : 'Не удалось обновить имя');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div style={{ padding: 24 }}>Загрузка профиля...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: 24 }}>
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
            </div>
        );
    }

    if (!profile) {
        return <div style={{ padding: 24 }}>Профиль не найден.</div>;
    }

    return (
        <div style={{ padding: 24 }}>
            <div
                style={{
                    maxWidth: 1100,
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
                    <h1 style={{ fontSize: 28, marginBottom: 16 }}>Профиль игрока</h1>

                    <form onSubmit={handleSaveName}>
                        <div
                            style={{
                                display: 'grid',
                                gap: 12,
                                color: '#6b7280',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                }}
                            >
                                <span style={{ color: '#111827', fontWeight: 600 }}>Имя</span>

                                {isEditingName ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 10,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) => setDisplayName(e.target.value)}
                                            placeholder="Введите имя"
                                            disabled={isSaving}
                                            style={{
                                                minWidth: 260,
                                                flex: '1 1 260px',
                                                padding: '12px 14px',
                                                borderRadius: 10,
                                                border: '1px solid #d1d5db',
                                                outline: 'none',
                                                fontSize: 16,
                                                color: '#111827',
                                            }}
                                        />

                                        <button
                                            key="confirm-button"
                                            type="submit"
                                            disabled={isSaving}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: 10,
                                                border: 'none',
                                                background: '#2563eb',
                                                color: '#ffffff',
                                                fontWeight: 600,
                                                cursor: isSaving ? 'default' : 'pointer',
                                                opacity: isSaving ? 0.7 : 1,
                                            }}
                                        >
                                            {isSaving ? 'Сохранение...' : 'Подтвердить'}
                                        </button>

                                        <button
                                            key="cancel-button"
                                            type="button"
                                            onClick={handleCancelEditName}
                                            disabled={isSaving}
                                            style={{
                                                padding: '12px 16px',
                                                borderRadius: 10,
                                                border: '1px solid #d1d5db',
                                                background: '#ffffff',
                                                color: '#111827',
                                                fontWeight: 600,
                                                cursor: isSaving ? 'default' : 'pointer',
                                                opacity: isSaving ? 0.7 : 1,
                                            }}
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: 10,
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span style={{ color: '#6b7280' }}>{profile.user.displayName}</span>

                                        <button
                                            key="edit-button"
                                            type="button"
                                            onClick={handleStartEditName}
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: 10,
                                                border: '1px solid #d1d5db',
                                                background: '#ffffff',
                                                color: '#111827',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Редактировать
                                        </button>
                                    </div>
                                )}
                            </div>

                            {saveError && (
                                <div
                                    style={{
                                        padding: 12,
                                        borderRadius: 8,
                                        background: '#fef2f2',
                                        color: '#b91c1c',
                                    }}
                                >
                                    {saveError}
                                </div>
                            )}

                            {saveSuccess && (
                                <div
                                    style={{
                                        padding: 12,
                                        borderRadius: 8,
                                        background: '#ecfdf5',
                                        color: '#047857',
                                    }}
                                >
                                    {saveSuccess}
                                </div>
                            )}

                            <span>Логин: {profile.user.login}</span>
                            <span>Email: {profile.user.email}</span>
                            <span>
                                Дата регистрации: {new Date(profile.user.createdAt).toLocaleString()}
                            </span>
                        </div>
                    </form>
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                        gap: 16,
                    }}
                >
                    <StatCard label="Всего игр" value={profile.stats.totalGames} />
                    <StatCard label="Побед" value={profile.stats.wins} />
                    <StatCard label="Поражений" value={profile.stats.losses} />
                    <StatCard label="Ничьих" value={profile.stats.draws} />
                    <StatCard label="Winrate" value={`${profile.stats.winRate}%`} />
                </div>

                <div
                    style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        padding: 24,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
                    }}
                >
                    <h2 style={{ fontSize: 22, marginBottom: 16 }}>История матчей</h2>

                    {profile.history.length === 0 ? (
                        <div style={{ color: '#6b7280' }}>Сыгранных матчей пока нет.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table>
                                <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ padding: '12px 8px' }}>Дата</th>
                                    <th style={{ padding: '12px 8px' }}>Соперник</th>
                                    <th style={{ padding: '12px 8px' }}>Сложность</th>
                                    <th style={{ padding: '12px 8px' }}>Счёт</th>
                                    <th style={{ padding: '12px 8px' }}>Результат</th>
                                    <th style={{ padding: '12px 8px' }}>Длительность</th>
                                </tr>
                                </thead>
                                <tbody>
                                {profile.history.map((match) => (
                                    <tr key={match.matchId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '12px 8px' }}>
                                            {new Date(match.date).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '12px 8px' }}>
                                            {match.opponent?.displayName ?? '—'}
                                        </td>
                                        <td style={{ padding: '12px 8px' }}>
                                            {difficultyLabel[match.difficulty]}
                                        </td>
                                        <td style={{ padding: '12px 8px' }}>
                                            {match.score}:{match.opponentScore}
                                        </td>
                                        <td style={{ padding: '12px 8px' }}>
                                            {resultLabel[match.result]}
                                        </td>
                                        <td style={{ padding: '12px 8px' }}>
                                            {match.durationSeconds ?? 0} сек.
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value }: { label: string; value: string | number }) => {
    return (
        <div
            style={{
                background: '#ffffff',
                borderRadius: 16,
                padding: 20,
                boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
            }}
        >
            <div style={{ color: '#6b7280', fontSize: 14, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
        </div>
    );
};