import { Link } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

export const Header = () => {
    const { isAuthenticated, user, logout } = useAuthContext();

    return (
        <header
            style={{
                background: '#111827',
                color: '#fff',
                padding: '16px 24px',
            }}
        >
            <div
                style={{
                    maxWidth: 1200,
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                }}
            >
                <Link to="/" style={{ fontWeight: 700, fontSize: 20 }}>
                    Find Pair
                </Link>

                {isAuthenticated && (
                    <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Link to="/lobby">Лобби</Link>
                        <Link to="/profile">Профиль</Link>
                        <span>{user?.displayName}</span>
                        <button
                            type="button"
                            onClick={() => void logout()}
                            style={{
                                border: 'none',
                                padding: '8px 12px',
                                borderRadius: 8,
                                background: '#ef4444',
                                color: '#fff',
                            }}
                        >
                            Выйти
                        </button>
                    </nav>
                )}
            </div>
        </header>
    );
};