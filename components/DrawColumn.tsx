
import React from 'react';

const BrushIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
  </svg>
);

const DrawColumn: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center h-full">
      <BrushIcon />
      <h2 className="text-2xl font-bold mt-4 mb-2 text-blue-700">Draw</h2>
      <p className="text-gray-600 flex-grow">
        Unleash your creativity on a digital canvas. Sketch, doodle, and bring your ideas to life with a variety of brushes and tools.
      </p>
      <button className="mt-6 bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg">
        Start Drawing
      </button>
    </div>
  );
};

export default DrawColumn;
