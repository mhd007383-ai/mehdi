import React from 'react';
import type { Recipe, ShoppingListItem, PantryItem } from '../types';
import AudioPlayer from './AudioPlayer';

interface RecipeDetailProps {
  recipe: Recipe;
  imageUrl: string;
  onBack: () => void;
  onAddToShoppingList: (ingredient: string) => void;
  shoppingList: ShoppingListItem[];
  pantryList: PantryItem[];
}

const RecipeDetail: React.FC<RecipeDetailProps> = ({ recipe, imageUrl, onBack, onAddToShoppingList, shoppingList, pantryList }) => {
  const instructionsForSpeech = recipe.instructions.join('. ');

  const isIngredientInPantry = (ingredient: string): boolean => {
    // Make the search case-insensitive and more robust
    const lowerCaseIngredient = ingredient.toLowerCase();
    return pantryList.some(pantryItem => lowerCaseIngredient.includes(pantryItem.name.toLowerCase()));
  };

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
          {/* Image Column */}
          <div className="md:col-span-2 relative">
             <div className="sticky top-20">
                <div className="aspect-w-1 aspect-h-1">
                    <img 
                        src={imageUrl} 
                        alt={recipe.recipeName} 
                        className="w-full h-full object-cover rounded-t-lg md:rounded-s-lg md:rounded-t-none" 
                        onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null; // Prevents infinite loops
                            target.src = 'https://placehold.co/1280x720/e2e8f0/4a5568?text=%D8%B9%DA%A9%D8%B3%20%D9%86%DB%8C%D8%B3%D8%AA';
                        }}
                    />
                </div>
             </div>
          </div>

          {/* Details Column */}
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
            
            <div className="bg-indigo-50 dark:bg-indigo-900/50 p-3 rounded-lg flex items-center gap-3 my-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-semibold text-indigo-800 dark:text-indigo-200">زمان پخت: {recipe.cookingTime}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <h4 className="text-xl font-semibold mb-4 border-b-2 border-indigo-200 dark:border-indigo-700 pb-2">مواد لازم</h4>
                <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                  {recipe.ingredients.map((item, index) => {
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