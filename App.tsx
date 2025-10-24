
import React, { useState } from 'react';
import DrawColumn from './components/DrawColumn';
import PaintColumn from './components/PaintColumn';
import StoryColumn from './components/StoryColumn';

type Tab = 'draw' | 'paint' | 'story';

const TABS: { id: Tab; label: string }[] = [
  { id: 'draw', label: 'Draw' },
  { id: 'paint', label: 'Paint' },
  { id: 'story', label: 'Story' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('draw');

  const commonColumnClasses = "p-6 border border-blue-300 rounded-lg shadow-md bg-white min-h-[60vh] flex flex-col";

  return (
    <div className="min-h-screen text-gray-800 p-4 sm:p-6 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-600 tracking-tight">Creative Suite</h1>
        <p className="text-lg text-gray-600 mt-2">Your space to draw, paint, and tell stories.</p>
      </header>

      <main>
        {/* Mobile Tabbed View */}
        <div className="md:hidden">
          <div className="flex border-b border-blue-200 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-2 font-semibold text-center transition-colors duration-300 ease-in-out text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className={commonColumnClasses}>
            {activeTab === 'draw' && <DrawColumn />}
            {activeTab === 'paint' && <PaintColumn />}
            {activeTab === 'story' && <StoryColumn />}
          </div>
        </div>

        {/* Desktop Side-by-Side View */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-6">
          <div className={commonColumnClasses}>
            <DrawColumn />
          </div>
          <div className={commonColumnClasses}>
            <PaintColumn />
          </div>
          <div className={commonColumnClasses}>
            <StoryColumn />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
