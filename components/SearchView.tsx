
import React, { useState, useMemo } from 'react';
import type { Flashcard } from '../types.tsx';

const SearchResultCard: React.FC<{ card: Flashcard | null }> = ({ card }) => {
    if (!card) {
        return (
            <div className="h-[250px] rounded-2xl p-8 flex flex-col justify-center items-center text-center bg-gradient-to-br from-gray-200 to-gray-300">
                <div className="text-6xl mb-5">🔍</div>
                <h3 className="text-2xl font-bold text-gray-700">Search for a Word</h3>
                <p className="text-gray-600 mt-2">Use the search box above to find a word. Select a result to see its details here.</p>
            </div>
        );
    }
    
    return (
         <div className="h-[250px] rounded-2xl p-8 flex flex-col justify-center items-center text-center bg-gradient-to-br from-[#81d4fa] to-[#4fc3f7] text-white shadow-lg">
            <div className="text-6xl mb-4">{card.icon || '📝'}</div>
            <h3 className="text-3xl font-bold">{card.word}</h3>
            <p className="text-xl mt-2 text-[#4361ee] font-bold font-['Tahoma']" dir="rtl">{card.arabicMeaning}</p>
            <p className="text-md mt-4 text-white/90">{card.description}</p>
        </div>
    );
};

export const SearchView: React.FC<{ cards: Flashcard[] }> = ({ cards }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchLang, setSearchLang] = useState<'en' | 'ar'>('en');
    const [selectedCard, setSelectedCard] = useState<Flashcard | null>(null);

    const filteredCards = useMemo(() => {
        if (!searchTerm) return [];
        try {
            const regex = new RegExp(searchTerm.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*'), 'i');
            const searchKey = searchLang === 'en' ? 'word' : 'arabicMeaning';
            return cards.filter(card => regex.test(card[searchKey]));
        } catch (e) {
            return []; // Invalid regex
        }
    }, [searchTerm, searchLang, cards]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="mb-4 text-center">
                 <div className="inline-flex bg-gray-100 p-1 rounded-full mb-4">
                    <button 
                        className={`px-6 py-2 rounded-full font-semibold transition ${searchLang === 'en' ? 'bg-[#4361ee] text-white' : ''}`}
                        onClick={() => setSearchLang('en')}
                    >
                        Search English
                    </button>
                    <button 
                        className={`px-6 py-2 rounded-full font-semibold transition ${searchLang === 'ar' ? 'bg-[#4361ee] text-white' : ''}`}
                        onClick={() => setSearchLang('ar')}
                    >
                        Search Arabic
                    </button>
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={searchLang === 'en' ? 'Search words (use * for wildcard)...' : 'ابحث بالكلمات العربية (استخدم * للبحث)...'}
                    dir={searchLang === 'ar' ? 'rtl' : 'ltr'}
                    className="w-full text-lg p-3 border-2 border-[#4cc9f0] rounded-lg focus:ring-2 focus:ring-[#4361ee] transition"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {searchTerm && filteredCards.length === 0 && (
                        <div className="p-3 text-gray-500">No results found.</div>
                    )}
                    {filteredCards.map((card, index) => (
                        <div
                            key={`${card.word}-${index}`}
                            className="p-3 rounded-md cursor-pointer hover:bg-blue-100"
                            style={{direction: searchLang === 'ar' ? 'rtl' : 'ltr'}}
                            onClick={() => setSelectedCard(card)}
                        >
                            {searchLang === 'en' ? card.word : card.arabicMeaning}
                        </div>
                    ))}
                </div>

                <div>
                    <SearchResultCard card={selectedCard} />
                </div>
            </div>
        </div>
    );
};