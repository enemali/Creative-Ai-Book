
import React from 'react';

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

const PaintColumn: React.FC<PaintColumnProps> = ({ coloringPageImage, isLoading, recognizedText, error }) => {
  const handleDownload = () => {
    if (coloringPageImage && recognizedText) {
      const link = document.createElement('a');
      link.href = coloringPageImage;
      link.download = `${recognizedText}-coloring-page.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  return (
    <div className="flex flex-col items-center text-center h-full">
        <PaletteIcon />
        <h2 className="text-2xl font-bold mt-4 mb-2 text-indigo-700">Paint</h2>
        
        <div className="flex-grow flex flex-col justify-center items-center w-full">
            {isLoading && (
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-600">Generating a coloring page for your "{recognizedText}"...</p>
                </div>
            )}
            {!isLoading && coloringPageImage && (
                <img src={coloringPageImage} alt={`${recognizedText} coloring page`} className="max-w-full max-h-64 object-contain border rounded-lg shadow-sm my-4"/>
            )}
            {!isLoading && !coloringPageImage && !error && (
                 <p className="text-gray-600 px-4">
                    After you draw something, a coloring page will appear here!
                 </p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {coloringPageImage && !isLoading && (
            <button
                onClick={handleDownload}
                className="mt-6 bg-indigo-500 text-white font-bold py-2 px-6 rounded-full hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
                Download Coloring Page
            </button>
        )}
    </div>
  );
};

export default PaintColumn;
