
import React from 'react';

const BookIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const StoryColumn: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center h-full">
        <BookIcon />
        <h2 className="text-2xl font-bold mt-4 mb-2 text-emerald-700">Story</h2>
        <p className="text-gray-600 flex-grow">
            Weave compelling narratives. Write, edit, and structure your stories, from short tales to epic sagas.
        </p>
        <button className="mt-6 bg-emerald-500 text-white font-bold py-2 px-6 rounded-full hover:bg-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
            Start Writing
        </button>
    </div>
  );
};

export default StoryColumn;
