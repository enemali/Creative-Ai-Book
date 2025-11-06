import React, { useRef, useState, useEffect } from 'react';

const BrushModeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
    </svg>
);

const FillModeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M14.53 11.47L12 14l-2.53-2.53a.75.75 0 011.06-1.06L12 11.88l1.47-1.47a.75.75 0 011.06 1.06z" />
        <path fillRule="evenodd" d="M4.912 4.912a7.5 7.5 0 0110.606 0c2.812 2.812 3.12 7.422.91 10.638a.75.75 0 01-1.25-.794 6 6 0 00-.728-9.305 6 6 0 00-8.486 0 6 6 0 00-.728 9.305.75.75 0 01-1.25.794A7.472 7.472 0 014 15.518C1.79 12.302 2.1 7.724 4.912 4.912zM12 21a.75.75 0 01-.75-.75v-3.692a.75.75 0 011.5 0v3.692A.75.75 0 0112 21z" clipRule="evenodd" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const BookIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

// Theme Icons
const HealthIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>;
const ScienceIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a.75.75 0 01.75.75V4h4.5V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0116.75 6.75v8.5A2.75 2.75 0 0114 18H6a2.75 2.75 0 01-2.75-2.75v-8.5A2.75 2.75 0 016 .25h.25V2.75A.75.75 0 017 2zM6.5 6.75v8.5a1.25 1.25 0 001.25 1.25h5.5a1.25 1.25 0 001.25-1.25v-8.5H6.5z" clipRule="evenodd" /></svg>;
const SpookyIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6z" /><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-1.414 1.414a1 1 0 01-1.414-1.414l1.414-1.414a1 1 0 011.414 0zM5.293 16.707a1 1 0 010-1.414l1.414-1.414a1 1 0 111.414 1.414l-1.414 1.414a1 1 0 01-1.414 0zM15.293 16.707a1 1 0 01-1.414 0l-1.414-1.414a1 1 0 011.414-1.414l1.414 1.414a1 1 0 010 1.414zM6.707 6.707a1 1 0 011.414 0l-1.414 1.414a1 1 0 11-1.414-1.414l1.414-1.414z" clipRule="evenodd" /></svg>;
const FamilyIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" /></svg>;
const HonestyIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 0110 15zM4.093 4.093a.75.75 0 011.06 0l1.415 1.415a.75.75 0 11-1.06 1.06L4.093 5.153a.75.75 0 010-1.06zm9.754 9.754a.75.75 0 010 1.06l-1.414 1.414a.75.75 0 11-1.06-1.06l1.414-1.414a.75.75 0 011.06 0zM15.907 4.093a.75.75 0 010 1.06l-1.414 1.415a.75.75 0 11-1.06-1.06l1.414-1.414a.75.75 0 011.06 0zm-9.754 9.754a.75.75 0 011.06 0l1.414-1.414a.75.75 0 11-1.06-1.06l-1.414 1.414a.75.75 0 010 1.06z" clipRule="evenodd" /></svg>;

const THEMES = [
    { id: 'health', label: 'Health', Icon: HealthIcon, color: 'text-red-500', bg: 'bg-red-100' },
    { id: 'science', label: 'Science', Icon: ScienceIcon, color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'spooky', label: 'Spooky', Icon: SpookyIcon, color: 'text-purple-500', bg: 'bg-purple-100' },
    { id: 'family', label: 'Family', Icon: FamilyIcon, color: 'text-green-500', bg: 'bg-green-100' },
    { id: 'honesty', label: 'Honesty', Icon: HonestyIcon, color: 'text-yellow-500', bg: 'bg-yellow-100' },
];

interface PaintColumnProps {
  coloringPageImage: string | null;
  originalDrawingImage: string | null;
  coloredImage: string | null;
  isLoading: boolean;
  recognizedText: string | null;
  error: string | null;
  onStartStory: (coloredImageData: string | null) => void;
  isWritingStory: boolean;
  selectedTheme: string | null;
  onThemeChange: (theme: string) => void;
}

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
  '#00FFFF', '#FFA500', '#800080', '#4B0082', '#A52A2A', '#FFFFFF'
];

