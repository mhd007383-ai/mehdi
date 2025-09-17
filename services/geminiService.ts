
import { GoogleGenAI, Type } from "@google/genai";
import type { Recipe, PantryItem } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const recipeSchema_fallback = {
  type: Type.OBJECT,
  properties: {
    recipeName: {
      type: Type.STRING,
      description: "نام غذا.",
    },
    description: {
        type: Type.STRING,
        description: "یک توضیح کوتاه و جذاب درباره این غذا."
    },
    ingredients: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "لیست مواد لازم برای غذا.",
    },
    instructions: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "مراحل پخت غذا به صورت گام به گام.",
    },
    cookingTime: {
        type: Type.STRING,
        description: "زمان تخمینی پخت غذا (مثلا 'حدود ۲ ساعت').",
    },
    servings: {
        type: Type.STRING,
        description: "تعداد نفرات مناسب برای این دستور پخت (مثلا '۴ نفر').",
    },
  },
  required: ["recipeName", "description", "ingredients", "instructions", "cookingTime", "servings"],
};

export async function generateRecipe(dishName: string): Promise<Recipe> {
  const prompt = `یک دستور پخت کامل و دقیق برای غذای ایرانی "${dishName}" برای ۲ تا ۴ نفر ارائه بده. لیست مواد لازم باید دقیقاً برای همین تعداد باشد. شامل زمان پخت و تعداد نفرات مناسب (بین ۲ تا ۴ نفر) هم باشد.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema_fallback,
      },
    });

    const jsonText = response.text.trim();
    const recipeData = JSON.parse(jsonText);
    return recipeData as Recipe;

  } catch (error) {
    console.error("Error generating recipe:", error);
    throw new Error("Failed to generate recipe from Gemini API.");
  }
}

export async function generateRecipeImage(dishName: string): Promise<string> {
    const prompt = `A highly realistic, appetizing, professionally shot photograph of "${dishName}", a traditional Persian dish. The food should be well-lit, beautifully plated on authentic tableware, with steam rising. food photography, cinematic lighting, 8k, ultra-realistic.`;
    
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '1:1',
            },
        });
        
        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated.");
        }

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image from Gemini API.");
    }
}

export async function suggestRecipeFromImage(base64ImageData: string, mimeType: string): Promise<string> {
  const imagePart = {
    inlineData: {
      mimeType,
      data: base64ImageData,
    },
  };
  const textPart = {
    text: "Identify all the food ingredients in this image. List them clearly, separated by commas. If no food items are clearly visible, return an empty string.",
  };

  const ingredientResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
  });

  const ingredients = ingredientResponse.text.trim();

  if (!ingredients) {
    throw new Error("No ingredients could be identified in the image.");
  }

  const suggestionPrompt = `Given the following ingredients: ${ingredients}. Suggest one single name of a popular Iranian dish that can be primarily made with these. Only return the name of the dish in Persian, and absolutely nothing else. For example: 'قورمه سبزی'`;

  const suggestionResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: suggestionPrompt,
  });

  const dishName = suggestionResponse.text.trim();

  if (!dishName) {
      throw new Error("Could not suggest a dish for the given ingredients.");
  }

  return dishName;
}

export async function suggestRecipeFromPantry(pantryItems: PantryItem[]): Promise<string> {
    const ingredientsList = pantryItems.map(item => item.name).join(', ');
    
    if (!ingredientsList) {
        throw new Error("Your pantry is empty. Add some ingredients first!");
    }

    const suggestionPrompt = `Given the following ingredients in my pantry: ${ingredientsList}. Suggest one single name of a popular Iranian dish that can be primarily made with these. Only return the name of the dish in Persian, and absolutely nothing else. For example: 'کوکو سبزی'`;

    const suggestionResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: suggestionPrompt,
    });

    const dishName = suggestionResponse.text.trim();

    if (!dishName) {
        throw new Error("Could not suggest a dish for the given ingredients.");
    }

    return dishName;
}

const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            const [mimePart, dataPart] = result.split(';base64,');
            const mimeType = mimePart.split(':')[1];
            resolve({ mimeType, data: dataPart });
        };
        reader.onerror = (error) => reject(error);
    });

export async function identifyItemsFromImage(imageFile: File, context: 'food' | 'household'): Promise<string[]> {
    const { mimeType, data } = await fileToBase64(imageFile);

    const imagePart = {
        inlineData: {
            mimeType,
            data,
        },
    };

    const contextText = context === 'food'
        ? "Identify all distinct food ingredients in this image. Focus on raw ingredients like vegetables, fruits, meat, and pantry staples."
        : "Identify all distinct household items in this image. Focus on non-food items like cleaning supplies, tools, or kitchenware.";

    const textPart = {
        text: `${contextText} Return a JSON object with a single key "items" containing an array of strings. Each string should be the name of one item in Persian. If no items are found, return an empty array. Example: {"items": ["قلم", "دفتر"]}`,
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            items: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
            }
        },
        required: ["items"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        return (result.items || []) as string[];
    } catch (error) {
        console.error("Error identifying items from image:", error);
        throw new Error("Failed to identify items from the image.");
    }
}

export async function updatePantryAfterCooking(pantryItems: PantryItem[], recipeIngredients: string[]): Promise<PantryItem[]> {
  if (pantryItems.length === 0) {
    return [];
  }

  const pantryJson = JSON.stringify(pantryItems, null, 2);
  const ingredientsJson = JSON.stringify(recipeIngredients, null, 2);

  const prompt = `You are a helpful kitchen pantry management assistant.
A user has just cooked a recipe.
Here is the current state of their pantry:
${pantryJson}

Here are the ingredients used in the recipe:
${ingredientsJson}

Your task is to update the pantry list. For each ingredient in the recipe, find the corresponding item in the pantry and intelligently deduct the amount.
- Match ingredient names leniently (e.g., "گوشت" in pantry should match "گوشت مغز ران" in recipe).
- If you can parse quantities and units, subtract them. If the resulting quantity is zero or very small, remove the item entirely from the list.
- If you cannot parse quantities (e.g., for items like "به مقدار لازم" or "نمک"), you should remove the entire item from the pantry as it's assumed to be used up.
- Preserve the 'isSpice' property of items.
- Return the final, updated pantry list as a JSON array of objects. The JSON must conform to the provided schema. Only return the JSON array, with no other text or markdown formatting.
- If the pantry is empty, return an empty array.
- The language for item names is Persian.
`;

  const pantryItemSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "نام ماده غذایی" },
        quantity: { type: Type.STRING, description: "مقدار باقی مانده" },
        isSpice: { type: Type.BOOLEAN, description: "آیا ادویه است؟" },
    },
    required: ["name", "quantity", "isSpice"],
  };

  const responseSchema = {
    type: Type.ARRAY,
    items: pantryItemSchema,
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const updatedPantryData = JSON.parse(jsonText);
    return updatedPantryData as PantryItem[];

  } catch (error) {
    console.error("Error updating pantry:", error);
    throw new Error("Failed to update pantry using Gemini API.");
  }
}

export async function adjustIngredientsForServings(
  originalIngredients: string[], 
  originalServings: string, 
  newServings: number
): Promise<string[]> {
  const ingredientsJson = JSON.stringify(originalIngredients, null, 2);

  const prompt = `You are an expert recipe scaling assistant.
Your task is to adjust the quantities of ingredients in a recipe for a different number of servings. You must be precise and handle various units of measurement (grams, cups, spoons, 'a pinch', 'به مقدار لازم', etc.) intelligently. Maintain the original language (Persian) and the style of the ingredient list.

The original recipe serves ${originalServings}. The ingredients are:
${ingredientsJson}

Please adjust the recipe to serve ${newServings} people.

Return only a JSON array of strings, where each string is an adjusted ingredient. The JSON must conform to the provided schema. Do not include any other text or markdown formatting.
`;

  const responseSchema = {
    type: Type.ARRAY,
    items: { type: Type.STRING },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = response.text.trim();
    const adjustedIngredients = JSON.parse(jsonText);
    return adjustedIngredients as string[];
  } catch (error) {
    console.error("Error adjusting ingredients:", error);
    throw new Error("Failed to adjust ingredients using Gemini API.");
  }
}