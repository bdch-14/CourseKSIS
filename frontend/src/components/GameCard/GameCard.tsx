import type { GameCard as GameCardType } from '../../types/game.types';

interface GameCardProps {
    card: GameCardType;
    index: number;
    disabled: boolean;
    onClick: (index: number) => void;
}

export const GameCard = ({ card, index, disabled, onClick }: GameCardProps) => {
    const isVisible = card.isFaceUp || card.isMatched;

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onClick(index)}
            style={{
                aspectRatio: '1 / 1',
                border: card.isMatched ? '2px solid #22c55e' : '1px solid #d1d5db',
                borderRadius: 16,
                background: isVisible ? '#ffffff' : '#2563eb',
                color: isVisible ? '#111827' : '#ffffff',
                fontSize: 28,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 18px rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease',
            }}
        >
            {isVisible ? card.value : '?'}
        </button>
    );
};