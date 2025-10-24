import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

const BookIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

interface StoryColumnProps {
  recognizedText: string | null;
}

const StoryColumn: React.FC<StoryColumnProps> = ({ recognizedText }) => {
  const [story, setStory] = useState<string | null>(null);
  const [displayedStory, setDisplayedStory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!story) return;

    setDisplayedStory(''); // Reset for new story
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < story.length) {
        setDisplayedStory(prev => prev + story.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 25); // Typing speed in ms

    return () => clearInterval(typingInterval);
  }, [story]);

  const handleStartWriting = async () => {
    if (!recognizedText) return;

    setIsLoading(true);
    setError(null);
    setStory(null);
    setDisplayedStory('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Write a short, fun, and imaginative story for a 5-year-old child about a ${recognizedText}. The story must be 4 to 5 sentences.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setStory(response.text.trim());
    } catch (err) {
      console.error("Story generation failed:", err);
      setError("I'm sorry, I couldn't write a story right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center h-full">
        <BookIcon />
        <h2 className="text-2xl font-bold mt-4 mb-2 text-emerald-700">Story</h2>
        
        <div className="flex-grow w-full flex flex-col items-center justify-center">
            {isLoading ? (
                <>
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-200 border-t-emerald-500"></div>
                    <p className="mt-4 text-lg font-semibold text-emerald-700">Writing a magical story...</p>
                </>
            ) : error ? (
                <p className="text-sm text-red-500">{error}</p>
            ) : story ? (
                <div className="w-full h-full text-left p-4 bg-gray-50 rounded-lg overflow-y-auto border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-wrap font-serif text-lg leading-relaxed">{displayedStory}<span className="inline-block w-2 h-5 bg-emerald-600 animate-pulse ml-1"></span></p>
                </div>
            ) : (
                <p className="text-gray-600">
                    {recognizedText 
                        ? `Ready to write a story about a ${recognizedText}?` 
                        : "Draw something on the 'Draw' tab, and I'll write a story about it!"}
                </p>
            )}
        </div>

        <button 
            onClick={handleStartWriting}
            disabled={!recognizedText || isLoading}
            className="mt-6 bg-emerald-500 text-white font-bold py-2 px-6 rounded-full hover:bg-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-emerald-300 disabled:scale-100 disabled:cursor-not-allowed"
        >
            {isLoading ? 'Writing...' : story ? 'Write Another Story' : 'Start Writing'}
        </button>
    </div>
  );
};

export default StoryColumn;