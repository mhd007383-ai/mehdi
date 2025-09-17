
import React, { useRef } from 'react';
import { allRecipes, moreRecipeNames, fastFoodRecipes } from '../data/recipes';

interface RecipeGridProps {
  onSelectDish: (dishName: string) => void;
  onPhotoSubmit: (file: File) => void;
  onRandomRecipe: () => void;
  onPantrySuggest: () => void;
  pantryItemCount: number;
}

const RecipeCard: React.FC<{ dish: { name: string }; onSelect: () => void; index: number }> = ({ dish, onSelect, index }) => (
  <div
    onClick={onSelect}
    className="group cursor-pointer text-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center p-4 aspect-square border-2 border-transparent hover:border-indigo-500/50"
    style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.05}s forwards`, opacity: 0 }}
    aria-label={dish.name}
  >
    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{dish.name}</h3>
  </div>
);

const PhotoSuggest: React.FC<{ onPhotoSubmit: (file: File) => void; }> = ({ onPhotoSubmit }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onPhotoSubmit(file);
        }
    };

    return (
        <div className="h-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col justify-center items-center">
            <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">غذا چی بپزم؟</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
                از مواد اولیه عکس بگیرید تا هوش مصنوعی به شما پیشنهاد غذا بدهد.
            </p>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment"
                className="hidden"
            />
            <button
                onClick={handleButtonClick}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                 </svg>
                شروع با عکس
            </button>
        </div>
    );
};

const PantrySuggest: React.FC<{ onPantrySuggest: () => void; pantryItemCount: number; }> = ({ onPantrySuggest, pantryItemCount }) => (
    <div className="h-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">از مواد موجود استفاده کن!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
            {pantryItemCount > 0
                ? `با ${pantryItemCount} قلم جنس در انبارتان یک غذا پیدا کنید.`
                : 'موادی که در خانه دارید را وارد کنید تا به شما پیشنهاد غذا بدهیم.'}
        </p>
        <button
            onClick={onPantrySuggest}
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
            پیشنهاد با مواد من
        </button>
    </div>
);


const RandomSuggest: React.FC<{ onRandomRecipe: () => void; }> = ({ onRandomRecipe }) => (
    <div className="h-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-center border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col justify-center items-center">
        <h2 className="text-2xl font-bold text-teal-600 dark:text-teal-400 mb-2">تصمیم‌گیری سخته؟</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
            اجازه بدید یک غذای خوشمزه به صورت شانسی برای شما انتخاب بشه.
        </p>
        <button
            onClick={onRandomRecipe}
            className="inline-flex items-center px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
             </svg>
            پیشنهاد شانسی
        </button>
    </div>
);


const RecipeGrid: React.FC<RecipeGridProps> = ({ onSelectDish, onPhotoSubmit, onRandomRecipe, onPantrySuggest, pantryItemCount }) => {
  const recipeNamesFromObjects = allRecipes.map(dish => dish.recipeName);
  const combinedNames = [...new Set([...recipeNamesFromObjects, ...moreRecipeNames])].sort((a, b) => a.localeCompare(b, 'fa'));

  return (
    <div className="text-center">
        <style>{`
            @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
            }
        `}</style>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <PhotoSuggest onPhotoSubmit={onPhotoSubmit} />
            <PantrySuggest onPantrySuggest={onPantrySuggest} pantryItemCount={pantryItemCount} />
            <RandomSuggest onRandomRecipe={onRandomRecipe} />
        </div>

        <div className="mb-16">
            <h2 className="text-3xl font-bold mb-3 text-gray-800 dark:text-gray-200">پیشنهادهای فست فود</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">برای یک غذای سریع و خوشمزه، یکی از موارد زیر را امتحان کنید.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {fastFoodRecipes.map((dishName, index) => (
                <RecipeCard 
                    key={dishName} 
                    dish={{name: dishName}} 
                    onSelect={() => onSelectDish(dishName)} 
                    index={index}
                />
                ))}
            </div>
        </div>

        <div>
            <h2 className="text-3xl font-bold mb-3 text-gray-800 dark:text-gray-200">کتاب آشپزی کامل</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">تمام غذاها، از سنتی تا مدرن، به ترتیب الفبا در اینجا موجود است.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {combinedNames.map((dishName, index) => (
                <RecipeCard 
                    key={dishName} 
                    dish={{name: dishName}} 
                    onSelect={() => onSelectDish(dishName)} 
                    index={index}
                />
                ))}
            </div>
      </div>
    </div>
  );
};

export default RecipeGrid;
