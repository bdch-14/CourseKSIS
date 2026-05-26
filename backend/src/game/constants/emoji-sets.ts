import { Difficulty } from '@prisma/client';

export const EMOJI_SETS: Record<Difficulty, string[]> = {
    EASY: ['🐶', '🐱', '🦊', '🐻', '🐼', '🐸'],
    MEDIUM: ['🍎', '🍌', '🍇', '🍉', '🍒', '🥝', '🍍', '🍑', '🍋', '🥥'],
    HARD: ['⚽', '🏀', '🏈', '🎾', '🏐', '🎲', '🎯', '🎸', '🎹', '🎮', '🚗', '✈️', '🚀', '🚲', '⛵'],
};