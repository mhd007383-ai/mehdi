
import React, { useState, useEffect, useCallback } from 'react';
import type { Recipe, ShoppingListItem, PantryItem } from '../types';
import AudioPlayer from './AudioPlayer';
import { adjustIngredientsForServings } from '../services/geminiService';

interface RecipeDetailProps {
  recipe: Recipe;
  imageUrl: string;
  onBack: () => void;
  onAddToShoppingList: (ingredient: string) => void;
  shoppingList: ShoppingListItem[];
  pantryList: PantryItem[];
  onCookRecipe: (ingredients: string[]) => void;
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, imageUrl, onBack, onAddToShoppingList, shoppingList, pantryList, onCookRecipe }) => {
  const getBaseServings = (servingsString: string): number => {
    const matches = servingsString.match(/\d+/);
    return matches ? parseInt(matches[0], 10) : 4;
  };

  const [currentServings, setCurrentServings] = useState<number>(() => getBaseServings(recipe.servings));
  const [adjustedIngredients, setAdjustedIngredients] = useState<string[]>(recipe.ingredients);
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');


  useEffect(() => {
    setCurrentServings(getBaseServings(recipe.servings));
    setAdjustedIngredients(recipe.ingredients);
    setAdjustmentError(null);
  }, [recipe]);

  const handleServingsChange = useCallback(async (newServings: number) => {
    if (newServings < 1 || isAdjusting) return;

    const oldServings = currentServings;
    setCurrentServings(newServings);
    setIsAdjusting(true);
    setAdjustmentError(null);

    try {
      const newIngredients = await adjustIngredientsForServings(recipe.ingredients, recipe.servings, newServings);
      setAdjustedIngredients(newIngredients);
    } catch (error) {
      console.error(error);
      setAdjustmentError('خطا در بروزرسانی مواد اولیه.');
      setCurrentServings(oldServings);
    } finally {
      setIsAdjusting(false);
    }
  }, [recipe.ingredients, recipe.servings, isAdjusting, currentServings]);

  const instructionsForSpeech = recipe.instructions.join('. ');

  const isIngredientInPantry = (ingredient: string): boolean => {
    const lowerCaseIngredient = ingredient.toLowerCase();
    return pantryList.some(pantryItem => lowerCaseIngredient.includes(pantryItem.name.toLowerCase()));
  };
  
  const formatIngredientsForSharing = useCallback((): string => {
    const title = `مواد لازم برای ${recipe.recipeName}:\n`;
    const ingredientsList = adjustedIngredients.join('\n');
    return `${title}\n${ingredientsList}`;
  }, [recipe.recipeName, adjustedIngredients]);

  const handleSendSms = useCallback(() => {
    if (!phoneNumber.trim()) return;
    const message = formatIngredientsForSharing();
    const encodedMessage = encodeURIComponent(message);
    window.location.href = `sms:${phoneNumber}?body=${encodedMessage}`;
  }, [phoneNumber, formatIngredientsForSharing]);
  
  const handleSendWhatsApp = useCallback(() => {
    if (!phoneNumber.trim()) return;
    const message = formatIngredientsForSharing();
    const encodedMessage = encodeURIComponent(message);
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`, '_blank');
  }, [phoneNumber, formatIngredientsForSharing]);


  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
      style={{ animation: 'fadeIn 0.5s ease-out' }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
          <div className="md:col-span-2 relative">
             <div className="sticky top-20">
                <div className="aspect-w-1 aspect-h-1">
                    <img 
                        src={imageUrl} 
                        alt={recipe.recipeName} 
                        className="w-full h-full object-cover rounded-t-lg md:rounded-s-lg md:rounded-t-none" 
                        onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = 'https://placehold.co/1280x720/e2e8f0/4a5568?text=%D8%B9%DA%A9%D8%B3%20%D9%86%DB%8C%D8%B3%D8%AA';
                        }}
                    />
                </div>
             </div>
          </div>

          <div className="md:col-span-3 p-6 md:p-8">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{recipe.recipeName}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">{recipe.description}</p>
                </div>
                <button
                    onClick={onBack}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex-shrink-0 ms-4"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </button>
            </div>
            
            <div className="bg-indigo-50 dark:bg-indigo-900/50 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-center sm:justify-around gap-4 my-6 text-center">
                <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                       <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-indigo-800 dark:text-indigo-200">زمان پخت: {recipe.cookingTime}</span>
                </div>
                <div className="hidden sm:block w-px h-6 bg-indigo-200 dark:bg-indigo-700"></div>
                <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="font-semibold text-indigo-800 dark:text-indigo-200">برای</span>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-2">
                        <button 
                            onClick={() => handleServingsChange(currentServings - 1)} 
                            disabled={isAdjusting || currentServings <= 1}
                            className="p-1 rounded-full text-indigo-600 dark:text-indigo-300 disabled:text-gray-400 dark:disabled:text-gray-500 hover:bg-indigo-100 dark:hover:bg-indigo-700/50 transition-colors"
                            aria-label="کم کردن تعداد نفرات"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                        </button>
                        <span className="font-bold text-lg text-indigo-800 dark:text-indigo-200 w-8 text-center">{currentServings}</span>
                        <button 
                            onClick={() => handleServingsChange(currentServings + 1)} 
                            disabled={isAdjusting}
                            className="p-1 rounded-full text-indigo-600 dark:text-indigo-300 disabled:text-gray-400 dark:disabled:text-gray-500 hover:bg-indigo-100 dark:hover:bg-indigo-700/50 transition-colors"
                            aria-label="زیاد کردن تعداد نفرات"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                    <span className="font-semibold text-indigo-800 dark:text-indigo-200">نفر</span>
                </div>
            </div>

            <div className="mb-6">
              <button
                onClick={() => onCookRecipe(adjustedIngredients)}
                disabled={pantryList.length === 0}
                className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none disabled:scale-100 flex items-center justify-center gap-2"
                aria-label="پختم! از انبار کم کن"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                پختم! از انبار کم کن
              </button>
            </div>
            
            <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">ارسال مواد اولیه</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="شماره تلفن با کد کشور (مثلا 98912...)"
                        className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                        <button 
                            onClick={handleSendSms}
                            disabled={!phoneNumber.trim()}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                            aria-label="ارسال با پیامک"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                            </svg>
                            پیامک
                        </button>
                        <button 
                            onClick={handleSendWhatsApp}
                            disabled={!phoneNumber.trim()}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
                            aria-label="ارسال با واتساپ"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 me-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413 0 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.687-1.475L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01s-.521.074-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                            </svg>
                            واتساپ
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <h4 className="text-xl font-semibold mb-4 border-b-2 border-indigo-200 dark:border-indigo-700 pb-2">مواد لازم</h4>
                {adjustmentError && <p className="text-red-500 text-sm mb-2">{adjustmentError}</p>}
                <div className="relative">
                    {isAdjusting && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-lg z-10">
                            <div className="w-6 h-6 border-2 border-t-2 border-gray-400 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                    )}
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                    {adjustedIngredients.map((item, index) => {
                        const isInList = shoppingList.some(i => i.item === item);
                        const hasInPantry = isIngredientInPantry(item);
                        return (
                            <li key={index} className="flex justify-between items-center group">
                                <span className="flex items-center">
                                    {hasInPantry ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 me-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-label="موجود در انبار">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 me-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-label="در انبار موجود نیست">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {item}
                                </span>
                                <button 
                                    onClick={() => onAddToShoppingList(item)}
                                    disabled={isInList}
                                    className="p-1 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={isInList ? 'اضافه شده' : 'افزودن به لیست خرید'}
                                >
                                    {isInList ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                </button>
                            </li>
                        );
                    })}
                    </ul>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-semibold border-b-2 border-indigo-200 dark:border-indigo-700 pb-2 flex-grow me-4">طرز تهیه</h4>
                    <AudioPlayer textToSpeak={instructionsForSpeech} />
                </div>
                <ol className="space-y-4 text-gray-700 dark:text-gray-300">
                  {recipe.instructions.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 bg-indigo-500 text-white rounded-full h-8 w-8 flex items-center justify-center font-bold me-4">{index + 1}</span>
                      <p className="pt-1">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

          </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
