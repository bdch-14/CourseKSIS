import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { useAuthContext } from '../../context/AuthContext';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuthContext();

    const [form, setForm] = useState({
        login: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange =
        (field: 'login' | 'password') =>
            (event: React.ChangeEvent<HTMLInputElement>) => {
                setForm((prev) => ({
                    ...prev,
                    [field]: event.target.value,
                }));
            };

    const validate = () => {
        if (!form.login.trim()) {
            return 'Введите логин';
        }

        if (!form.password.trim()) {
            return 'Введите пароль';
        }

        return '';
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const validationError = validate();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setError('');
            setIsSubmitting(true);
            await login({
                login: form.login.trim(),
                password: form.password,
            });
            navigate('/lobby');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Не удалось выполнить вход');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 72px)', display: 'grid', placeItems: 'center', padding: 24 }}>
            <div
                style={{
                    width: '100%',
                    maxWidth: 420,
                    background: '#ffffff',
                    borderRadius: 16,
                    padding: 24,
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                }}
            >
                <h1 style={{ marginBottom: 8, fontSize: 28 }}>Вход</h1>
                <p style={{ marginBottom: 20, color: '#6b7280' }}>
                    Войдите в аккаунт, чтобы попасть в лобби игры.
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Input
                        id="login"
                        label="Логин"
                        placeholder="Введите логин"
                        value={form.login}
                        onChange={handleChange('login')}
                    />

                    <Input
                        id="password"
                        label="Пароль"
                        type="password"
                        placeholder="Введите пароль"
                        value={form.password}
                        onChange={handleChange('password')}
                    />

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

                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Входим...' : 'Войти'}
                    </Button>
                </form>

                <p style={{ marginTop: 16, fontSize: 14, color: '#6b7280' }}>
                    Нет аккаунта? <Link to="/register" style={{ color: '#2563eb' }}>Зарегистрироваться</Link>
                </p>
            </div>
        </div>
    );
};