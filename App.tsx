
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from "@google/genai";
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
  const [recognizedObject, setRecognizedObject] = useState<string | null>(null);
  const [coloringPageImage, setColoringPageImage] = useState<string | null>(null);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const handleRecognizeDrawing = async (base64ImageData: string) => {
    setIsRecognizing(true);
    setRecognizedObject(null);
    setColoringPageImage(null);
    setError(null);
    try {
      const imagePart = {
        inlineData: { mimeType: 'image/png', data: base64ImageData },
      };
      const textPart = { text: 'What is this a simple drawing of? Be concise, one or two words.' };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
      });

      const text = response.text.trim();
      setRecognizedObject(text);
    } catch (err) {
      console.error("Recognition failed:", err);
      setError("Sorry, I couldn't recognize that drawing. Please try again.");
    } finally {
      setIsRecognizing(false);
    }
  };

  useEffect(() => {
    if (!recognizedObject) return;

    const generateColoringPage = async () => {
      setIsGenerating(true);
      setError(null);
      try {
        const prompt = `A simple, bold, black and white coloring book page for a 5-year-old of a ${recognizedObject}.`;
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: prompt }] },
          config: {
            responseModalities: [Modality.IMAGE],
          },
        });
        
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
            setColoringPageImage(imageUrl);
            break;
          }
        }
      } catch (err) {
        console.error("Image generation failed:", err);
        setError(`Sorry, I couldn't create a coloring page for "${recognizedObject}".`);
      } finally {
        setIsGenerating(false);
      }
    };

    generateColoringPage();
  }, [recognizedObject]);

  const commonColumnClasses = "p-6 border border-blue-300 rounded-lg shadow-md bg-white min-h-[60vh] flex flex-col";

  return (
    <div className="min-h-screen text-gray-800 p-4 sm:p-6 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-600 tracking-tight">Creative Suite</h1>
        <p className="text-lg text-gray-600 mt-2">Your AI-powered space to draw, paint, and tell stories.</p>
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
            {activeTab === 'draw' && <DrawColumn onRecognize={handleRecognizeDrawing} isLoading={isRecognizing} recognizedText={recognizedObject} error={error}/>}
            {activeTab === 'paint' && <PaintColumn coloringPageImage={coloringPageImage} isLoading={isGenerating} recognizedText={recognizedObject} error={error}/>}
            {activeTab === 'story' && <StoryColumn />}
          </div>
        </div>

        {/* Desktop Side-by-Side View */}
        <div className="hidden md:grid md:grid-cols-3 md:gap-6">
          <div className={commonColumnClasses}>
            <DrawColumn onRecognize={handleRecognizeDrawing} isLoading={isRecognizing} recognizedText={recognizedObject} error={error}/>
          </div>
          <div className={commonColumnClasses}>
            <PaintColumn coloringPageImage={coloringPageImage} isLoading={isGenerating} recognizedText={recognizedObject} error={error}/>
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
