import React, { useState, useEffect, useRef } from 'react';
import { generateStory, generateSpeech } from '../api';

const BookIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const SpeakerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

// --- Audio Helper Functions from Gemini Docs ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
// --- End Audio Helper Functions ---

interface StoryColumnProps {
  recognizedText: string | null;
}

const StoryColumn: React.FC<StoryColumnProps> = ({ recognizedText }) => {
  const [story, setStory] = useState<string | null>(null);
  const [displayedStory, setDisplayedStory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (!story) return;
    setDisplayedStory('');
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < story.length) {
        setDisplayedStory(prev => prev + story.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 25);
    return () => clearInterval(typingInterval);
  }, [story]);

  const handleStartWriting = async () => {
    if (!recognizedText) return;
    setIsLoading(true);
    setError(null);
    setStory(null);
    setDisplayedStory('');
    setAudioBuffer(null);

    try {
      const storyText = await generateStory(recognizedText);
      setStory(storyText);
    } catch (err: any) {
      console.error("Story generation failed:", err);
      setError(err.message || "I'm sorry, I couldn't write a story right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (buffer: AudioBuffer) => {
      if (!audioContextRef.current) return;
      
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.volume = 0.1;
        backgroundMusicRef.current.currentTime = 0;
        backgroundMusicRef.current.play();
      }

      setIsPlaying(true);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
        setIsPlaying(false);
        if (backgroundMusicRef.current) {
          backgroundMusicRef.current.pause();
        }
      };
      source.start();
  };

  const handleReadStory = async () => {
    if (!story || isPlaying || isReading) return;

    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    if (audioBuffer) {
        playAudio(audioBuffer);
        return;
    }

    setIsReading(true);
    setError(null);
    try {
      const base64Audio = await generateSpeech(story);
      if (base64Audio) {
        const decodedBytes = decode(base64Audio);
        const buffer = await decodeAudioData(decodedBytes, audioContextRef.current, 24000, 1);
        setAudioBuffer(buffer);
        playAudio(buffer);
      } else {
        throw new Error("No audio data received.");
      }
    } catch (err: any) {
        console.error("Audio generation failed:", err);
        setError(err.message || "Sorry, I couldn't read the story aloud.");
    } finally {
        setIsReading(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center h-full">
        <audio ref={backgroundMusicRef} src="/pianoSound.mp3" loop />
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
                    <p className="text-gray-700 whitespace-pre-wrap font-serif text-lg leading-relaxed">{displayedStory}{displayedStory === story ? '' : <span className="inline-block w-2 h-5 bg-emerald-600 animate-pulse ml-1"></span>}</p>
                </div>
            ) : (
                <p className="text-gray-600">
                    {recognizedText 
                        ? `Ready to write a story about a ${recognizedText}?` 
                        : "Draw something on the 'Draw' tab, and I'll write a story about it!"}
                </p>
            )}
        </div>

        <div className="mt-6 flex gap-4 items-center justify-center">
            {story && (
                <button
                    onClick={handleReadStory}
                    disabled={isReading || isPlaying || isLoading}
                    className="bg-blue-500 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-blue-300 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center w-36"
                >
                    {isReading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                        <>
                            <SpeakerIcon className="h-5 w-5 mr-2" />
                            <span>{isPlaying ? 'Playing...' : 'Read Story'}</span>
                        </>
                    )}
                </button>
            )}
            <button 
                onClick={handleStartWriting}
                disabled={!recognizedText || isLoading || isReading}
                className="bg-emerald-500 text-white font-bold py-2 px-6 rounded-full hover:bg-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-emerald-300 disabled:scale-100 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Writing...' : story ? 'Write Another' : 'Start Writing'}
            </button>
        </div>
    </div>
  );
};

export default StoryColumn;