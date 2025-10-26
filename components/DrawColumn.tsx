import React, { useRef, useState, useEffect } from 'react';

interface DrawColumnProps {
  onRecognize: (base64ImageData: string) => void;
  isLoading: boolean;
  isGenerating: boolean;
  recognizedText: string | null;
  error: string | null;
  onPlaySound: (soundUrl: string) => void;
}

const DrawColumn: React.FC<DrawColumnProps> = ({ onRecognize, isLoading, isGenerating, recognizedText, error, onPlaySound }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const getContext = () => canvasRef.current?.getContext('2d');
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            canvas.width = width;
            canvas.height = height;
            
            const context = getContext();
            if (context) {
                context.fillStyle = "white";
                context.fillRect(0, 0, width, height);
                context.lineCap = 'round';
                context.strokeStyle = 'black';
                context.lineWidth = 3;
            }
        }
    });
    resizeObserver.observe(canvas);
    return () => { resizeObserver.disconnect(); };
  }, []);

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    setValidationError(null);
    const { offsetX, offsetY } = getCoords(event);
    const context = getContext();
    if (!context) return;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (!hasDrawn) setHasDrawn(true);
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
    setValidationError(null);
    if (!hasDrawn) {
        setValidationError("Please draw something first.");
        onPlaySound('/error.mp3');
        return;
    }

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
      setHasDrawn(false);
      setValidationError(null);
    }
  };

  const showOverlay = isLoading || isGenerating;
  const commonMediaClasses = "w-full aspect-[6/5] border border-gray-300 rounded-lg shadow-inner";

  return (
    <div className="flex flex-col items-center text-center h-full">
      <div className="flex items-center justify-center gap-2 mb-1">
        <h2 className="text-2xl font-bold text-blue-700">Draw</h2>
      </div>
      <p className="text-gray-600 mb-2">
        Draw something in the box below.
      </p>
      <div className="relative w-full">
        <canvas
          ref={canvasRef}
          className={`${commonMediaClasses} touch-none bg-white`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {showOverlay && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col justify-center items-center rounded-lg text-center p-4">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-500"></div>
            <p className="mt-4 text-lg font-semibold text-blue-700">
              {isGenerating ? 'Creating Page...' : 'Recognizing...'}
            </p>
            {isGenerating && recognizedText && (
              <p className="mt-2 text-base text-green-600 font-semibold">
                I see a {recognizedText}!
              </p>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
        <button onClick={handleClearClick} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-full hover:bg-gray-300 transition-all duration-300">
          Clear
        </button>
        <button
          onClick={handleRecognizeClick}
          disabled={showOverlay}
          className="bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-blue-300 disabled:scale-100"
        >
          {isLoading ? 'Recognizing...' : 'Recognize'}
        </button>
      </div>
      <div className="mt-2 h-12 flex items-center justify-center">
        {validationError ? (
            <p className="text-sm text-red-500">{validationError}</p>
        ) : error ? (
            <p className="text-sm text-red-500">{error}</p>
        ) : recognizedText && !isGenerating ? (
            <p className="text-lg text-green-600 font-semibold">I see a {recognizedText}!</p>
        ) : null}
      </div>
    </div>
  );
};

export default DrawColumn;