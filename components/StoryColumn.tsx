import React, { useState, useEffect, useRef, useCallback } from 'react';

const SpeakerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
  story: string | null;
  storyImage: string | null;
  speechData: string | null;
  isWritingStory: boolean;
  storyError: string | null;
  onStartStory: () => void;
  originalDrawingImage: string | null;
  coloredImage: string | null;
}

const StoryColumn: React.FC<StoryColumnProps> = ({ recognizedText, story, storyImage, speechData, isWritingStory, storyError, onStartStory, originalDrawingImage, coloredImage }) => {
  const [displayedStory, setDisplayedStory] = useState<string>('');
  const [isReading, setIsReading] = useState(false);
  const [isMusicLoading, setIsMusicLoading] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Refs for audio management
  const musicAudioContextRef = useRef<AudioContext | null>(null);
  const musicGainNodeRef = useRef<GainNode | null>(null);
  const musicBufferRef = useRef<AudioBuffer | null>(null);
  const musicSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const speechAudioContextRef = useRef<AudioContext | null>(null);
  const speechSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const audioJobIdRef = useRef(0);
  const storyContentContainerRef = useRef<HTMLDivElement>(null);

  // Typing effect and state reset
  useEffect(() => {
    if (!story) {
      setDisplayedStory('');
      return;
    };
    
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
    setSpeechError(null);
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
        setSpeechError(err.message || "Could not play background music.");
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
    if (!speechData) {
        setSpeechError("The audio for this story isn't ready yet.");
        return;
    }

    const jobId = ++audioJobIdRef.current;
    setIsReading(true);
    setSpeechError(null);

    try {
        if (jobId !== audioJobIdRef.current) { setIsReading(false); return; }

        await startMusic(jobId);
        if (jobId !== audioJobIdRef.current) { stopMusic(); return; }

        if (!speechAudioContextRef.current || speechAudioContextRef.current.state === 'closed') {
            speechAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const audioContext = speechAudioContextRef.current;
        await audioContext.resume();

        const speechBuffer = await decodeAudioData(decode(speechData), audioContext, 24000, 1);
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
            setSpeechError(err.message || "An unknown error occurred while playing audio.");
            stopSpeech();
        }
    }
  }, [speechData, isReading, stopSpeech, startMusic, stopMusic]);

  const handleWriteAnother = () => {
    stopSpeech();
    onStartStory();
  };

  const handleDownloadStory = async () => {
        const container = storyContentContainerRef.current;
        if (!container || !storyImage || !story) {
            console.error("Download failed: missing required content.");
            return;
        }

        const imageEl = container.querySelector('img');
        const textContainerEl = container.querySelector('div[class*="overflow-y-auto"]');
        if (!imageEl || !textContainerEl) {
            console.error("Download failed: could not find required elements in the DOM.");
            return;
        }

        try {
            const { width, height } = container.getBoundingClientRect();
            const scale = 2; // for higher resolution
            const canvas = document.createElement('canvas');
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.scale(scale, scale);

            const img = new Image();
            img.onload = () => {
                // Get styles and dimensions
                const containerStyles = window.getComputedStyle(container);
                const textEl = textContainerEl.querySelector('p');
                if (!textEl) return;
                const textStyles = window.getComputedStyle(textEl);
                const textContainerStyles = window.getComputedStyle(textContainerEl);
                const imageContainerEl = imageEl.parentElement!;
                const imageContainerStyles = window.getComputedStyle(imageContainerEl);
                const containerRect = container.getBoundingClientRect();
                const imageContainerRect = imageContainerEl.getBoundingClientRect();
                const textContainerRect = textContainerEl.getBoundingClientRect();

                const imgX = imageContainerRect.left - containerRect.left;
                const imgY = imageContainerRect.top - containerRect.top;
                const imgW = imageContainerRect.width;
                const imgH = imageContainerRect.height;

                const textX = textContainerRect.left - containerRect.left;
                const textY = textContainerRect.top - containerRect.top;
                const textW = textContainerRect.width;
                const textH = textContainerRect.height;
                const textPadding = parseFloat(textContainerStyles.paddingLeft);

                // Draw backgrounds
                ctx.fillStyle = containerStyles.backgroundColor || 'white';
                ctx.fillRect(0, 0, width, height);
                
                const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
                    if (w < 2 * r) r = w / 2;
                    if (h < 2 * r) r = h / 2;
                    ctx.beginPath();
                    ctx.moveTo(x + r, y);
                    ctx.arcTo(x + w, y, x + w, y + h, r);
                    ctx.arcTo(x + w, y + h, x, y + h, r);
                    ctx.arcTo(x, y + h, x, y, r);
                    ctx.arcTo(x, y, x + w, y, r);
                    ctx.closePath();
                    return ctx;
                };

                ctx.fillStyle = textContainerStyles.backgroundColor || 'white';
                drawRoundedRect(textX, textY, textW, textH, parseFloat(textContainerStyles.borderRadius)).fill();

                // Draw image with clip path for border-radius and object-fit: cover logic
                ctx.save();
                drawRoundedRect(imgX, imgY, imgW, imgH, parseFloat(imageContainerStyles.borderRadius)).clip();
                
                const imgRatio = img.width / img.height;
                const containerRatio = imgW / imgH;
                let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

                if (imgRatio > containerRatio) { // Image is wider than its container
                    sWidth = img.height * containerRatio;
                    sx = (img.width - sWidth) / 2;
                } else { // Image is taller or has same aspect ratio
                    sHeight = img.width / containerRatio;
                    sy = (img.height - sHeight) / 2;
                }
                ctx.drawImage(img, sx, sy, sWidth, sHeight, imgX, imgY, imgW, imgH);
                ctx.restore();

                // Draw text
                ctx.fillStyle = textStyles.color;
                ctx.font = `${textStyles.fontWeight} ${textStyles.fontSize} ${textStyles.fontFamily}`;
                ctx.textBaseline = 'top';

                const wrapText = (context: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
                    const paragraphs = text.split('\n');
                    let currentY = y;
                    for (const paragraph of paragraphs) {
                        const words = paragraph.split(' ');
                        let line = '';
                        for (let n = 0; n < words.length; n++) {
                            const testLine = line + words[n] + ' ';
                            const metrics = context.measureText(testLine);
                            const testWidth = metrics.width;
                            if (testWidth > maxWidth && n > 0) {
                                context.fillText(line, x, currentY);
                                line = words[n] + ' ';
                                currentY += lineHeight;
                            } else {
                                line = testLine;
                            }
                        }
                        context.fillText(line, x, currentY);
                        currentY += lineHeight;
                    }
                };
                
                const lineHeight = parseFloat(textStyles.lineHeight) || (parseFloat(textStyles.fontSize) * 1.2);
                wrapText(ctx, story, textX + textPadding, textY + textPadding, textW - (textPadding * 2), lineHeight);

                // Trigger download
                const pngUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = `story-${recognizedText?.replace(/\s+/g, '-') || 'creation'}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                URL.revokeObjectURL(img.src);
            };

            img.onerror = () => {
                console.error("Failed to load image for download.");
                URL.revokeObjectURL(img.src);
            };
            
            fetch(storyImage)
                .then(res => res.blob())
                .then(blob => {
                    img.src = URL.createObjectURL(blob);
                })
                .catch(e => console.error("Could not fetch image for download canvas:", e));

        } catch (error) {
            console.error("An error occurred during story download:", error);
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
        <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-emerald-700">Story</h2>
        </div>
        
        <div ref={storyContentContainerRef} className="flex-grow w-full flex flex-col items-center justify-center mt-2 relative">
            {isReading && originalDrawingImage && coloredImage && (
              <div className="absolute inset-0 pointer-events-none z-20">
                  <div 
                    className="absolute top-2 left-2 w-24 h-24 rounded-full border-4 border-white shadow-xl bg-cover bg-center"
                    style={{ backgroundImage: `url(data:image/png;base64,${originalDrawingImage})` }}
                  ></div>
                  <div 
                    className="absolute top-2 right-2 w-24 h-24 rounded-full border-4 border-white shadow-xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${coloredImage})` }}
                  ></div>
              </div>
            )}
            
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                {isWritingStory ? (
                    <>
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-200 border-t-emerald-500"></div>
                        <p className="mt-4 text-lg font-semibold text-emerald-700">Crafting your story...</p>
                    </>
                ) : storyError ? (
                    <p className="text-sm text-red-500">{storyError}</p>
                ) : story ? (
                    <div className="w-full h-full flex flex-col">
                        <>
                          {storyImage ? (
                              <div className="flex-[2_1_0%] min-h-0 mb-2 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                  <img src={storyImage} alt={`Illustration for a story about a ${recognizedText}`} className="w-full h-full object-cover" />
                              </div>
                          ) : (
                              <div className="flex-[2_1_0%] min-h-0 mb-2 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                                  <p className="text-gray-400 text-sm">Illustration loading...</p>
                              </div>
                          )}
                          <div className="flex-1 min-h-0 w-full text-left p-2 bg-white rounded-lg overflow-y-auto border border-gray-200">
                              <p className="text-gray-700 whitespace-pre-wrap font-serif text-base leading-relaxed">{displayedStory}{displayedStory === story ? '' : <span className="inline-block w-2 h-4 bg-emerald-600 animate-pulse ml-1"></span>}</p>
                          </div>
                        </>
                    </div>
                ) : (
                    <p className="text-gray-600">
                        {recognizedText 
                            ? `Go to the 'Paint' tab to write a story about a ${recognizedText}!` 
                            : "Draw something, then create a story!"}
                    </p>
                )}
            </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 items-center justify-center">
            {story && (
                <button
                    onClick={handleReadStory}
                    disabled={isWritingStory || !speechData || !coloredImage}
                    className="bg-blue-500 text-white font-bold py-2 px-4 rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-blue-300 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center w-36"
                >
                    {isMusicLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    ) : (
                        <>
                            <SpeakerIcon className="h-5 w-5 mr-2" />
                            <span>{isReading ? 'Stop' : 'Read Story'}</span>
                        </>
                    )}
                </button>
            )}
             {story && (
                <button
                    onClick={handleDownloadStory}
                    disabled={isWritingStory || isReading}
                    className="bg-indigo-500 text-white font-bold p-3 rounded-full hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-indigo-300 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center"
                    title="Download Story Image"
                    aria-label="Download Story Image"
                >
                    <DownloadIcon className="h-5 w-5" />
                </button>
            )}
            {story && recognizedText && (
              <button 
                  onClick={handleWriteAnother}
                  disabled={!recognizedText || isWritingStory || isReading}
                  className="bg-emerald-500 text-white font-bold py-2 px-6 rounded-full hover:bg-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-emerald-300 disabled:scale-100 disabled:cursor-not-allowed"
              >
                  {isWritingStory ? 'Writing...' : 'Write Another'}
              </button>
            )}
        </div>
        {speechError && <p className="text-sm text-red-500 mt-2">{speechError}</p>}
    </div>
  );
};

export default StoryColumn;