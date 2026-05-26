import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
};

export const Select = ({ label, id, children, ...props }: SelectProps) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label htmlFor={id} style={{ fontSize: 14, fontWeight: 600 }}>
                {label}
            </label>
            <select
                id={id}
                {...props}
                style={{
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 16,
                }}
            >
                {children}
            </select>
        </div>
    );
};