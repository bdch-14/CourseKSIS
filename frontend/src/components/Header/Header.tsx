import { Link } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

export const Header = () => {
    const { isAuthenticated, user, logout } = useAuthContext();

    return (
        <header
            style={{
                background: '#ffffff',
                borderBottom: '5px solid #e5e7eb',
                padding: '16px 24px',
                position: 'sticky',
                top: 0,
                zIndex: 20,
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
                <Link
                    to="/"
                    style={{
                        fontWeight: 800,
                        fontSize: 22,
                        color: '#111827',
                        textDecoration: 'none',
                        letterSpacing: '-0.02em',
                    }}
                >
                    Find Pair
                </Link>

                {isAuthenticated && (
                    <nav
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            flexWrap: 'wrap',
                        }}
                    >
                        <Link
                            to="/lobby"
                            style={{
                                textDecoration: 'none',
                                color: '#4b5563',
                                fontWeight: 500,
                                padding: '8px 12px',
                                borderRadius: 10,
                                transition: '0.2s',
                            }}
                        >
                            Лобби
                        </Link>

                        <Link
                            to="/profile"
                            style={{
                                textDecoration: 'none',
                                color: '#4b5563',
                                fontWeight: 500,
                                padding: '8px 12px',
                                borderRadius: 10,
                                transition: '0.2s',
                            }}
                        >
                            Профиль
                        </Link>

                        <span
                            style={{
                                padding: '8px 12px',
                                borderRadius: 10,
                                background: '#f3f4f6',
                                color: '#111827',
                                fontWeight: 600,
                            }}
                        >
                            {user?.displayName}
                        </span>

                        <button
                            type="button"
                            onClick={() => void logout()}
                            style={{
                                border: 'none',
                                padding: '10px 14px',
                                borderRadius: 10,
                                background: '#2563eb',
                                color: '#ffffff',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 6px 16px rgba(37, 99, 235, 0.22)',
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