import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    children: React.ReactNode;
};

export const Button = ({ children, disabled, ...props }: ButtonProps) => {
    return (
        <button
            {...props}
            disabled={disabled}
            style={{
                border: 'none',
                borderRadius: 8,
                padding: '12px 16px',
                background: disabled ? '#9ca3af' : '#2563eb',
                color: '#ffffff',
                fontSize: 16,
                fontWeight: 600,
            }}
        >
            {children}
        </button>
    );
};