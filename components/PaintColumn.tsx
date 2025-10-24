import React, { useRef, useState, useEffect } from 'react';

const PaletteIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

const BrushModeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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


interface PaintColumnProps {
  coloringPageImage: string | null;
  originalDrawingImage: string | null;
  isLoading: boolean;
  recognizedText: string | null;
  error: string | null;
}

const COLORS = [
  '#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF',
  '#00FFFF', '#FFA500', '#800080', '#4B0082', '#A52A2A', '#FFFFFF'
];

const PaintColumn: React.FC<PaintColumnProps> = ({ coloringPageImage, originalDrawingImage, isLoading, recognizedText }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPainting, setIsPainting] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [paintMode, setPaintMode] = useState<'brush' | 'fill'>('brush');

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
    const context = getContext();
    if (canvas && context && coloringPageImage) {
      const img = new Image();
      img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = coloringPageImage;
    }
  }, [coloringPageImage]);

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
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
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

  return (
    <div className="flex flex-col items-center text-center h-full">
      <PaletteIcon />
      <h2 className="text-2xl font-bold mt-4 mb-2 text-indigo-700">Paint</h2>
      {coloringPageImage ? (
        <>
            <p className="text-gray-600 mb-4">Color in the drawing of a {recognizedText || 'creation'}!</p>
            <div className="relative">
              {originalDrawingImage && (
                  <img
                      src={`data:image/png;base64,${originalDrawingImage}`}
                      alt="Original Drawing Preview"
                      className="absolute top-2 left-2 w-16 h-16 rounded-full border-2 border-indigo-300 bg-white shadow-md object-contain"
                  />
              )}
              <canvas
                ref={canvasRef}
                width="300"
                height="250"
                className="border border-gray-300 rounded-lg shadow-inner touch-none bg-white"
                onMouseDown={handleCanvasAction}
                onMouseMove={paintMode === 'brush' ? paint : undefined}
                onMouseUp={paintMode === 'brush' ? stopPainting : undefined}
                onMouseLeave={paintMode === 'brush' ? stopPainting : undefined}
                onTouchStart={handleCanvasAction}
                onTouchMove={paintMode === 'brush' ? paint : undefined}
                onTouchEnd={paintMode === 'brush' ? stopPainting : undefined}
              />
            </div>
            <div className="mt-4 w-full flex flex-col items-center">
              <div className="flex gap-2 p-1 bg-gray-200 rounded-full mb-4">
                  <button onClick={() => setPaintMode('brush')} className={`flex items-center gap-2 py-1.5 px-4 rounded-full text-sm font-semibold transition-colors ${paintMode === 'brush' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}>
                      <BrushModeIcon className="h-5 w-5" />
                      <span>Brush</span>
                  </button>
                  <button onClick={() => setPaintMode('fill')} className={`flex items-center gap-2 py-1.5 px-4 rounded-full text-sm font-semibold transition-colors ${paintMode === 'fill' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600'}`}>
                      <FillModeIcon className="h-5 w-5" />
                      <span>Fill</span>
                  </button>
              </div>

              <div className="grid grid-cols-6 gap-2 max-w-xs mx-auto mb-4">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setCurrentColor(color)}
                    className={`w-10 h-10 rounded-full border-2 transition-transform duration-200 ${currentColor === color ? 'border-indigo-500 scale-110' : 'border-gray-200 hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
              
              {paintMode === 'brush' && (
                <div className="flex items-center justify-center gap-4 mb-4">
                    <label htmlFor="brushSize" className="font-semibold text-gray-700">Brush Size:</label>
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

              <div className="flex items-center justify-center gap-4 w-full mt-2">
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
                  <span>Download</span>
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
              <PaletteIcon />
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