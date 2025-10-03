import React, { useState, useEffect, useCallback } from 'react';
import type { Flashcard } from '../types.tsx';
import { SpinnerIcon } from './icons.tsx';

interface FileInfo {
    name: string;
    download_url: string;
}

interface FileLoaderProps {
    onCardsLoaded: (cards: Flashcard[]) => void;
    // FIX: Removed unused 'duration' parameter from type definition.
    showNotification: (message: string, isError?: boolean) => void;
}

const GITHUB_REPO_URL = 'https://api.github.com/repos/Mazenegykfs/Flashcards/contents/';

export const FileLoader: React.FC<FileLoaderProps> = ({ onCardsLoaded, showNotification }) => {
    const [fileList, setFileList] = useState<FileInfo[]>([]);
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchFileList = useCallback(async () => {
        try {
            const response = await fetch(GITHUB_REPO_URL);
            if (!response.ok) throw new Error('Could not fetch file list from GitHub.');
            const files: any[] = await response.json();

            const excelFiles = files
                .filter(file => file.name.endsWith('.xlsx'))
                .sort((a, b) => a.name.localeCompare(b.name));

            if (excelFiles.length === 0) throw new Error('No .xlsx files found in the GitHub repository.');

            setFileList(excelFiles);
            setSelectedFile(excelFiles[0].name);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            showNotification(errorMessage, true);
        } finally {
            setIsLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        fetchFileList();
    }, [fetchFileList]);

    const loadDataFromUrl = useCallback(async (url: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Network response error: ${response.statusText}`);
            const data = await response.arrayBuffer();
            
            const workbook = (window as any).XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[][] = (window as any).XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const headers = jsonData[0].map(h => String(h).toLowerCase().trim());
            const wordIndex = headers.indexOf('word');
            const iconIndex = headers.indexOf('icon');
            const descIndex = headers.indexOf('description');
            const arabicIndex = headers.indexOf('arabic meaning');
            
            if (wordIndex === -1) throw new Error("Column 'Word' not found.");

            const loadedFlashcards: Flashcard[] = jsonData.slice(1).map(row => ({
                word: (row[wordIndex] || '').toString(), 
                icon: row[iconIndex], 
                description: row[descIndex], 
                arabicMeaning: row[arabicIndex]
            })).filter(card => card.word && card.arabicMeaning && /^[a-zA-Z\s'-]+$/.test(card.word));

            if (loadedFlashcards.length < 8) {
                throw new Error("At least 8 valid English words with Arabic meanings are needed for games and quizzes.");
            }
            onCardsLoaded(loadedFlashcards);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load or process file';
            // FIX: Removed unused 'duration' argument.
            showNotification(errorMessage, true);
            onCardsLoaded([]);
        } finally {
            setIsLoading(false);
        }
    }, [onCardsLoaded, showNotification]);
    
    const handleLoadClick = () => {
        const file = fileList.find(f => f.name === selectedFile);
        if (file) {
            const fileUrl = `https://raw.githubusercontent.com/Mazenegykfs/Flashcards/main/${file.name}`;
            loadDataFromUrl(fileUrl);
        }
    };

    if (isLoading && fileList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-4">
                <SpinnerIcon />
                <p>Loading file list from GitHub...</p>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">Select a Word List</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <select 
                    id="fileSelect" 
                    value={selectedFile}
                    onChange={(e) => setSelectedFile(e.target.value)}
                    className="w-full sm:w-auto px-4 py-3 text-lg border-2 border-[#4cc9f0] rounded-lg focus:ring-2 focus:ring-[#4361ee] focus:border-[#4361ee] transition"
                    disabled={isLoading}
                >
                    {fileList.map(file => <option key={file.name} value={file.name}>{file.name}</option>)}
                </select>
                <button 
                    onClick={handleLoadClick}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-lg font-bold text-white bg-[#67cbf3] rounded-full shadow-md hover:bg-[#4361ee] transition-transform transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isLoading}
                >
                    {isLoading ? <SpinnerIcon /> : '📚'}
                    {isLoading ? 'Loading...' : 'Load Cards'}
                </button>
            </div>
        </div>
    );
};