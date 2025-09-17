
export interface Recipe {
  recipeName: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
  servings: string;
}

export interface ShoppingListItem {
    item: string;
    purchased: boolean;
}

export interface PantryItem {
    name: string;
    quantity: string;
    isSpice: boolean;
}

export interface HouseholdItem {
    name: string;
    quantity: string;
}
