
import React, { useState, useCallback, useEffect } from 'react';
import { generateRecipe, generateRecipeImage, suggestRecipeFromImage, suggestRecipeFromPantry } from './services/geminiService';
import type { Recipe, ShoppingListItem, PantryItem, HouseholdItem } from './types';
import Header from './components/Header';
import RecipeGrid from './components/RecipeGrid';
import RecipeDetail from './components/RecipeDetail';
import LoadingOverlay from './components/LoadingOverlay';
import ShoppingListModal from './components/ShoppingListModal';
import BackgroundSelector from './components/BackgroundSelector';
import PantryModal from './components/PantryModal';
import HouseholdItemsModal from './components/HouseholdItemsModal';
import { allRecipes } from './data/recipes';
import { backgroundImages } from './data/backgrounds';


const App: React.FC = () => {
  const [selectedDish, setSelectedDish] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(() => {
    try {
        const itemsJSON = window.localStorage.getItem('shoppingList');
        if (!itemsJSON) return [];
        const items = JSON.parse(itemsJSON);
        if (items.length > 0 && typeof items[0] === 'string') {
          return items.map((item: string) => ({ item, purchased: false }));
        }
        return items;
    } catch (error) {
        console.error("Error reading shopping list from localStorage", error);
        return [];
    }
  });

  const [pantryItems, setPantryItems] = useState<PantryItem[]>(() => {
    try {
        const itemsJSON = window.localStorage.getItem('pantryItems');
        return itemsJSON ? JSON.parse(itemsJSON) : [];
    } catch (error) {
        console.error("Error reading pantry items from localStorage", error);
        return [];
    }
  });
  
  const [householdItems, setHouseholdItems] = useState<HouseholdItem[]>(() => {
    try {
        const itemsJSON = window.localStorage.getItem('householdItems');
        return itemsJSON ? JSON.parse(itemsJSON) : [];
    } catch (error) {
        console.error("Error reading household items from localStorage", error);
        return [];
    }
  });

  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
  const [isBgSelectorOpen, setIsBgSelectorOpen] = useState(false);
  const [isPantryModalOpen, setIsPantryModalOpen] = useState(false);
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);

  const [backgroundImage, setBackgroundImage] = useState<string>(() => {
    return window.localStorage.getItem('backgroundImage') || backgroundImages[1].fullUrl;
  });

  useEffect(() => {
    try {
        window.localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    } catch (error) {
        console.error("Error writing shopping list to localStorage", error);
    }
  }, [shoppingList]);

  useEffect(() => {
    try {
        window.localStorage.setItem('pantryItems', JSON.stringify(pantryItems));
    } catch (error) {
        console.error("Error writing pantry items to localStorage", error);
    }
  }, [pantryItems]);
  
  useEffect(() => {
    try {
        window.localStorage.setItem('householdItems', JSON.stringify(householdItems));
    } catch (error) {
        console.error("Error writing household items to localStorage", error);
    }
  }, [householdItems]);

  useEffect(() => {
    try {
      window.localStorage.setItem('backgroundImage', backgroundImage);
    } catch (error) {
      console.error("Error writing background image to localStorage", error);
    }
  }, [backgroundImage]);


  const handleSelectDish = useCallback(async (dishName: string) => {
    setIsLoading(true);
    setError(null);
    setRecipe(null);
    setImageUrl(null);
    setSelectedDish(dishName);

    try {
      const cookbookRecipe = allRecipes.find(r => r.recipeName === dishName);
      
      let recipeData: Recipe;
      let imageDataUrl: string;
      
      if (cookbookRecipe) {
        recipeData = {
          recipeName: cookbookRecipe.recipeName,
          description: cookbookRecipe.description,
          ingredients: cookbookRecipe.ingredients,
          instructions: cookbookRecipe.instructions,
          cookingTime: cookbookRecipe.cookingTime,
        };
        imageDataUrl = await generateRecipeImage(dishName);
      } else {
        const [generatedRecipe, generatedImageUrl] = await Promise.all([
            generateRecipe(dishName),
            generateRecipeImage(dishName)
        ]);
        recipeData = generatedRecipe;
        imageDataUrl = generatedImageUrl;
      }
      
      setRecipe(recipeData);
      setImageUrl(imageDataUrl);
    } catch (err) {
      console.error(err);
      setError('متاسفانه در تولید دستور پخت مشکلی پیش آمد. لطفا دوباره امتحان کنید.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePhotoSubmit = useCallback(async (imageFile: File) => {
    setIsLoading(true);
    setError(null);
    setRecipe(null);
    setImageUrl(null);
    setSelectedDish('در حال تحلیل تصویر شما...');

    try {
        const fileToBase64 = (file: File): Promise<string> =>
            new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = (error) => reject(error);
            });

        const base64ImageData = await fileToBase64(imageFile);
        const suggestedDishName = await suggestRecipeFromImage(base64ImageData, imageFile.type);
        
        await handleSelectDish(suggestedDishName);

    } catch (err) {
        console.error(err);
        const errorMessage = (err instanceof Error && err.message.includes("ingredients"))
            ? "موفق به یافتن مواد اولیه در عکس نشدیم. لطفا با یک عکس واضح‌تر امتحان کنید."
            : "متاسفانه در پیشنهاد غذا مشکلی پیش آمد. لطفا دوباره امتحان کنید.";
        setError(errorMessage);
        setSelectedDish(null);
        setIsLoading(false);
    }
  }, [handleSelectDish]);

  const handlePantrySuggest = useCallback(async () => {
    if (pantryItems.length === 0) {
        setError("ابتدا موادی که در خانه دارید را به انبار اضافه کنید.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setRecipe(null);
    setImageUrl(null);
    setSelectedDish('در حال جستجو در انبار شما...');
    
    try {
        const suggestedDishName = await suggestRecipeFromPantry(pantryItems);
        await handleSelectDish(suggestedDishName);
    } catch (err) {
        console.error(err);
        setError("متاسفانه با مواد شما غذایی پیدا نشد. لطفا دوباره امتحان کنید.");
        setSelectedDish(null);
        setIsLoading(false);
    }
  }, [pantryItems, handleSelectDish]);

  const handleRandomRecipe = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * allRecipes.length);
    const randomDish = allRecipes[randomIndex];
    handleSelectDish(randomDish.recipeName);
  }, [handleSelectDish]);

  const handleAddToShoppingList = useCallback((ingredient: string) => {
    setShoppingList(prevList => {
        if (prevList.some(i => i.item === ingredient)) {
            return prevList;
        }
        return [...prevList, { item: ingredient, purchased: false }];
    });
  }, []);

  const handleRemoveFromShoppingList = useCallback((ingredientToRemove: string) => {
    setShoppingList(prevList => prevList.filter(i => i.item !== ingredientToRemove));
  }, []);

  const handleToggleItemPurchased = useCallback((itemToToggle: string) => {
    setShoppingList(prevList => 
        prevList.map(i => 
            i.item === itemToToggle ? { ...i, purchased: !i.purchased } : i
        )
    );
  }, []);

  const handleClearPurchasedItems = useCallback(() => {
    setShoppingList(prevList => prevList.filter(item => !item.purchased));
  }, []);

  const handleClearShoppingList = useCallback(() => {
    setShoppingList([]);
  }, []);

  const handleAddPantryItem = useCallback((item: PantryItem) => {
    setPantryItems(prev => {
        if (prev.some(i => i.name.toLowerCase() === item.name.toLowerCase())) {
            // Optionally update quantity if item exists, for now, just prevent duplicates
            return prev;
        }
        return [...prev, item];
    });
  }, []);

  const handleRemovePantryItem = useCallback((itemName: string) => {
    setPantryItems(prev => prev.filter(i => i.name !== itemName));
  }, []);

  const handleClearPantry = useCallback(() => {
    setPantryItems([]);
  }, []);
  
  const handleAddHouseholdItem = useCallback((item: HouseholdItem) => {
    setHouseholdItems(prev => {
        if (prev.some(i => i.name.toLowerCase() === item.name.toLowerCase())) {
            return prev;
        }
        return [...prev, item];
    });
  }, []);

  const handleRemoveHouseholdItem = useCallback((itemName: string) => {
    setHouseholdItems(prev => prev.filter(i => i.name !== itemName));
  }, []);

  const handleClearHouseholdItems = useCallback(() => {
    setHouseholdItems([]);
  }, []);

  const toggleShoppingList = useCallback(() => setIsShoppingListOpen(prev => !prev), []);
  const toggleBgSelector = useCallback(() => setIsBgSelectorOpen(prev => !prev), []);
  const togglePantryModal = useCallback(() => setIsPantryModalOpen(prev => !prev), []);
  const toggleHouseholdModal = useCallback(() => setIsHouseholdModalOpen(prev => !prev), []);


  const handleBack = () => {
    setSelectedDish(null);
    setRecipe(null);
    setImageUrl(null);
    setError(null);
  };

  return (
    <div
      className="min-h-screen text-gray-800 dark:text-gray-200"
      style={backgroundImage ? { 
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
    >
        <div className={`min-h-screen ${backgroundImage ? 'bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm' : 'bg-gray-50 dark:bg-gray-900'} transition-colors duration-300`}>
            <Header 
                onToggleShoppingList={toggleShoppingList} 
                shoppingListItemCount={shoppingList.length}
                onToggleBgSelector={toggleBgSelector}
                onTogglePantry={togglePantryModal}
                onToggleHouseholdModal={toggleHouseholdModal}
            />
            <main className="container mx-auto p-4 md:p-8">
                {isLoading && <LoadingOverlay />}
                
                {!selectedDish && !isLoading && !error && (
                    <RecipeGrid 
                        onSelectDish={handleSelectDish} 
                        onPhotoSubmit={handlePhotoSubmit} 
                        onRandomRecipe={handleRandomRecipe}
                        onPantrySuggest={handlePantrySuggest}
                        pantryItemCount={pantryItems.length}
                    />
                )}

                {error && (
                <div className="text-center p-8">
                    <p className="text-red-500 text-xl mb-4">{error}</p>
                    <button
                    onClick={handleBack}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                    بازگشت به لیست غذاها
                    </button>
                </div>
                )}

                {recipe && imageUrl && !isLoading && (
                <RecipeDetail 
                    recipe={recipe} 
                    imageUrl={imageUrl} 
                    onBack={handleBack}
                    onAddToShoppingList={handleAddToShoppingList}
                    shoppingList={shoppingList}
                    pantryList={pantryItems}
                />
                )}
            </main>
            <ShoppingListModal 
                isOpen={isShoppingListOpen}
                onClose={toggleShoppingList}
                list={shoppingList}
                onAddItem={handleAddToShoppingList}
                onRemoveItem={handleRemoveFromShoppingList}
                onClearList={handleClearShoppingList}
                onToggleItem={handleToggleItemPurchased}
                onClearPurchased={handleClearPurchasedItems}
            />
            <PantryModal
                isOpen={isPantryModalOpen}
                onClose={togglePantryModal}
                list={pantryItems}
                onAddItem={handleAddPantryItem}
                onRemoveItem={handleRemovePantryItem}
                onClearList={handleClearPantry}
            />
            <HouseholdItemsModal
                isOpen={isHouseholdModalOpen}
                onClose={toggleHouseholdModal}
                list={householdItems}
                onAddItem={handleAddHouseholdItem}
                onRemoveItem={handleRemoveHouseholdItem}
                onClearList={handleClearHouseholdItems}
            />
            <BackgroundSelector
                isOpen={isBgSelectorOpen}
                onClose={toggleBgSelector}
                backgrounds={backgroundImages}
                selectedBackground={backgroundImage}
                onSelectBackground={setBackgroundImage}
            />
        </div>
    </div>
  );
};

export default App;
