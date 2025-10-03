import React, { useState, useMemo, useCallback } from 'react';
import type { Flashcard } from '../types';
import { RestartIcon, ScoreIcon } from './icons';

type QuizLevel = 1 | 2;
type QuizStatus = 'level_select' | 'in_progress' | 'finished';

interface QuizQuestion {
    questionCard: Flashcard;
    options: string[];
    correctAnswer: string;
}

const shuffleArray = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
}

export const QuizView: React.FC<{ cards: Flashcard[]; showNotification: (message: string, isError?: boolean) => void }> = ({ cards, showNotification }) => {
    const [status, setStatus] = useState<QuizStatus>('level_select');
    const [level, setLevel] = useState<QuizLevel>(1);
    const [quizLength, setQuizLength] = useState(Math.min(20, cards.length));
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [answered, setAnswered] = useState<string | null>(null);

    const startQuiz = useCallback((selectedLevel: QuizLevel) => {
        if (quizLength < 4) {
            showNotification('Quiz must have at least 4 questions.', true);
            return;
        }

        setLevel(selectedLevel);
        const shuffledCards = shuffleArray(cards);
        const quizCards = shuffledCards.slice(0, quizLength);

        const newQuestions = quizCards.map(qCard => {
            let correctAnswer: string;
            let options: Set<string> = new Set();
            let distractorPool: string[];

            if (selectedLevel === 1) { // Word -> Meaning
                correctAnswer = qCard.arabicMeaning;
                options.add(correctAnswer);
                distractorPool = shuffleArray(cards.map(c => c.arabicMeaning).filter(m => m !== correctAnswer));
            } else { // Description -> Word
                correctAnswer = qCard.word;
                options.add(correctAnswer);
                distractorPool = shuffleArray(cards.map(c => c.word).filter(w => w !== correctAnswer));
            }
            
            while(options.size < 4 && distractorPool.length > 0) {
                options.add(distractorPool.pop()!);
            }

            return {
                questionCard: qCard,
                options: shuffleArray(Array.from(options)),
                correctAnswer: correctAnswer
            };
        });

        setQuestions(newQuestions);
        setCurrentIndex(0);
        setScore(0);
        setAnswered(null);
        setStatus('in_progress');
    }, [cards, quizLength, showNotification]);

    const handleAnswer = (selectedOption: string) => {
        setAnswered(selectedOption);
        if (selectedOption === questions[currentIndex].correctAnswer) {
            setScore(prev => prev + 1);
            // FIX: Removed unused 'duration' argument. The duration is handled by the Notification component.
            showNotification('Correct!', false);
        } else {
            // FIX: Removed unused 'duration' argument. The duration is handled by the Notification component.
            showNotification('Incorrect!', true);
        }

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setAnswered(null);
            } else {
                setStatus('finished');
            }
        }, 2000);
    };

    const restartQuiz = () => {
        setStatus('level_select');
    };

    const currentQuestion = useMemo(() => questions[currentIndex], [questions, currentIndex]);

    if (status === 'level_select') {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-md text-center">
                <h2 className="text-3xl font-bold mb-4">Select Quiz Level</h2>
                <div className="mb-6">
                    <label htmlFor="quizLengthInput" className="text-xl mr-2">Number of Questions:</label>
                    <input 
                        type="number" 
                        id="quizLengthInput" 
                        value={quizLength}
                        onChange={e => setQuizLength(Math.min(cards.length, parseInt(e.target.value) || 4))}
                        min="4"
                        max={cards.length}
                        className="w-24 p-2 text-xl text-center border-2 border-[#4cc9f0] rounded-lg"
                    />
                </div>
                <div className="flex flex-col gap-4 max-w-sm mx-auto">
                    <button onClick={() => startQuiz(1)} className="btn-quiz bg-[#67cbf3]">Level 1: Word ➔ Meaning</button>
                    <button onClick={() => startQuiz(2)} className="btn-quiz bg-[#4361ee]">Level 2: Description ➔ Word</button>
                </div>
            </div>
        );
    }
    
    if (status === 'finished') {
         const percentage = Math.round((score / questions.length) * 100);
         let stars = '', icon = '';
         if (percentage >= 90) { stars = '⭐⭐⭐'; icon = '🏆'; } 
         else if (percentage >= 70) { stars = '⭐⭐'; icon = '🥇'; } 
         else if (percentage >= 50) { stars = '⭐'; icon = '👍'; } 
         else { stars = 'Try Again!'; icon = '😔'; }

        return (
            <div className="bg-white p-6 rounded-2xl shadow-md text-center">
                <div className="text-6xl mb-4">{icon}</div>
                <h2 className="text-4xl font-bold mb-2">Quiz Complete!</h2>
                <p className="text-2xl mb-4">Your final score is {score} out of {questions.length} ({percentage}%)</p>
                <div className="text-5xl mb-6">{stars}</div>
                <button onClick={restartQuiz} className="btn-quiz bg-[#f44336]"><RestartIcon /> New Quiz</button>
            </div>
        )
    }

    if (!currentQuestion) return null;

    const { questionCard, options, correctAnswer } = currentQuestion;

    const getButtonClass = (option: string) => {
        if (!answered) return 'bg-white text-[#4361ee] hover:bg-[#4361ee] hover:text-white';
        if (option === correctAnswer) return 'bg-green-500 text-white border-green-500';
        if (option === answered) return 'bg-red-500 text-white border-red-500';
        return 'bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed';
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex justify-between items-center mb-4 text-lg font-bold">
                <div>Question: {currentIndex + 1} / {questions.length}</div>
                <div className="flex items-center gap-2"><ScoreIcon /> Score: {score}/{questions.length}</div>
                <button onClick={restartQuiz} className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-[#f44336] rounded-full hover:bg-red-700 transition"><RestartIcon /> Restart</button>
            </div>
            
            <div className="text-center mb-6 min-h-[120px] flex flex-col justify-center">
                {level === 1 ? (
                    <>
                        <div className="text-5xl mb-2">{questionCard.icon || '📝'}</div>
                        <h3 className="text-4xl font-bold">{questionCard.word}</h3>
                    </>
                ) : (
                    <p className="text-2xl">{questionCard.description}</p>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {options.map(option => (
                    <button
                        key={option}
                        onClick={() => handleAnswer(option)}
                        disabled={!!answered}
                        dir={level === 1 ? 'rtl' : 'ltr'}
                        className={`w-full p-4 text-xl font-semibold border-2 border-[#4361ee] rounded-lg transition-colors duration-300 disabled:opacity-70 ${getButtonClass(option)}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
};