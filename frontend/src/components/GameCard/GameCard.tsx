import type { GameCard as GameCardType } from '../../types/game.types';

interface GameCardProps {
    card: GameCardType;
    index: number;
    disabled: boolean;
    onClick: (index: number) => void;
}

export const GameCard = ({ card, index, disabled, onClick }: GameCardProps) => {
    const isVisible = card.isFaceUp || card.isMatched;

    const getBackground = () => {
        if (card.isMatched) return '#ecfdf5';
        if (isVisible) return '#ffffff';
        return '#3b82f6';
    };

    const getBorder = () => {
        if (card.isMatched) return '1px solid #86efac';
        if (isVisible) return '1px solid #e5e7eb';
        return '1px solid #2563eb';
    };

    const getColor = () => {
        if (card.isMatched) return '#166534';
        if (isVisible) return '#111827';
        return '#ffffff';
    };

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onClick(index)}
            style={{
                aspectRatio: '1 / 1',
                border: getBorder(),
                borderRadius: 18,
                background: getBackground(),
                color: getColor(),
                fontSize: 30,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: disabled ? 'default' : 'pointer',
                boxShadow: isVisible
                    ? '0 10px 24px rgba(15, 23, 42, 0.08)'
                    : '0 12px 24px rgba(37, 99, 235, 0.18)',
                transition: 'all 0.2s ease',
                transform: isVisible ? 'rotateY(180deg)' : 'rotateY(0deg)',
                opacity: disabled && !isVisible ? 0.85 : 1,
                userSelect: 'none',
            }}
        >
            <span
                style={{
                    transform: isVisible ? 'rotateY(180deg)' : 'none',
                }}
            >
                {isVisible ? card.value : '?'}
            </span>
        </button>
    );
};