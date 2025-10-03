import React, { useState, useCallback, useEffect } from 'react';
import type { Flashcard, AppMode, NotificationMessage } from './types';
import { FileLoader } from './components/FileLoader';
import { MemorizeView } from './components/MemorizeView';
import { SearchView } from './components/SearchView';
import { QuizView } from './components/QuizView';
import { GamesView } from './components/GamesView';
import { Notification } from './components/Notification';
import { BookOpenIcon, GamepadIcon, QuizIcon, SearchIcon } from './components/icons';

const Header: React.FC = () => (
    <header className="text-center mb-5 bg-[#4b1cf9] p-5 rounded-2xl text-white shadow-lg">
        <h1 className="text-4xl font-bold mb-2">Interactive English Flashcards</h1>
        <p className="text-lg opacity-90">Developed by Dr. Mazen Badawy – Doctorate of English Teaching and Testing</p>
    </header>
);

const ModeSelector: React.FC<{ activeMode: AppMode; onModeChange: (mode: AppMode) => void; disabled: boolean }> = ({ activeMode, onModeChange, disabled }) => {
    const modes: { id: AppMode, label: string, icon: React.ReactNode }[] = [
        { id: 'memorize', label: 'Memorize', icon: <BookOpenIcon /> },
        { id: 'search', label: 'Search', icon: <SearchIcon /> },
        { id: 'quiz', label: 'Quiz', icon: <QuizIcon /> },
        { id: 'games', label: 'Games', icon: <GamepadIcon /> },
    ];

    const getModeButtonClass = (mode: AppMode) =>
        `flex-1 p-3 rounded-full border-none font-bold cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 text-lg ${
            activeMode === mode
                ? 'bg-[#4b1cf9] text-white shadow-md'
                : 'bg-transparent text-[#4b1cf9]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#4b1cf9]/20'}`;

    return (
        <div className="bg-white p-2.5 rounded-full mb-5 flex gap-2.5 shadow-md">
            {modes.map(mode => (
                <button
                    key={mode.id}
                    className={getModeButtonClass(mode.id)}
                    onClick={() => !disabled && onModeChange(mode.id)}
                    disabled={disabled}
                >
                    {mode.icon}
                    <span>{mode.label}</span>
                </button>
            ))}
        </div>
    );
};


export default function App() {
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentMode, setCurrentMode] = useState<AppMode>('memorize');
    const [notification, setNotification] = useState<NotificationMessage | null>(null);

    // FIX: Removed unused 'duration' parameter.
    const showNotification = useCallback((message: string, isError = false) => {
        setNotification({ message, isError, key: Date.now() });
    }, []);
    
    const handleCardsLoaded = (cards: Flashcard[]) => {
        setFlashcards(cards);
        if (cards.length > 0) {
            showNotification(`✅ Loaded ${cards.length} cards successfully!`);
        }
    };
    
    const renderCurrentView = () => {
        if (flashcards.length === 0) return null;
        
        switch (currentMode) {
            case 'memorize':
                return <MemorizeView cards={flashcards} setCards={setFlashcards} showNotification={showNotification} />;
            case 'search':
                return <SearchView cards={flashcards} />;
            case 'quiz':
                return <QuizView cards={flashcards} showNotification={showNotification}/>;
            case 'games':
                return <GamesView cards={flashcards} showNotification={showNotification}/>;
            default:
                return null;
        }
    }

    return (
        <div className="container mx-auto p-5 max-w-4xl">
            <Header />

            <section className="bg-white p-6 rounded-2xl mb-5 shadow-md text-center">
                <FileLoader onCardsLoaded={handleCardsLoaded} showNotification={showNotification} />
            </section>
            
            {flashcards.length > 0 && (
                 <ModeSelector activeMode={currentMode} onModeChange={setCurrentMode} disabled={false} />
            )}
           
            <main>
                {renderCurrentView()}
            </main>

            <Notification notification={notification} onClear={() => setNotification(null)} />
        </div>
    );
}