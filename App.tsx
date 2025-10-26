import React, { useState, useEffect } from 'react';
import DrawColumn from './components/DrawColumn';
import PaintColumn from './components/PaintColumn';
import StoryColumn from './components/StoryColumn';
import { recognizeImage, generateColoringPage, generateStory, generateSpeech, generateStoryImage } from './api';

// Icon components moved here for use in the mobile tab bar
const BrushIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
  </svg>
);

const PaletteIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

const BookIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);


type Tab = 'draw' | 'paint' | 'story';

const TABS: { id: Tab; label: string; icon: React.FC<{className?: string}>; iconColor: string; }[] = [
  { id: 'draw', label: 'Draw', icon: BrushIcon, iconColor: 'text-blue-500' },
  { id: 'paint', label: 'Paint', icon: PaletteIcon, iconColor: 'text-indigo-500' },
  { id: 'story', label: 'Story', icon: BookIcon, iconColor: 'text-emerald-500' },
];

const TAB_STYLING: Record<Tab, { bg: string; border: string }> = {
  draw: { bg: 'bg-blue-50', border: 'border-blue-200' },
  paint: { bg: 'bg-indigo-50', border: 'border-indigo-200' },
  story: { bg: 'bg-emerald-50', border: 'border-emerald-200' },
};

/**
 * A robust function to play a sound using the Web Audio API.
 * It fetches the sound file, decodes it, and plays it through an AudioContext.
 * @param soundUrl The URL of the sound file to play.
 */
const playSound = async (soundUrl: string) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Autoplay policies require the audio context to be resumed after user interaction.
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    const response = await fetch(soundUrl);
    if (!response.ok) {
      throw new Error(`Could not fetch sound file: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);

    // Clean up the context after the sound has finished playing.
    source.onended = () => {
      audioContext.close().catch(e => console.error("Error closing audio context", e));
    };
  } catch (e) {
    console.error(`Audio playback failed for ${soundUrl}:`, e);
  }
};


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('draw');
  const [recognizedObject, setRecognizedObject] = useState<string | null>(null);
  const [coloringPageImage, setColoringPageImage] = useState<string | null>(null);
  const [originalDrawingImage, setOriginalDrawingImage] = useState<string | null>(null);
  const [coloredImage, setColoredImage] = useState<string | null>(null); // For story animation
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);

  // Story state lifted from StoryColumn
  const [story, setStory] = useState<string | null>(null);
  const [storyImage, setStoryImage] = useState<string | null>(null);
  const [speechData, setSpeechData] = useState<string | null>(null);
  const [isWritingStory, setIsWritingStory] = useState(false);
  const [storyError, setStoryError] = useState<string | null>(null);
  const [storyTheme, setStoryTheme] = useState<string | null>(null);

  const handleRecognizeDrawing = async (base64ImageData: string) => {
    setIsRecognizing(true);
    setRecognizedObject(null);
    setColoringPageImage(null);
    setOriginalDrawingImage(base64ImageData);
    setDrawError(null);
    setStory(null); // Clear old story
    setStoryImage(null);
    setSpeechData(null);
    setStoryError(null);
    setStoryTheme(null); // Clear theme on new drawing
    setColoredImage(null); // Clear colored image for animation
    try {
      const text = await recognizeImage(base64ImageData);
      setRecognizedObject(text);
      await playSound('/winSound.mp3');
    } catch (err: any) {
      console.error("Recognition failed:", err);
      setDrawError(err.message || "Sorry, I couldn't recognize that drawing. Please try again.");
    } finally {
      setIsRecognizing(false);
    }
  };

  useEffect(() => {
    if (!recognizedObject) return;

    const generatePage = async () => {
      setIsGenerating(true);
      setDrawError(null);
      try {
        const imageUrl = await generateColoringPage(recognizedObject);
        setColoringPageImage(imageUrl);
        await playSound('/winSound.mp3');
        setActiveTab('paint'); // Auto-switch to paint tab
      } catch (err: any) {
        console.error("Image generation failed:", err);
        setDrawError(err.message || `Sorry, I couldn't create a coloring page for "${recognizedObject}".`);
      } finally {
        setIsGenerating(false);
      }
    };

    generatePage();
  }, [recognizedObject]);
  
  const handleStartWriting = async (coloredImageData: string | null) => {
    if (!recognizedObject || !storyTheme) return;
    setIsWritingStory(true);
    setStoryError(null);
    setStory(null);
    setStoryImage(null);
    setSpeechData(null);
    setColoredImage(coloredImageData);

    try {
      const storyText = await generateStory(recognizedObject, storyTheme);
      setStory(storyText);
      setActiveTab('story');

      // Generate image and speech in parallel
      const [imageUrl, audioData] = await Promise.all([
        generateStoryImage(recognizedObject, storyTheme),
        generateSpeech(storyText)
      ]);

      setStoryImage(imageUrl);
      setSpeechData(audioData);
      
      await playSound('/winSound.mp3');
    } catch (err: any) {
      console.error("Story generation process failed:", err);
      setStoryError(err.message || "I'm sorry, I couldn't create the full story experience. Please try again.");
    } finally {
      setIsWritingStory(false);
    }
  };


  const commonColumnClasses = "p-4 border rounded-lg shadow-md min-h-[60vh] flex flex-col";

  const components: Record<Tab, React.ReactNode> = {
    draw : <DrawColumn onRecognize={handleRecognizeDrawing} isLoading={isRecognizing} isGenerating={isGenerating} recognizedText={recognizedObject} error={drawError} onPlaySound={playSound} />,
    paint: <PaintColumn coloringPageImage={coloringPageImage} originalDrawingImage={originalDrawingImage} isLoading={isGenerating} recognizedText={recognizedObject} error={drawError} onStartStory={handleStartWriting} isWritingStory={isWritingStory} selectedTheme={storyTheme} onThemeChange={setStoryTheme} />,
    story: <StoryColumn recognizedText={recognizedObject} story={story} storyImage={storyImage} speechData={speechData} isWritingStory={isWritingStory} storyError={storyError} onStartStory={() => handleStartWriting(null)} originalDrawingImage={originalDrawingImage} coloredImage={coloredImage} />
  };

  return (
    <div className="min-h-screen text-stone-800 p-2 sm:p-4">
      <header className="text-center mb-1">
        <h3 className="text-2xl md:text-2xl font-bold text-blue-600 tracking-tight">Creative Suite</h3>
        <p className="text-lg text-stone-600 mt-1">AI space to draw, paint and tell stories.</p>
      </header>

      <main>
        {/* Mobile Tabbed View Controls */}
        <div className="md:hidden">
          <div className="flex border-b border-blue-200 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-2 font-semibold text-center transition-colors duration-300 ease-in-out text-sm sm:text-base flex items-center justify-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-stone-500 hover:text-blue-500 hover:bg-blue-50/50'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${tab.iconColor}`} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Unified Content Area for Mobile and Desktop */}
        <div className="flex flex-col md:grid md:grid-cols-3 md:gap-4">
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
