// FIX: Changed to a proper ES module import for React and hooks.
import React, { useState, useEffect, useCallback } from 'react';
import type { Flashcard } from '../types.tsx';
import { RestartIcon, ScoreIcon } from './icons.tsx';
import { HangmanDrawing } from './HangmanDrawing.tsx';

type Game = 'menu' | 'matching' | 'hangman' | 'scramble';

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
};

// --- Matching Game ---
// FIX: Corrected the type for the 'showNotification' prop for better type safety.
const MatchingGame: React.FC<{ cards: Flashcard[]; onBack: () => void; showNotification: (message: string, isError?: boolean) => void }> = ({ cards, onBack, showNotification }) => {
    const [gameCards, setGameCards] = useState<{ word: string; meaning: string; id: string }[]>([]);
    const [words, setWords] = useState<{ text: string, id: string }[]>([]);
    const [meanings, setMeanings] = useState<{ text: string, id: string }[]>([]);
    const [selectedWord, setSelectedWord] = useState<{ el: HTMLElement; id: string } | null>(null);
    const [selectedMeaning, setSelectedMeaning] = useState<{ el: HTMLElement; id: string } | null>(null);
    const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
    const [score, setScore] = useState(0);

    const setupGame = useCallback(() => {
        const GAME_SIZE = 8;
        if (cards.length < GAME_SIZE) {
            showNotification(`You need at least ${GAME_SIZE} cards to play.`, true);
            onBack();
            return;
        }
        const shuffled = shuffleArray(cards).slice(0, GAME_SIZE);
        // FIX: Explicitly type 'c' as Flashcard to fix type inference issue.
        const gc = shuffled.map((c: Flashcard) => ({ word: c.word, meaning: c.arabicMeaning, id: c.word }));
        setGameCards(gc);
        setWords(shuffleArray(gc.map(c => ({ text: c.word, id: c.id }))));
        setMeanings(shuffleArray(gc.map(c => ({ text: c.meaning, id: c.id }))));
        setScore(0);
        setMatchedPairs([]);
        setSelectedWord(null);
        setSelectedMeaning(null);
    }, [cards, onBack, showNotification]);

    useEffect(() => {
        setupGame();
    }, [setupGame]);

    useEffect(() => {
        if (selectedWord && selectedMeaning) {
            const board = document.getElementById('matchBoard');
            if (board) board.style.pointerEvents = 'none';

            if (selectedWord.id === selectedMeaning.id) {
                setMatchedPairs(prev => [...prev, selectedWord.id]);
                setScore(s => s + 1);
                // FIX: Removed unused 'duration' argument.
                showNotification('Match found!', false);
                selectedWord.el.classList.add('correct');
                selectedMeaning.el.classList.add('correct');
                setSelectedWord(null);
                setSelectedMeaning(null);
                 if (board) board.style.pointerEvents = 'auto';
            } else {
                selectedWord.el.classList.add('incorrect');
                selectedMeaning.el.classList.add('incorrect');
                setTimeout(() => {
                    selectedWord.el.classList.remove('selected', 'incorrect');
                    selectedMeaning.el.classList.remove('selected', 'incorrect');
                    setSelectedWord(null);
                    setSelectedMeaning(null);
                    if (board) board.style.pointerEvents = 'auto';
                }, 800);
            }
        }
    }, [selectedWord, selectedMeaning, showNotification]);

    useEffect(() => {
        if(gameCards.length > 0 && matchedPairs.length === gameCards.length) {
            // FIX: Removed unused 'duration' argument.
            showNotification('🎉 Congratulations! You found all matches!', false);
        }
    }, [matchedPairs, gameCards.length, showNotification])

    const handleItemClick = (e: React.MouseEvent<HTMLDivElement>, type: 'word' | 'meaning', id: string) => {
        const el = e.currentTarget;
        if (el.classList.contains('correct')) return;
        
        if (type === 'word') {
            if(selectedWord) selectedWord.el.classList.remove('selected');
            el.classList.add('selected');
            setSelectedWord({ el, id });
        } else {
            if(selectedMeaning) selectedMeaning.el.classList.remove('selected');
            el.classList.add('selected');
            setSelectedMeaning({ el, id });
        }
    };
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold flex items-center gap-2"><ScoreIcon /> Score: {score}</span>
                <button onClick={setupGame} className="btn-game bg-[#f44336]"><RestartIcon /> New Game</button>
            </div>
            <div id="matchBoard" className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    {words.map(w => <div key={w.id} onClick={(e) => handleItemClick(e, 'word', w.id)} className="match-item">{w.text}</div>)}
                </div>
                <div className="flex flex-col gap-2">
                    {meanings.map(m => <div key={m.id} onClick={(e) => handleItemClick(e, 'meaning', m.id)} dir="rtl" className="match-item">{m.text}</div>)}
                </div>
            </div>
        </div>
    );
};

