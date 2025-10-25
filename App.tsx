
import React, { useState, useEffect } from 'react';
import DrawColumn from './components/DrawColumn';
import PaintColumn from './components/PaintColumn';
import StoryColumn from './components/StoryColumn';
import { recognizeImage, generateColoringPage } from './api';

type Tab = 'draw' | 'paint' | 'story';

const TABS: { id: Tab; label: string }[] = [
  { id: 'draw', label: 'Draw' },
  { id: 'paint', label: 'Paint' },
  { id: 'story', label: 'Story' },
];

const TAB_STYLING: Record<Tab, { bg: string; border: string }> = {
  draw: { bg: 'bg-amber-50', border: 'border-amber-200' },
  paint: { bg: 'bg-orange-50', border: 'border-orange-200' },
  story: { bg: 'bg-rose-50', border: 'border-rose-200' },
};


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('draw');
  const [recognizedObject, setRecognizedObject] = useState<string | null>(null);
  const [coloringPageImage, setColoringPageImage] = useState<string | null>(null);
  const [originalDrawingImage, setOriginalDrawingImage] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecognizeDrawing = async (base64ImageData: string) => {
    setIsRecognizing(true);
    setRecognizedObject(null);
    setColoringPageImage(null);
    setOriginalDrawingImage(base64ImageData);
    setError(null);
    try {
      const text = await recognizeImage(base64ImageData);
      setRecognizedObject(text);
    } catch (err: any) {
      console.error("Recognition failed:", err);
      setError(err.message || "Sorry, I couldn't recognize that drawing. Please try again.");
    } finally {
      setIsRecognizing(false);
    }
  };

  useEffect(() => {
    if (!recognizedObject) return;

    const generatePage = async () => {
      setIsGenerating(true);
      setError(null);
      try {
        const imageUrl = await generateColoringPage(recognizedObject);
        setColoringPageImage(imageUrl);
        setActiveTab('paint'); // Auto-switch to paint tab on mobile
      } catch (err: any) {
        console.error("Image generation failed:", err);
        setError(err.message || `Sorry, I couldn't create a coloring page for "${recognizedObject}".`);
      } finally {
        setIsGenerating(false);
      }
    };

    generatePage();
  }, [recognizedObject]);

  const commonColumnClasses = "p-6 border rounded-lg shadow-md min-h-[60vh] flex flex-col";

  const components: Record<Tab, React.ReactNode> = {
    draw: <DrawColumn onRecognize={handleRecognizeDrawing} isLoading={isRecognizing} isGenerating={isGenerating} recognizedText={recognizedObject} error={error} />,
    paint: <PaintColumn coloringPageImage={coloringPageImage} originalDrawingImage={originalDrawingImage} isLoading={isGenerating} recognizedText={recognizedObject} error={error} />,
    story: <StoryColumn recognizedText={recognizedObject} />
  };

  return (
    <div className="min-h-screen text-stone-800 p-4 sm:p-6 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-600 tracking-tight">Creative Suite</h1>
        <p className="text-lg text-stone-600 mt-2">Your AI-powered space to draw, paint, and tell stories.</p>
      </header>

      <main>
        {/* Mobile Tabbed View Controls */}
        <div className="md:hidden">
          <div className="flex border-b border-blue-200 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-2 font-semibold text-center transition-colors duration-300 ease-in-out text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-stone-500 hover:text-blue-500 hover:bg-blue-50/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Unified Content Area for Mobile and Desktop */}
        <div className="flex flex-col md:grid md:grid-cols-3 md:gap-6">
          {TABS.map((tab) => (
            <div key={tab.id} className={`${commonColumnClasses} ${TAB_STYLING[tab.id].bg} ${TAB_STYLING[tab.id].border} ${activeTab === tab.id ? '' : 'hidden'} md:flex`}>
              {components[tab.id]}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
