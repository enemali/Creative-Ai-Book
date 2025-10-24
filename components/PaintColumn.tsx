import React, { useRef, useState, useEffect } from 'react';

const PaletteIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

interface PaintColumnProps {
  coloringPageImage: string | null;
  isLoading: boolean;
  recognizedText: string | null;
  error: string | null;
}

const LoadingSpinner: React.FC = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
);

const COLORS = [
  '#FFFFFF', '#C1C1C1', '#EF130B', '#FF7100', '#FFE400', '#00CC00',
  '#00B2FF', '#231FD3', '#A300BA', '#D37CAA', '#A0522D', '#000000',
];


const PaintColumn: React.FC<PaintColumnProps> = ({ coloringPageImage, isLoading, recognizedText, error }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[11]); // Default to black

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context && coloringPageImage) {
      const image = new Image();
      image.crossOrigin = 'anonymous'; 
      image.src = coloringPageImage;
      image.onload = () => {
        // Determine the best fit size for the canvas within the container
        const maxWidth = canvas.parentElement?.clientWidth || 300;
        const maxHeight = window.innerHeight * 0.5; // 50% of viewport height
        const ratio = Math.min(maxWidth / image.width, maxHeight / image.height);
        
        canvas.width = image.width;
        canvas.height = image.height;

        // Set display size
        canvas.style.width = `${image.width * ratio}px`;
        canvas.style.height = `${image.height * ratio}px`;

        context.drawImage(image, 0, 0);
      };
      image.onerror = (err) => {
          console.error("Failed to load image onto canvas", err);
      }
    }
  }, [coloringPageImage]);

  const hexToRgb = (hex: string): { r: number; g: number; b: number; a: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
          a: 255,
        }
      : { r: 0, g: 0, b: 0, a: 255 };
  };

  const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColorRgb: { r: number, g: number, b: number, a: number }) => {
    const { width, height } = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const visited = new Uint8Array(width * height);

    const getPixelIndex = (x: number, y: number) => (y * width + x) * 4;

    const startIdx = getPixelIndex(startX, startY);
    const startColor = { r: data[startIdx], g: data[startIdx + 1], b: data[startIdx + 2] };

    if (startColor.r < 128 && startColor.g < 128 && startColor.b < 128) return;
    if (startColor.r === fillColorRgb.r && startColor.g === fillColorRgb.g && startColor.b === fillColorRgb.b) return;

    const queue: [number, number][] = [[startX, startY]];

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const visitedIndex = y * width + x;
      if (visited[visitedIndex] === 1) continue;

      const idx = getPixelIndex(x, y);
      const currentColor = { r: data[idx], g: data[idx + 1], b: data[idx + 2] };

      const colorMatch = Math.abs(currentColor.r - startColor.r) < 20 &&
                         Math.abs(currentColor.g - startColor.g) < 20 &&
                         Math.abs(currentColor.b - startColor.b) < 20;

      if (colorMatch) {
        data[idx] = fillColorRgb.r;
        data[idx + 1] = fillColorRgb.g;
        data[idx + 2] = fillColorRgb.b;
        data[idx + 3] = 255;
        visited[visitedIndex] = 1;

        queue.push([x + 1, y]);
        queue.push([x - 1, y]);
        queue.push([x, y + 1]);
        queue.push([x, y - 1]);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);
    
    floodFill(context, x, y, hexToRgb(selectedColor));
  };
  
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas && recognizedText) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `my-${recognizedText}-creation.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col items-center text-center h-full">
        <PaletteIcon />
        <h2 className="text-2xl font-bold mt-4 mb-2 text-indigo-700">Paint</h2>
        
        <div className="flex-grow flex flex-col justify-center items-center w-full min-h-[250px]">
            {isLoading && (
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-600">Generating a coloring page for your "{recognizedText}"...</p>
                </div>
            )}
            
            <canvas
              ref={canvasRef}
              onClick={handleCanvasClick}
              className={`border rounded-lg shadow-sm my-4 touch-none ${!coloringPageImage || isLoading ? 'hidden' : 'cursor-pointer'}`}
            />
            
            {!isLoading && !coloringPageImage && !error && (
                 <p className="text-gray-600 px-4">
                    After you draw something, a coloring page will appear here!
                 </p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {coloringPageImage && !isLoading && (
            <div className="w-full">
              <div className="mb-4">
                  <p className="text-gray-600 font-semibold mb-2">Choose a color</p>
                  <div className="flex flex-wrap justify-center gap-2 px-2">
                      {COLORS.map(color => (
                          <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={`w-8 h-8 rounded-full border-2 transition-transform duration-150 ${selectedColor === color ? 'border-blue-500 scale-125' : 'border-gray-300 hover:scale-110'}`}
                              style={{ backgroundColor: color }}
                              aria-label={`Select color ${color}`}
                          />
                      ))}
                  </div>
              </div>
              <button
                  onClick={handleDownload}
                  className="mt-2 bg-indigo-500 text-white font-bold py-2 px-6 rounded-full hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                  Download Your Creation
              </button>
            </div>
        )}
    </div>
  );
};

export default PaintColumn;