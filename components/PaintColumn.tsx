
import React from 'react';

const PaletteIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

const PaintColumn: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center h-full">
        <PaletteIcon />
        <h2 className="text-2xl font-bold mt-4 mb-2 text-indigo-700">Paint</h2>
        <p className="text-gray-600 flex-grow">
            Mix colors and paint your masterpiece. Explore textures, gradients, and layers to create stunning digital paintings.
        </p>
        <button className="mt-6 bg-indigo-500 text-white font-bold py-2 px-6 rounded-full hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
            Start Painting
        </button>
    </div>
  );
};

export default PaintColumn;
