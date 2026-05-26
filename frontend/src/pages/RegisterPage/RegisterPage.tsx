import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { useAuthContext } from '../../context/AuthContext';

export const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuthContext();

    const [form, setForm] = useState({
        login: '',
        email: '',
        displayName: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange =
        (
            field: 'login' | 'email' | 'displayName' | 'password' | 'confirmPassword',
        ) =>
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

        if (!form.email.trim()) {
            return 'Введите email';
        }

        if (!form.displayName.trim()) {
            return 'Введите отображаемое имя';
        }

        if (!form.password.trim()) {
            return 'Введите пароль';
        }

        if (form.password.length < 8) {
            return 'Пароль должен быть не короче 8 символов';
        }

        if (form.password !== form.confirmPassword) {
            return 'Пароли не совпадают';
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

            await register({
                login: form.login.trim(),
                email: form.email.trim(),
                displayName: form.displayName.trim(),
                password: form.password,
            });

            navigate('/lobby');
        } catch (err) {
            setError(
                err instanceof Error ? err.message : 'Не удалось выполнить регистрацию',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: 'calc(100vh - 72px)', display: 'grid', placeItems: 'center', padding: 24 }}>
            <div
                style={{
                    width: '100%',
                    maxWidth: 460,
                    background: '#ffffff',
                    borderRadius: 16,
                    padding: 24,
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                }}
            >
                <h1 style={{ marginBottom: 8, fontSize: 28 }}>Регистрация</h1>
                <p style={{ marginBottom: 20, color: '#6b7280' }}>
                    Создайте аккаунт, чтобы играть в «Найди пару».
                </p>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Input
                        id="register-login"
                        label="Логин"
                        placeholder="Введите логин"
                        value={form.login}
                        onChange={handleChange('login')}
                    />

                    <Input
                        id="register-email"
                        label="Email"
                        type="email"
                        placeholder="Введите email"
                        value={form.email}
                        onChange={handleChange('email')}
                    />

                    <Input
                        id="register-display-name"
                        label="Отображаемое имя"
                        placeholder="Введите имя"
                        value={form.displayName}
                        onChange={handleChange('displayName')}
                    />

                    <Input
                        id="register-password"
                        label="Пароль"
                        type="password"
                        placeholder="Введите пароль"
                        value={form.password}
                        onChange={handleChange('password')}
                    />

                    <Input
                        id="register-confirm-password"
                        label="Повторите пароль"
                        type="password"
                        placeholder="Повторите пароль"
                        value={form.confirmPassword}
                        onChange={handleChange('confirmPassword')}
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
                        {isSubmitting ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
                    </Button>
                </form>

                <p style={{ marginTop: 16, fontSize: 14, color: '#6b7280' }}>
                    Уже есть аккаунт? <Link to="/login" style={{ color: '#2563eb' }}>Войти</Link>
                </p>
            </div>
        </div>
    );
};