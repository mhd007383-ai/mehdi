import React, { useState, useEffect, useCallback } from 'react';

interface AudioPlayerProps {
  textToSpeak: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ textToSpeak }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSupported(true);
    }
  }, []);

  const stopSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    // Cleanup function to stop speech when component unmounts or text changes
    return () => {
      stopSpeech();
    };
  }, [textToSpeak, stopSpeech]);


  const handlePlay = () => {
    if (!isSupported || isPlaying) return;

    // Stop any previously playing speech
    stopSpeech();
    
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'fa-IR';
    utterance.rate = 0.9;
    
    utterance.onend = () => {
      setIsPlaying(false);
    };
    
    utterance.onerror = (event) => {
        console.error("SpeechSynthesis Error", event);
        setIsPlaying(false);
    }

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  if (!isSupported) {
    return <p className="text-sm text-gray-500">پخش صدا در مرورگر شما پشتیبانی نمی‌شود.</p>;
  }

  return (
    <div className="flex items-center space-s-2">
      <button
        onClick={isPlaying ? stopSpeech : handlePlay}
        className="flex items-center px-4 py-2 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
      >
        {isPlaying ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            توقف
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
            پخش صوتی
          </>
        )}
      </button>
    </div>
  );
};

export default AudioPlayer;