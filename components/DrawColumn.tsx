import React, { useRef, useState, useEffect } from 'react';
import WebcamModal from './WebcamModal';

const CameraIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
      <circle cx="12" cy="13" r="3"></circle>
    </svg>
);

// FIX: Updated function signature to accept HTMLVideoElement to fix TypeScript error on line 235.
// Helper to draw an image on a canvas while maintaining aspect ratio
const drawImageWithAspectRatio = (ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLVideoElement) => {
    const canvas = ctx.canvas;
    const { width, height } = canvas;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    const imgWidth = img instanceof HTMLVideoElement ? img.videoWidth : img.width;
    const imgHeight = img instanceof HTMLVideoElement ? img.videoHeight : img.height;

    if (imgWidth === 0 || imgHeight === 0) return;

    const imgAspectRatio = imgWidth / imgHeight;
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


interface DrawColumnProps {
  onRecognize: (base64ImageData: string) => void;
  isLoading: boolean;
  isGenerating: boolean;
  recognizedText: string | null;
  error: string | null;
  onPlaySound: (soundUrl: string) => void;
  isHistoryFull: boolean;
  onClearDrawing: () => void;
  originalDrawingImage: string | null;
}

const DrawColumn: React.FC<DrawColumnProps> = ({ onRecognize, isLoading, isGenerating, recognizedText, error, onPlaySound, isHistoryFull, onClearDrawing, originalDrawingImage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isPhotoOnCanvas, setIsPhotoOnCanvas] = useState(false);

  const [showWebcam, setShowWebcam] = useState(false);
  const webcamVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const getContext = () => canvasRef.current?.getContext('2d');

  useEffect(() => {
    if (!showWebcam) {
      return; 
    }
    const startStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (webcamVideoRef.current) {
                webcamVideoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing webcam", err);
        }
    };
    startStream();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = null;
      }
    };
  }, [showWebcam]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            if (width === 0 || height === 0 || (canvas.width === width && canvas.height === height)) continue;
            
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                if (canvas.width > 0 && canvas.height > 0) tempCtx.drawImage(canvas, 0, 0);

                canvas.width = width;
                canvas.height = height;
                const ctx = getContext();
                if (ctx) {
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 0, width, height);
                    if (tempCanvas.width > 0 && tempCanvas.height > 0) ctx.drawImage(tempCanvas, 0, 0, width, height);
                    
                    ctx.lineCap = 'round';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 3;
                }
            }
        }
    });

    const { width, height } = canvas.getBoundingClientRect();
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        const ctx = getContext();
        if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, width, height);
            ctx.lineCap = 'round';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
        }
    }
    
    resizeObserver.observe(canvas);
    return () => { resizeObserver.disconnect(); };
  }, []);
  
  // Effect to handle drawing an initial image (from history) or clearing
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = getContext();
    if (!canvas || !context) return;

    if (originalDrawingImage) {
        const img = new Image();
        img.onload = () => {
            drawImageWithAspectRatio(context, img);
            setHasDrawn(true);
            setIsPhotoOnCanvas(true); // Lock canvas for recalled drawings
        };
        img.src = `data:image/png;base64,${originalDrawingImage}`;
    } else {
        // Clear canvas if no image
        context.fillStyle = "white";
        context.fillRect(0, 0, context.canvas.width, context.canvas.height);
        setHasDrawn(false);
        setIsPhotoOnCanvas(false);
        setValidationError(null);
    }
  }, [originalDrawingImage]);

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    if (isPhotoOnCanvas) return;
    setValidationError(null);
    const { offsetX, offsetY } = getCoords(event);
    const context = getContext();
    if (!context) return;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || isPhotoOnCanvas) return;
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
    if (isHistoryFull) {
        setValidationError("History is full. Delete an item to start a new drawing.");
        onPlaySound('/error.mp3');
        return;
    }
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

  const handleCapture = () => {
    const video = webcamVideoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;
    const context = getContext();
    if (!context) return;
    onClearDrawing(); // Clear app state before capturing new image
    drawImageWithAspectRatio(context, video);
    setHasDrawn(true);
    setIsPhotoOnCanvas(true);
    setShowWebcam(false);
  };

  const handleCancelWebcam = () => {
    setShowWebcam(false);
  };

  const showOverlay = isLoading || isGenerating;
  const commonMediaClasses = "w-full aspect-[6/5] border border-gray-300 rounded-lg shadow-inner";

  return (
    <div className="flex flex-col items-center text-center h-full">
      <WebcamModal 
            showWebcam={showWebcam}
            webcamVideoRef={webcamVideoRef}
            onCapture={handleCapture}
            onCancel={handleCancelWebcam}
        />
      <div className="flex items-center justify-center gap-2 mb-1">
        <h2 className="text-2xl font-bold text-blue-700">Draw</h2>
      </div>
      <p className="text-gray-600 mb-2">
        Draw in the box, or use your camera for a paper drawing.
      </p>
      <div className="relative w-full">
        <canvas
          ref={canvasRef}
          className={`${commonMediaClasses} ${isPhotoOnCanvas ? 'cursor-not-allowed' : 'touch-none'} bg-white`}
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
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mt-2">
        <button onClick={onClearDrawing} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-full hover:bg-gray-300 transition-all duration-300">
          Clear
        </button>
        <button
          onClick={handleRecognizeClick}
          disabled={showOverlay || isHistoryFull}
          className="bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-blue-300 disabled:scale-100 disabled:cursor-not-allowed"
        >
          Surprise
        </button>
         <button 
          onClick={() => setShowWebcam(true)}
          disabled={showOverlay}
          className="bg-purple-500 text-white font-bold py-2 px-4 rounded-full hover:bg-purple-600 transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 disabled:bg-purple-300 disabled:scale-100"
        >
          <CameraIcon className="h-5 w-5" />
          <span>{isPhotoOnCanvas ? 'Retake Photo' : 'Camera'}</span>
        </button>
      </div>
      <div className="mt-2 h-12 flex items-center justify-center">
        {isHistoryFull && !recognizedText && !isLoading ? (
            <p className="text-sm text-amber-600">History is full. Delete an item to draw.</p>
        ) : validationError ? (
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