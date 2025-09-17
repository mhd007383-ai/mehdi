
import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "در حال آماده کردن دستور پخت...",
  "در حال خلق یک تصویر خوشمزه...",
  "هوش مصنوعی در حال آشپزی است...",
  "چیدن مواد اولیه کنار هم...",
  "فقط چند لحظه دیگر...",
];

const LoadingOverlay: React.FC = () => {
  const [message, setMessage] = useState(loadingMessages[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessage(prevMessage => {
        const currentIndex = loadingMessages.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 2500);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div>
      <p className="text-white text-lg mt-4 transition-opacity duration-500">{message}</p>
    </div>
  );
};

export default LoadingOverlay;
