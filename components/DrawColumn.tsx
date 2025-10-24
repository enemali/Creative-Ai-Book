
import React, { useRef, useState, useEffect } from 'react';

const BrushIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
  </svg>
);

interface DrawColumnProps {
  onRecognize: (base64ImageData: string) => void;
  isLoading: boolean;
  recognizedText: string | null;
  error: string | null;
}

const DrawColumn: React.FC<DrawColumnProps> = ({ onRecognize, isLoading, recognizedText, error }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getContext = () => canvasRef.current?.getContext('2d');

  useEffect(() => {
    const context = getContext();
    if (context) {
      context.fillStyle = "white";
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
      context.lineCap = 'round';
      context.strokeStyle = 'black';
      context.lineWidth = 3;
    }
  }, []);
  
  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const { offsetX, offsetY } = getCoords(event);
    const context = getContext();
    if (!context) return;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoords(event);
    const context = getContext();
    if (!context) return;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  const stopDrawing = () => {
    const context = getContext();
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
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

  const handleRecognizeClick = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      onRecognize(base64Data);
    }
  };

  const handleClearClick = () => {
    const context = getContext();
    if (context) {
      context.fillStyle = "white";
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    }
  };

  return (
    <div className="flex flex-col items-center text-center h-full">
      <BrushIcon />
      <h2 className="text-2xl font-bold mt-4 mb-2 text-blue-700">Draw</h2>
      <p className="text-gray-600 mb-4">
        Draw something below and let AI figure out what it is!
      </p>
      <canvas
        ref={canvasRef}
        width="300"
        height="250"
        className="border border-gray-300 rounded-lg shadow-inner touch-none bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <div className="flex gap-4 mt-4">
        <button
          onClick={handleClearClick}
          className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-full hover:bg-gray-300 transition-all duration-300"
        >
          Clear
        </button>
        <button
          onClick={handleRecognizeClick}
          disabled={isLoading}
          className="bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-blue-300 disabled:scale-100"
        >
          {isLoading ? 'Recognizing...' : 'Recognize'}
        </button>
      </div>
      <div className="mt-4 h-12 flex items-center justify-center">
        {recognizedText && (
          <p className="text-lg text-green-600 font-semibold">I see a {recognizedText}!</p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
};

export default DrawColumn;
