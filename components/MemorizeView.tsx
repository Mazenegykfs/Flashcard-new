
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Flashcard } from '../types.tsx';
import { AutoplayIcon, NextIcon, PrevIcon, PronounceIcon, ShuffleIcon, StopIcon } from './icons.tsx';

const colorMap: { [key: string]: string } = {
    'red': '#ff0000', 'green': '#008000', 'blue': '#0000ff', 'yellow': '#ffff00',
    'orange': '#ffa500', 'purple': '#800080', 'pink': '#ffc0cb', 'black': '#000000',
    'white': '#ffffff', 'gray': '#808080', 'grey': '#808080', 'brown': '#a52a2a',
};

// Flashcard Component
const FlashcardDisplay: React.FC<{ cardData: Flashcard; isFlipped: boolean; onFlip: () => void; onPronounce: (e: React.MouseEvent) => void }> = ({ cardData, isFlipped, onFlip, onPronounce }) => {
    const wordLower = (cardData.word || '').toLowerCase();
    const iconColor = colorMap[wordLower];
    const iconStyle = {
        color: iconColor || 'inherit',
        textShadow: wordLower === 'white' ? '0 0 5px #000' : 'none'
    };

    return (
        <div className="h-[400px] perspective-1000 mb-8" onClick={onFlip}>
            <div className={`relative w-full h-full transform-style-3d transition-transform duration-700 rounded-2xl shadow-xl cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden rounded-2xl p-8 flex flex-col justify-center items-center text-center bg-gradient-to-br from-[#81d4fa] to-[#4fc3f7] text-white">
                    <div className="text-6xl mb-5" style={iconStyle}>{cardData.icon || '📝'}</div>
                    <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold">{cardData.word}</div>
                        <button onClick={onPronounce} className="text-4xl transition-transform hover:scale-110 p-0 leading-none">
                           <PronounceIcon />
                        </button>
                    </div>
                </div>
                {/* Back */}
                <div className="absolute w-full h-full backface-hidden rounded-2xl p-8 flex flex-col justify-center items-center text-center bg-gradient-to-br from-[#f1f8e9] to-[#dcedc8] text-[#212529] rotate-y-180 overflow-y-auto">
                    <p className="text-xl mb-4">{cardData.description || 'No description available.'}</p>
                    <p className="text-3xl font-bold text-[#4361ee] font-['Tahoma']" dir="rtl">{cardData.arabicMeaning}</p>
                </div>
            </div>
        </div>
    );
};

// Controls Component
const PronunciationControls: React.FC<{
    rate: number; setRate: (rate: number) => void;
    pronounceWord: boolean; setPronounceWord: (p: boolean) => void;
    pronounceArabic: boolean; setPronounceArabic: (p: boolean) => void;
    pronounceDescription: boolean; setPronounceDescription: (p: boolean) => void;
}> = ({ rate, setRate, pronounceWord, setPronounceWord, pronounceArabic, setPronounceArabic, pronounceDescription, setPronounceDescription }) => {
    return (
        <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 bg-gray-50 p-4 rounded-lg mb-5">
            <div className="flex items-center gap-2">
                <label htmlFor="speedControl" className="font-bold">Voice Speed:</label>
                <input type="range" id="speedControl" min="0.5" max="2" value={rate} step="0.1" onChange={e => setRate(parseFloat(e.target.value))} className="w-36"/>
                <span className="font-bold text-[#4361ee] min-w-[40px]">{rate.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-4">
                <strong className="mr-2">Pronounce:</strong>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={pronounceWord} onChange={e => setPronounceWord(e.target.checked)} /> Word</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={pronounceArabic} onChange={e => setPronounceArabic(e.target.checked)} /> Arabic</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={pronounceDescription} onChange={e => setPronounceDescription(e.target.checked)} /> Description</label>
            </div>
        </div>
    );
};

// Main View Component
export const MemorizeView: React.FC<{ cards: Flashcard[]; setCards: React.Dispatch<React.SetStateAction<Flashcard[]>>; showNotification: (message: string, isError?: boolean) => void }> = ({ cards, setCards, showNotification }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isAutoplaying, setIsAutoplaying] = useState(false);
    
    // Pronunciation settings state
    const [speechRate, setSpeechRate] = useState(1.0);
    const [pronounceWord, setPronounceWord] = useState(true);
    const [pronounceArabic, setPronounceArabic] = useState(false);
    const [pronounceDescription, setPronounceDescription] = useState(false);
    
    const currentCard = useMemo(() => cards[currentIndex], [cards, currentIndex]);

    const pronounceText = useCallback((text: string, lang: string, rate: number) => {
        return new Promise<void>(resolve => {
            if (!text || !('speechSynthesis' in window)) {
                resolve();
                return;
            }
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = rate;
            utterance.onend = () => resolve();
            utterance.onerror = () => resolve();
            window.speechSynthesis.speak(utterance);
        });
    }, []);

    const showNextCard = useCallback(() => {
        setIsFlipped(false);
        setCurrentIndex(prev => (prev + 1) % cards.length);
    }, [cards.length]);

    const showPrevCard = () => {
        setIsFlipped(false);
        setCurrentIndex(prev => (prev - 1 + cards.length) % cards.length);
    };

    const shuffleCards = () => {
        if (cards.length < 2) {
            showNotification("Not enough cards to shuffle.", true);
            return;
        }
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
        showNotification("🔀 Cards have been shuffled!");
    };
    
    const stopAutoplay = useCallback(() => {
        setIsAutoplaying(false);
        window.speechSynthesis.cancel();
    }, []);
    
    const handleFlip = async () => {
        if (isAutoplaying) return;
        const newFlippedState = !isFlipped;
        setIsFlipped(newFlippedState);

        if (newFlippedState) {
            if (pronounceArabic && currentCard.arabicMeaning) await pronounceText(currentCard.arabicMeaning, 'ar-SA', speechRate);
            if (pronounceDescription && currentCard.description) await pronounceText(currentCard.description, 'en-US', speechRate);
        } else {
            window.speechSynthesis.cancel();
        }
    };
    
    const handlePronounce = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (pronounceWord && currentCard.word) {
            pronounceText(currentCard.word, 'en-US', speechRate);
        }
    };
    
    const handleWordListItemClick = (index: number) => {
        stopAutoplay();
        setCurrentIndex(index);
        setIsFlipped(false);
    };

    useEffect(() => {
        if (!isAutoplaying) return;

        let cancelled = false;
        
        const sequence = async () => {
            if (pronounceWord && currentCard.word) await pronounceText(currentCard.word, 'en-US', speechRate);
            if (cancelled) return;
            
            await new Promise(r => setTimeout(r, 500));
            if (cancelled) return;
            setIsFlipped(true);

            await new Promise(r => setTimeout(r, 800));
            if (cancelled) return;
            if (pronounceArabic && currentCard.arabicMeaning) await pronounceText(currentCard.arabicMeaning, 'ar-SA', speechRate);
            if (cancelled) return;

            if (pronounceDescription && currentCard.description) await pronounceText(currentCard.description, 'en-US', speechRate);
            if (cancelled) return;

            await new Promise(r => setTimeout(r, 1500));
            if (cancelled) return;
            
            showNextCard();
        };

        const timeoutId = setTimeout(sequence, 800);
        
        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [isAutoplaying, currentIndex, showNextCard, currentCard, pronounceText, speechRate, pronounceWord, pronounceArabic, pronounceDescription]);
    
    useEffect(() => {
        // Stop autoplay if component unmounts
        return () => stopAutoplay();
    }, [stopAutoplay]);


    return (
        <div className="bg-white p-6 rounded-2xl shadow-md">
            <PronunciationControls 
                rate={speechRate} setRate={setSpeechRate}
                pronounceWord={pronounceWord} setPronounceWord={setPronounceWord}
                pronounceArabic={pronounceArabic} setPronounceArabic={setPronounceArabic}
                pronounceDescription={pronounceDescription} setPronounceDescription={setPronounceDescription}
            />

            <FlashcardDisplay 
                cardData={currentCard} 
                isFlipped={isFlipped}
                onFlip={handleFlip}
                onPronounce={handlePronounce}
            />

            {/* Navigation */}
            <div className="flex justify-between items-center flex-wrap gap-2">
                <button onClick={showPrevCard} disabled={isAutoplaying} className="btn bg-[#f44336]"><PrevIcon/> Previous</button>
                <div className="font-bold text-lg">{currentIndex + 1} / {cards.length}</div>
                <div className="flex gap-2">
                    <button onClick={shuffleCards} disabled={isAutoplaying} className="btn bg-[#4361ee]"><ShuffleIcon /> Shuffle</button>
                    <button onClick={() => setIsAutoplaying(!isAutoplaying)} className={`btn ${isAutoplaying ? 'bg-[#f72585]' : 'bg-[#4cc9f0]'}`}>
                        {isAutoplaying ? <><StopIcon/> Stop</> : <><AutoplayIcon/> Autoplay</>}
                    </button>
                </div>
                <button onClick={showNextCard} disabled={isAutoplaying} className="btn bg-[#67cbf3]"><NextIcon /> Next</button>
            </div>
            
            {/* Word List */}
            <div className="mt-5 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {cards.map((card, index) => (
                    <div
                        key={`${card.word}-${index}`}
                        className={`p-2.5 rounded-md cursor-pointer transition-colors ${currentIndex === index ? 'bg-[#4361ee] text-white font-bold' : 'hover:bg-blue-100'}`}
                        onClick={() => handleWordListItemClick(index)}
                    >
                        {card.word}
                    </div>
                ))}
            </div>
        </div>
    );
};