// Helper to draw an image on a canvas while maintaining aspect ratio
const drawImageWithAspectRatio = (ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLCanvasElement) => {
    const canvas = ctx.canvas;
    const { width, height } = canvas;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    if (img.width === 0 || img.height === 0) return;

    const imgAspectRatio = img.width / img.height;
    const canvasAspectRatio = width / height;

    let drawWidth, drawHeight, drawX, drawY;

    if (imgAspectRatio > canvasAspectRatio) {
        drawWidth = width;
        drawHeight = width / imgAspectRatio;
        drawX = 0;
        drawY = (height - drawHeight) / 2;
    } else {
        drawHeight = height;
        drawWidth = height * imgAspectRatio;
        drawY = 0;
        drawX = (width - drawWidth) / 2;
    }
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
};

const PaintColumn: React.FC<PaintColumnProps> = ({ coloringPageImage, originalDrawingImage, coloredImage, isLoading, recognizedText, onStartStory, isWritingStory, selectedTheme, onThemeChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [paintMode, setPaintMode] = useState<'brush' | 'fill'>('fill');

  const getContext = () => canvasRef.current?.getContext('2d', { willReadFrequently: true });
  
  const hexToRgba = (hex: string): [number, number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16),
            255, // alpha
          ]
        : [0, 0, 0, 255]; // default to black
  };

  const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: [number, number, number, number]) => {
      const { width, height } = ctx.canvas;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      const getPixelIndex = (x: number, y: number) => (y * width + x) * 4;

      const startIdx = getPixelIndex(startX, startY);
      const targetColor = [data[startIdx], data[startIdx + 1], data[startIdx + 2], data[startIdx + 3]];

      if (targetColor.every((val, i) => val === fillColor[i])) return;

      const colorDistanceSquared = (c1_idx: number, c2: number[]) => {
          const r = data[c1_idx] - c2[0];
          const g = data[c1_idx + 1] - c2[1];
          const b = data[c1_idx + 2] - c2[2];
          const a = data[c1_idx + 3] - c2[3];
          return r * r + g * g + b * b + a * a;
      };

      const tolerance = 80;
      const toleranceSq = tolerance * tolerance;
      
      if (targetColor[0] < 128 && targetColor[1] < 128 && targetColor[2] < 128) return;

      const queue: [number, number][] = [[startX, startY]];
      const visited = new Uint8Array(width * height);
      visited[startY * width + startX] = 1;
      
      let head = 0;
      while(head < queue.length) {
          const [x, y] = queue[head++];
          const idx = getPixelIndex(x, y);

          data[idx] = fillColor[0];
          data[idx + 1] = fillColor[1];
          data[idx + 2] = fillColor[2];
          data[idx + 3] = fillColor[3];

          const neighbors: [number, number][] = [
              [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
          ];

          for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                  const neighborVisitIdx = ny * width + nx;
                  if (visited[neighborVisitIdx] === 0) {
                      visited[neighborVisitIdx] = 1;
                      const neighborPixelIdx = getPixelIndex(nx, ny);
                      if (colorDistanceSquared(neighborPixelIdx, targetColor) <= toleranceSq) {
                          queue.push([nx, ny]);
                      }
                  }
              }
          }
      }
      ctx.putImageData(imageData, 0, 0);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = new Image();
    const imageToLoad = coloredImage || coloringPageImage;

    const initialDraw = () => {
        if (!canvas || !imageToLoad || !image.complete) return;
        const context = getContext();
        if (!context) return;
        
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        
        drawImageWithAspectRatio(context, image);
    };

    if (imageToLoad) {
        image.src = imageToLoad;
        image.onload = initialDraw;
        if (image.complete) initialDraw(); // Handle cached images
    } else {
        // Clear canvas if no image
        const context = getContext();
        if (context) {
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;

            if (width === 0 || height === 0 || (canvas.width === width && canvas.height === height)) {
                continue;
            }

            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            if (tempCtx) {
                const hasContentToPreserve = canvas.width > 0 && canvas.height > 0;
                
                if (hasContentToPreserve) {
                    tempCanvas.width = canvas.width;
                    tempCanvas.height = canvas.height;
                    tempCtx.drawImage(canvas, 0, 0);
                }
                
                canvas.width = width;
                canvas.height = height;

                const ctx = getContext();
                if (ctx) {
                    if (hasContentToPreserve) {
                        drawImageWithAspectRatio(ctx, tempCanvas);
                    } else {
                        if (imageToLoad && image.complete) {
                           drawImageWithAspectRatio(ctx, image);
                        } else {
                           ctx.fillStyle = 'white';
                           ctx.fillRect(0, 0, width, height);
                        }
                    }
                }
            }
        }
    });

    resizeObserver.observe(canvas);

    return () => {
        resizeObserver.disconnect();
        image.onload = null;
    };
}, [coloringPageImage, coloredImage]);


  const startPainting = (event: React.MouseEvent | React.TouchEvent) => {
    const { offsetX, offsetY } = getCoords(event);
    const context = getContext();
    if (!context) return;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    context.strokeStyle = currentColor;
    context.lineWidth = brushSize;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    setIsPainting(true);
  };

  const paint = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isPainting) return;
    const { offsetX, offsetY } = getCoords(event);
    const context = getContext();
    if (!context) return;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopPainting = () => {
    const context = getContext();
    if (!context) return;
    context.closePath();
    setIsPainting(false);
  };

  const handleFill = (event: React.MouseEvent | React.TouchEvent) => {
    const context = getContext();
    if (!context) return;
    const { offsetX, offsetY } = getCoords(event);
    const fillColorRgba = hexToRgba(currentColor);
    floodFill(context, Math.floor(offsetX), Math.floor(offsetY), fillColorRgba);
  };

  const getCoords = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in event) {
        return {
            offsetX: event.touches[0].clientX - rect.left,
            offsetY: event.touches[0].clientY - rect.top
        };
    }
    return { offsetX: event.nativeEvent.offsetX, offsetY: event.nativeEvent.offsetY };
  };
  
  const handleResetClick = () => {
    const canvas = canvasRef.current;
    const context = getContext();
    if (canvas && context && coloringPageImage) {
      const img = new Image();
      img.onload = () => {
        drawImageWithAspectRatio(context, img);
      };
      img.src = coloringPageImage;
    }
  };
  
  const handleDownloadClick = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'coloring-masterpiece.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handleCanvasAction = (event: React.MouseEvent | React.TouchEvent) => {
    if (paintMode === 'brush') {
        startPainting(event);
    } else {
        handleFill(event);
    }
  };

  const handleStartStoryClick = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas ? canvas.toDataURL('image/png') : null;
    onStartStory(dataUrl);
  };

  const ActiveThemeIcon = THEMES.find(t => t.id === selectedTheme)?.Icon;


  return (
    <div className="flex flex-col items-center text-center h-full">
      <div className="flex items-center justify-center gap-2 mb-1">
        <h2 className="text-2xl font-bold text-indigo-700">Paint</h2>
      </div>
      {coloringPageImage ? (
        <>
            <p className="text-gray-600 mb-2">Color in the drawing of a {recognizedText || 'creation'}!</p>
            <div className="relative w-full">
              {originalDrawingImage && (
                  <img
                      src={`data:image/png;base64,${originalDrawingImage}`}
                      alt="Original Drawing Preview"
                      className="absolute top-2 left-2 w-16 h-16 rounded-full border-2 border-indigo-300 bg-white shadow-md object-contain"
                  />
              )}
              <canvas
                ref={canvasRef}
                className="w-full aspect-[6/5] border border-gray-300 rounded-lg shadow-inner touch-none bg-white"
                onMouseDown={handleCanvasAction}
                onMouseMove={paintMode === 'brush' ? paint : undefined}
                onMouseUp={paintMode === 'brush' ? stopPainting : undefined}
                onMouseLeave={paintMode === 'brush' ? stopPainting : undefined}
                onTouchStart={handleCanvasAction}
                onTouchMove={paintMode === 'brush' ? paint : undefined}
                onTouchEnd={paintMode === 'brush' ? stopPainting : undefined}
              />
            </div>
            <div className="mt-2 w-full flex flex-col items-center">
              <div className="flex gap-2 p-1 bg-gray-200 rounded-full mb-2">
                  <button onClick={() => setPaintMode('brush')} className={`flex items-center gap-2 py-1.5 px-4 rounded-full text-sm font-semibold transition-colors ${paintMode === 'brush' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}>
                      <BrushModeIcon className="h-5 w-5" />
                      <span>Brush</span>
                  </button>
                    {paintMode === 'brush' && (
                <div className="flex items-center justify-center ">
                    <label htmlFor="brushSize" className="font-semibold text-gray-700">Size:</label>
                    <input
                      type="range"
                      id="brushSize"
                      min="1"
                      max="20"
                      value={brushSize}
                      onChange={(e) => setBrushSize(parseInt(e.target.value))}
                      className="w-32"
                    />
                </div>
              )}
                  <button onClick={() => setPaintMode('fill')} className={`flex items-center gap-2 py-1.5 px-4 rounded-full text-sm font-semibold transition-colors ${paintMode === 'fill' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}>
                      <FillModeIcon className="h-5 w-5" />
                      <span>Fill</span>
                  </button>
              </div>

              <div className="grid grid-cols-12 gap-1 max-w-xs mx-auto mb-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setCurrentColor(color)}
                    className={`w-5 h-5 rounded-full border-2 transition-transform duration-200 ${currentColor === color ? 'border-indigo-500 scale-110' : 'border-gray-200 hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              
                <div className="w-full p-1 bg-indigo-50 border border-indigo-200 rounded-lg mb-1">
                    <p className="font-semibold text-indigo-800 text-sm mb-1">Choose a Story Theme</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {THEMES.map(theme => (
                            <button key={theme.id} onClick={() => onThemeChange(theme.id)} className={`flex items-center gap-1 py-1 px-2 rounded-full text-sm font-semibold transition-all duration-200 border-2 ${selectedTheme === theme.id ? `${theme.bg} ${theme.color} border-current` : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}>
                                <theme.Icon className="h-4 w-4" />
                                <span>{theme.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

              <div className="flex flex-wrap items-center justify-center gap-4 w-full mt-1">
                <button
                  onClick={handleResetClick}
                  className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-full hover:bg-gray-300 transition-all duration-300"
                >
                  Reset
                </button>
                <button
                  onClick={handleDownloadClick}
                  className="bg-indigo-500 text-white font-bold py-2 px-6 rounded-full hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2"
                >
                  <DownloadIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={handleStartStoryClick}
                  disabled={isWritingStory || !recognizedText || !selectedTheme}
                  className="bg-emerald-500 text-white font-bold py-2 px-6 rounded-full hover:bg-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 disabled:bg-emerald-300 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {ActiveThemeIcon ? <ActiveThemeIcon className="h-5 w-5" /> : <BookIcon className="h-5 w-5" />}
                  <span>{isWritingStory ? 'Writing...' : 'Write Story'}</span>
                </button>
              </div>
            </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full flex-grow">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-500"></div>
              <p className="mt-4 text-lg font-semibold text-indigo-700">Creating Page...</p>
            </>
          ) : (
            <div className="text-center text-gray-500">
              <p className="mt-4">Draw something on the 'Draw' tab first.</p>
              <p>Your coloring page will appear here!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaintColumn;