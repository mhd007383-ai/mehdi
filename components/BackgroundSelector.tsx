import React from 'react';
import type { BackgroundImage } from '../data/backgrounds';

interface BackgroundSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  backgrounds: BackgroundImage[];
  selectedBackground: string;
  onSelectBackground: (url: string) => void;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ 
  isOpen, 
  onClose, 
  backgrounds, 
  selectedBackground, 
  onSelectBackground 
}) => {
  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    onSelectBackground(url);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center" 
      onClick={onClose} 
      aria-modal="true" 
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg m-4 flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">انتخاب پس‌زمینه</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="بستن">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>

        <div className="p-4 flex-grow overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {backgrounds.map(bg => {
              const isSelected = selectedBackground === bg.fullUrl;
              return (
                <div 
                  key={bg.id} 
                  onClick={() => handleSelect(bg.fullUrl)} 
                  className="group cursor-pointer aspect-video rounded-lg overflow-hidden relative shadow-md"
                  aria-label={bg.name}
                >
                  <img 
                    src={bg.thumbnailUrl} 
                    alt={bg.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                    loading="lazy"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-lg flex items-center justify-center bg-indigo-500/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                   <div className="absolute bottom-0 right-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-sm font-semibold truncate">{bg.name}</p>
                   </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundSelector;