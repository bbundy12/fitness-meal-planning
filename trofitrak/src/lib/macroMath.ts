export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface IngredientForCalculation {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  gramsPerServing: number;
}

export interface RecipeItemForCalculation {
  quantity: number;
  unit: "grams" | "serving";
  ingredient: IngredientForCalculation;
}

/**
 * Calculate total macros for a recipe based on its items
 */
export function calculateRecipeMacros(
  items: RecipeItemForCalculation[],
): Macros {
  return items.reduce<Macros>(
    (totals, item) => {
      const { ingredient, quantity, unit } = item;
      let factor = 1;

      if (unit === "serving") {
        factor = quantity;
      } else {
        // unit === "grams"
        const servingsUsed = quantity / ingredient.gramsPerServing;
        factor = servingsUsed;
      }

      return {
        calories: totals.calories + ingredient.calories * factor,
        protein: totals.protein + ingredient.protein * factor,
        carbs: totals.carbs + ingredient.carbs * factor,
        fat: totals.fat + ingredient.fat * factor,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