// --- Hangman Game ---
// FIX: Corrected the type for the 'showNotification' prop for better type safety.
const HangmanGame: React.FC<{ cards: Flashcard[]; onBack: () => void; showNotification: (message: string, isError?: boolean) => void }> = ({ cards, onBack, showNotification }) => {
    const [wordToGuess, setWordToGuess] = useState<Flashcard | null>(null);
    const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
    const [wrongGuesses, setWrongGuesses] = useState(0);
    const MAX_WRONG = 6;
    
    const setupGame = useCallback(() => {
        const validWords = cards.filter(c => !c.word.includes(' ') && /^[A-Z]+$/i.test(c.word));
        if (validWords.length === 0) {
            showNotification("No single-word cards available for Hangman.", true);
            onBack();
            return;
        }
        setWordToGuess(shuffleArray(validWords)[0]);
        setGuessedLetters(new Set());
        setWrongGuesses(0);
    }, [cards, onBack, showNotification]);

    useEffect(setupGame, [setupGame]);

    const wordLetters = wordToGuess?.word.toUpperCase().split('') || [];
    const isWon = wordLetters.every(letter => guessedLetters.has(letter));
    const isLost = wrongGuesses >= MAX_WRONG;
    const isGameOver = isWon || isLost;

    useEffect(() => {
        // FIX: Removed unused 'duration' argument.
        if(isWon) showNotification(`🎉 You won! The word was ${wordToGuess?.word}.`, false);
        // FIX: Removed unused 'duration' argument.
        if(isLost) showNotification(`😭 You lost. The word was: ${wordToGuess?.word}.`, true);
    }, [isWon, isLost, wordToGuess, showNotification]);

    const handleGuess = (letter: string) => {
        if (isGameOver) return;
        const upperLetter = letter.toUpperCase();
        setGuessedLetters(prev => new Set(prev).add(upperLetter));
        if (!wordToGuess?.word.toUpperCase().includes(upperLetter)) {
            setWrongGuesses(prev => prev + 1);
        }
    };

    return (
        <div className="text-center">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xl font-bold">Lives: {MAX_WRONG - wrongGuesses}</span>
                 <button onClick={setupGame} className="btn-game bg-[#f44336]"><RestartIcon /> New Game</button>
            </div>
            <HangmanDrawing numberOfGuesses={wrongGuesses} />
            <div className="flex justify-center gap-2 mb-4 flex-wrap">
                {wordLetters.map((letter, i) => (
                    <span key={i} className="w-10 h-10 border-b-4 border-[#4361ee] flex items-center justify-center text-3xl font-bold">
                        {(guessedLetters.has(letter) || isLost) && letter}
                    </span>
                ))}
            </div>
            {!isGameOver && (
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                    {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(key => (
                        <button 
                            key={key} 
                            onClick={() => handleGuess(key)} 
                            disabled={guessedLetters.has(key)}
                            className="w-10 h-10 text-lg rounded-md border bg-gray-100 disabled:opacity-50"
                        >
                            {key}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};


// --- Word Scramble Game ---
// FIX: Corrected the type for the 'showNotification' prop for better type safety.
const WordScrambleGame: React.FC<{ cards: Flashcard[]; onBack: () => void; showNotification: (message: string, isError?: boolean) => void }> = ({ cards, showNotification }) => {
    const [currentCard, setCurrentCard] = useState<Flashcard | null>(null);
    const [scrambledWord, setScrambledWord] = useState('');
    const [guess, setGuess] = useState('');
    const [score, setScore] = useState(0);
    const [isAnswered, setIsAnswered] = useState(false);

    const setupNextWord = useCallback(() => {
        // FIX: Explicitly type 'card' as Flashcard to fix type inference issue.
        const card: Flashcard = shuffleArray(cards)[0];
        setCurrentCard(card);
        let word = card.word;
        let scrambled = shuffleArray(word.split('')).join('');
        while (scrambled.toLowerCase() === word.toLowerCase() && word.length > 1) {
            scrambled = shuffleArray(word.split('')).join('');
        }
        setScrambledWord(scrambled);
        setGuess('');
        setIsAnswered(false);
    }, [cards]);

    useEffect(setupNextWord, [setupNextWord]);

    const handleSubmit = () => {
        if (!guess || !currentCard) return;
        setIsAnswered(true);
        if (guess.trim().toLowerCase() === currentCard.word.toLowerCase()) {
            // FIX: Removed unused 'duration' argument.
            showNotification(`✅ Correct! The word was ${currentCard.word}.`, false);
            setScore(s => s + 1);
        } else {
            // FIX: Removed unused 'duration' argument.
            showNotification(`❌ Incorrect. The word was: ${currentCard.word}.`, true);
        }
        setTimeout(setupNextWord, 3000);
    };

    const handleSkip = () => {
        setIsAnswered(true);
        // FIX: Removed unused 'duration' argument.
        showNotification(`The word was: ${currentCard?.word}.`, false);
        setTimeout(setupNextWord, 3000);
    };
    
    return(
        <div className="text-center">
            <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold flex items-center gap-2"><ScoreIcon /> Score: {score}</span>
                <button onClick={setupNextWord} className="btn-game bg-[#f44336]"><RestartIcon /> New Game</button>
            </div>
            <div className="text-5xl font-bold tracking-widest text-[#4361ee] my-6 p-5 bg-blue-50 rounded-lg">{scrambledWord}</div>
            <input 
                type="text" 
                value={guess}
                onChange={e => setGuess(e.target.value)}
                disabled={isAnswered}
                onKeyUp={e => e.key === 'Enter' && handleSubmit()}
                className="w-full max-w-md p-3 text-2xl border-2 border-[#4cc9f0] rounded-lg text-center"
            />
            <div className="mt-4 flex justify-center gap-4">
                <button onClick={handleSubmit} disabled={isAnswered} className="btn-game bg-[#67cbf3]">Submit</button>
                <button onClick={handleSkip} disabled={isAnswered} className="btn-game bg-[#ff9f1c]">Skip</button>
            </div>
        </div>
    );
};


// --- Main Games View ---
export const GamesView: React.FC<{ cards: Flashcard[]; showNotification: (message: string, isError?: boolean) => void }> = ({ cards, showNotification }) => {
    const [activeGame, setActiveGame] = useState<Game>('menu');

    const renderGame = () => {
        switch (activeGame) {
            case 'matching':
                return <MatchingGame cards={cards} onBack={() => setActiveGame('menu')} showNotification={showNotification}/>;
            case 'hangman':
                return <HangmanGame cards={cards} onBack={() => setActiveGame('menu')} showNotification={showNotification}/>;
            case 'scramble':
                return <WordScrambleGame cards={cards} onBack={() => setActiveGame('menu')} showNotification={showNotification}/>;
            default:
                return (
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-6">Vocabulary Games</h2>
                        <div className="flex flex-col gap-4 max-w-sm mx-auto">
                            <button onClick={() => setActiveGame('matching')} className="btn-game bg-[#67cbf3]">Matching Game</button>
                            <button onClick={() => setActiveGame('hangman')} className="btn-game bg-[#ff9f1c]">Hangman</button>
                            <button onClick={() => setActiveGame('scramble')} className="btn-game bg-[#4cc9f0]">Word Scramble</button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md min-h-[400px]">
            {activeGame !== 'menu' && (
                 <button onClick={() => setActiveGame('menu')} className="mb-4 text-[#4361ee] font-semibold hover:underline">
                    &larr; Back to Games Menu
                 </button>
            )}
            {renderGame()}
        </div>
    );
};