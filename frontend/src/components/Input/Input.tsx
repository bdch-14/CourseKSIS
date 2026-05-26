import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
};

export const Input = ({ label, error, id, ...props }: InputProps) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor={id} style={{ fontSize: 14, fontWeight: 600 }}>
                {label}
            </label>
            <input
                id={id}
                {...props}
                style={{
                    border: error ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: 8,
                    padding: '12px 14px',
                    fontSize: 16,
                    outline: 'none',
                }}
            />
            {error ? (
                <span style={{ color: '#ef4444', fontSize: 13 }}>{error}</span>
            ) : null}
        </div>
    );
};