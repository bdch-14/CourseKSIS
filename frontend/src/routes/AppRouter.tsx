import { Navigate, Route, Routes } from 'react-router-dom';
import { Header } from '../components/Header/Header';
import { ProtectedRoute } from '../components/ProtectedRoute/ProtectedRoute';
import { useAuthContext } from '../context/AuthContext';
import { GamePage } from '../pages/GamePage/GamePage';
import { LobbyPage } from '../pages/LobbyPage/LobbyPage';
import { LoginPage } from '../pages/LoginPage/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage/NotFoundPage';
import { ProfilePage } from '../pages/ProfilePage/ProfilePage';
import { RegisterPage } from '../pages/RegisterPage/RegisterPage';
import { RoomPage } from '../pages/RoomPage/RoomPage';

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, isLoading } = useAuthContext();

    if (isLoading) {
        return <div style={{ padding: '40px' }}>Загрузка...</div>;
    }

    if (isAuthenticated) {
        return <Navigate to="/lobby" replace />;
    }

    return <>{children}</>;
};

export const AppRouter = () => {
    return (
        <>
            <Header />
            <Routes>
                <Route path="/" element={<Navigate to="/lobby" replace />} />
                <Route
                    path="/login"
                    element={
                        <PublicOnlyRoute>
                            <LoginPage />
                        </PublicOnlyRoute>
                    }
                />
                <Route
                    path="/register"
                    element={
                        <PublicOnlyRoute>
                            <RegisterPage />
                        </PublicOnlyRoute>
                    }
                />
                <Route
                    path="/lobby"
                    element={
                        <ProtectedRoute>
                            <LobbyPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/rooms/:id"
                    element={
                        <ProtectedRoute>
                            <RoomPage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/game/:id"
                    element={
                        <ProtectedRoute>
                            <GamePage />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <ProfilePage />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </>
    );
};