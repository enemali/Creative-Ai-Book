import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [speechData, setSpeechData] = useState<string | null>(null);
  const [displayedStory, setDisplayedStory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false); // For story text generation
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false); // For speech generation
  const [isReading, setIsReading] = useState(false); // Is speech currently playing
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for audio management
  const musicAudioContextRef = useRef<AudioContext | null>(null);
  const musicGainNodeRef = useRef<GainNode | null>(null);
  const musicBufferRef = useRef<AudioBuffer | null>(null);
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const speechAudioContextRef = useRef<AudioContext | null>(null);
  const speechSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const audioJobIdRef = useRef(0);
  
  // Typing effect for the story text
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

  const stopMusic = useCallback(() => {
    if (musicSourceRef.current && musicAudioContextRef.current && musicGainNodeRef.current) {
        musicGainNodeRef.current.gain.setTargetAtTime(0, musicAudioContextRef.current.currentTime, 0.2);
        setTimeout(() => {
            if (musicSourceRef.current) {
                try {
                    musicSourceRef.current.stop();
                    musicSourceRef.current.disconnect();
                    musicSourceRef.current = null;
                } catch(e) { console.warn("Error stopping music", e); }
            }
        }, 300);
    }
  }, []);
  
  const stopSpeech = useCallback(() => {
    audioJobIdRef.current += 1; // Invalidate any ongoing jobs
    if (speechSourceRef.current) {
        try {
            speechSourceRef.current.stop();
            speechSourceRef.current.disconnect();
            speechSourceRef.current = null;
        } catch(e) { console.warn("Error stopping speech", e); }
    }
    stopMusic();
    setIsReading(false);
  }, [stopMusic]);
  
  const startMusic = useCallback(async (jobId: number) => {
    if (musicSourceRef.current || audioJobIdRef.current !== jobId) return;

    setIsMusicLoading(true);
    setError(null);
    try {
        if (!musicAudioContextRef.current || musicAudioContextRef.current.state === 'closed') {
            musicAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            musicGainNodeRef.current = musicAudioContextRef.current.createGain();
            musicGainNodeRef.current.connect(musicAudioContextRef.current.destination);
        }
        const audioContext = musicAudioContextRef.current;
        await audioContext.resume();

        if (!musicBufferRef.current) {
            const response = await fetch('/pianoSound.mp3');
            if (!response.ok) throw new Error(`Failed to fetch music file: ${response.statusText}`);
            const arrayBuffer = await response.arrayBuffer();
            musicBufferRef.current = await audioContext.decodeAudioData(arrayBuffer);
        }

        if (audioJobIdRef.current !== jobId) return;

        const source = audioContext.createBufferSource();
        source.buffer = musicBufferRef.current;
        source.loop = true;
        source.connect(musicGainNodeRef.current!);
        musicGainNodeRef.current!.gain.value = 0; // Start silent
        source.start();
        musicSourceRef.current = source;
    } catch (err: any) {
        console.error("Failed to load or play music:", err);
        setError(err.message || "Could not play background music.");
    } finally {
        if (audioJobIdRef.current === jobId) {
            setIsMusicLoading(false);
        }
    }
  }, []);

  const handleReadStory = useCallback(async () => {
    if (isReading) {
        stopSpeech();
        return;
    }
    if (!story) return;

    const jobId = ++audioJobIdRef.current;

    const playAudioFromData = async (currentSpeechData: string) => {
        setIsReading(true);
        setError(null);
        try {
            if (jobId !== audioJobIdRef.current) { setIsReading(false); return; }

            await startMusic(jobId);
            if (jobId !== audioJobIdRef.current) { stopMusic(); return; }

            if (!speechAudioContextRef.current || speechAudioContextRef.current.state === 'closed') {
                speechAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const audioContext = speechAudioContextRef.current;
            await audioContext.resume();

            const speechBuffer = await decodeAudioData(decode(currentSpeechData), audioContext, 24000, 1);
            if (jobId !== audioJobIdRef.current) { setIsReading(false); stopMusic(); return; }
            
            if (musicGainNodeRef.current && musicAudioContextRef.current) {
                musicGainNodeRef.current.gain.setTargetAtTime(0.2, musicAudioContextRef.current.currentTime, 0.5);
            }

            const speechSource = audioContext.createBufferSource();
            speechSource.buffer = speechBuffer;
            speechSource.connect(audioContext.destination);
            speechSource.onended = () => {
                if (jobId === audioJobIdRef.current && speechSourceRef.current === speechSource) {
                    stopSpeech();
                }
            };
            speechSourceRef.current = speechSource;
            speechSource.start();

        } catch (err: any) {
            console.error(err);
            if (jobId === audioJobIdRef.current) {
                setError(err.message || "An unknown error occurred while playing audio.");
                stopSpeech();
            }
        }
    };

    if (speechData) {
        await playAudioFromData(speechData);
    } else {
        setIsGeneratingSpeech(true);
        setError(null);
        try {
            const newSpeechData = await generateSpeech(story);
            if (jobId !== audioJobIdRef.current) return;
            setSpeechData(newSpeechData);
            await playAudioFromData(newSpeechData);
        } catch (err: any) {
            console.error(err);
            if (jobId === audioJobIdRef.current) {
                setError(err.message || "Failed to generate speech audio.");
            }
        } finally {
            if (jobId === audioJobIdRef.current) {
                setIsGeneratingSpeech(false);
            }
        }
    }
  }, [story, speechData, isReading, stopSpeech, startMusic, stopMusic]);

  const handleStartWriting = async () => {
    if (!recognizedText) return;
    stopSpeech();
    setIsLoading(true);
    setError(null);
    setStory(null);
    setDisplayedStory('');
    setSpeechData(null);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        stopSpeech();
        if (speechAudioContextRef.current) {
            speechAudioContextRef.current.close().catch(() => {});
        }
        if (musicAudioContextRef.current) {
            musicAudioContextRef.current.close().catch(() => {});
        }
    };
  }, [stopSpeech]);

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
                    disabled={isLoading || isGeneratingSpeech}
                    className="bg-blue-500 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-blue-300 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center w-36"
                >
                    {isGeneratingSpeech || isMusicLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                        <>
                            <SpeakerIcon className="h-5 w-5 mr-2" />
                            <span>{isReading ? 'Stop' : 'Read Story'}</span>
                        </>
                    )}
                </button>
            )}
            <button 
                onClick={handleStartWriting}
                disabled={!recognizedText || isLoading || isReading || isGeneratingSpeech}
                className="bg-emerald-500 text-white font-bold py-2 px-6 rounded-full hover:bg-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-emerald-300 disabled:scale-100 disabled:cursor-not-allowed"
            >
                {isLoading ? 'Writing...' : story ? 'Write Another' : 'Start Writing'}
            </button>
        </div>
    </div>
  );
};

export default StoryColumn;
