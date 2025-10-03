
export interface Flashcard {
    word: string;
    icon?: string;
    description?: string;
    arabicMeaning: string;
}

export type AppMode = 'memorize' | 'search' | 'quiz' | 'games';

export interface NotificationMessage {
    message: string;
    isError: boolean;
    key: number;
}
