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
  },
  required: ["recipeName", "description", "ingredients", "instructions", "cookingTime"],
};

export async function generateRecipe(dishName: string): Promise<Recipe> {
  const prompt = `یک دستور پخت کامل و دقیق برای غذای ایرانی "${dishName}" ارائه بده. شامل زمان پخت هم باشد.`;

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
