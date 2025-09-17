import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { HouseholdItem } from '../types';
import { useSpeechRecognition } from './useSpeechRecognition';
import { identifyItemsFromImage } from '../services/geminiService';

interface HouseholdItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  list: HouseholdItem[];
  onAddItem: (item: HouseholdItem) => void;
  onRemoveItem: (itemName: string) => void;
  onClearList: () => void;
}

const HouseholdItemsModal: React.FC<HouseholdItemsModalProps> = ({ 
    isOpen, 
    onClose, 
    list, 
    onAddItem, 
    onRemoveItem, 
    onClearList
}) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const { transcript, startListening, isListening, hasRecognitionSupport } = useSpeechRecognition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [identifiedItems, setIdentifiedItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (transcript) {
        setName(transcript);
    }
  }, [transcript]);

  const filteredList = useMemo(() => {
    if (!searchTerm) {
        return list;
    }
    return list.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [list, searchTerm]);

  const resetAnalysis = () => {
    setIdentifiedItems([]);
    setAnalysisError('');
  };

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      resetAnalysis();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAddItem({ name: name.trim(), quantity: quantity.trim() });
      setName('');
      setQuantity('');
    }
  };

  const handleImageAnalysis = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisError('');
    setIdentifiedItems([]);
    try {
        const items = await identifyItemsFromImage(file, 'household');
        if (items.length === 0) {
            setAnalysisError('موردی در تصویر شناسایی نشد.');
        } else {
            setIdentifiedItems(items);
        }
    } catch (error) {
        console.error(error);
        setAnalysisError('خطا در تحلیل تصویر. لطفا دوباره تلاش کنید.');
    } finally {
        setIsAnalyzing(false);
        if (event.target) {
            event.target.value = '';
        }
    }
  };

  const handleAddIdentifiedItem = (itemName: string) => {
      onAddItem({ name: itemName, quantity: '' });
      setIdentifiedItems(prev => prev.filter(i => i !== itemName));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center" onClick={onClose} aria-modal="true" role="dialog">
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg m-4 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">لوازم خانه</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="بستن">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
             </svg>
          </button>
        </div>

        <div className="p-4 flex-grow overflow-y-auto">
          {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin"></div>
                  <p className="text-gray-500 dark:text-gray-400 mt-4">در حال تحلیل تصویر...</p>
              </div>
          ) : identifiedItems.length > 0 || analysisError ? (
             <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">موارد شناسایی شده</h3>
                  <button onClick={resetAnalysis} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">بازگشت</button>
                </div>
                {analysisError && <p className="text-red-500 text-center mb-4">{analysisError}</p>}
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">برای افزودن به لیست روی + کلیک کنید.</p>
                <ul className="space-y-2">
                    {identifiedItems.map(item => (
                        <li key={item} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                            <span className="text-gray-800 dark:text-gray-200">{item}</span>
                            <button onClick={() => handleAddIdentifiedItem(item)} className="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800 rounded-full" aria-label={`افزودن ${item}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </li>
                    ))}
                </ul>
             </div>
          ) : (
            <>
               {list.length > 0 && (
                 <div className="mb-4 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        placeholder="جستجو در لوازم..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                 </div>
               )}
               {list.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">لیست لوازم شما خالی است.</p>
              ) : filteredList.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">موردی با این نام یافت نشد.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">نام وسیله</th>
                            <th scope="col" className="px-6 py-3">مقدار</th>
                            <th scope="col" className="px-6 py-3"><span className="sr-only">حذف</span></th>
                        </tr>
                    </thead>
                    <tbody>
                      {filteredList.map((item) => (
                        <tr key={item.name} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{item.name}</th>
                            <td className="px-6 py-4">{item.quantity || '-'}</td>
                            <td className="px-6 py-4 text-left">
                              <button onClick={() => onRemoveItem(item.name)} className="font-medium text-red-600 dark:text-red-500 hover:underline" aria-label={`حذف ${item.name}`}>
                                حذف
                              </button>
                            </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleAddItem} className="space-y-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="نام وسیله..."
                        required
                        className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageAnalysis}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                    />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="افزودن با عکس">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                    {hasRecognitionSupport && (
                         <button type="button" onClick={isListening ? undefined : startListening} className={`p-2 border rounded-md ${isListening ? 'border-red-500 bg-red-100 dark:bg-red-900/50' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`} aria-label="افزودن با صدا">
                           <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-600 dark:text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                         </button>
                    )}
                </div>
                <input
                    type="text"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="مقدار (مثلا ۲ عدد)..."
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <button type="submit" className="w-full mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    افزودن به لیست
                </button>
            </form>
            {list.length > 0 && (
                 <button 
                    onClick={onClearList} 
                    className="w-full mt-2 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md transition-colors"
                >
                    پاک کردن کل لیست
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default HouseholdItemsModal;