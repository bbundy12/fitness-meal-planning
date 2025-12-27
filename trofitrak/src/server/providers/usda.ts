import { env } from "@/env";

/**
 * USDA FoodData Central API Client
 *
 * Provides search and details fetching for USDA ingredients.
 * API Documentation: https://fdc.nal.usda.gov/api-guide.html
 */

const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";

export interface UsdaSearchResult {
  fdcId: number;
  description: string;
  brandOwner?: string;
  dataType?: string;
}

export interface UsdaFoodNutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

export interface UsdaFoodDetails {
  fdcId: number;
  description: string;
  brandOwner?: string;
  foodNutrients: UsdaFoodNutrient[];
}

interface UsdaSearchResponse {
  foods: Array<{
    fdcId: number;
    description: string;
    brandOwner?: string;
    dataType?: string;
  }>;
}

interface UsdaDetailsResponse {
  fdcId: number;
  description: string;
  brandOwner?: string;
  foodNutrients: Array<{
    nutrient: {
      id: number;
      name: string;
      unitName: string;
    };
    amount: number;
  }>;
}

/**
 * Search for foods in USDA database
 * @param query - Search term (e.g., "chicken breast")
 * @returns Array of search results
 */
export async function searchFoods(query: string): Promise<UsdaSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const url = new URL(`${USDA_BASE_URL}/foods/search`);
    url.searchParams.set("api_key", env.USDA_API_KEY);
    url.searchParams.set("query", query.trim());
    url.searchParams.set("pageSize", "20");
    url.searchParams.set("dataType", "Foundation,SR Legacy,Survey (FNDDS)");

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `USDA API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as UsdaSearchResponse;

    return data.foods.map((food) => ({
      fdcId: food.fdcId,
      description: food.description,
      brandOwner: food.brandOwner,
      dataType: food.dataType,
    }));
  } catch (error) {
    console.error("USDA search error:", error);
    throw new Error(
      `Failed to search USDA database: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get detailed nutrition information for a specific food
 * @param fdcId - USDA Food Data Central ID
 * @returns Food details with nutrients
 */
export async function getFoodDetails(fdcId: number): Promise<UsdaFoodDetails> {
  try {
    const url = new URL(`${USDA_BASE_URL}/food/${fdcId}`);
    url.searchParams.set("api_key", env.USDA_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(
        `USDA API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as UsdaDetailsResponse;

    return {
      fdcId: data.fdcId,
      description: data.description,
      brandOwner: data.brandOwner,
      foodNutrients: data.foodNutrients.map((fn) => ({
        nutrientId: fn.nutrient.id,
        nutrientName: fn.nutrient.name,
        value: fn.amount,
        unitName: fn.nutrient.unitName,
      })),
    };
  } catch (error) {
    console.error("USDA details error:", error);
    throw new Error(
      `Failed to fetch USDA food details: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Map USDA nutrients to our ingredient macros (per 100g serving)
 * Nutrient IDs reference: https://fdc.nal.usda.gov/
 * - Energy: 1008 (kcal)
 * - Protein: 1003 (g)
 * - Carbohydrate: 1005 (g)
 * - Total lipid (fat): 1004 (g)
 */
export interface MappedMacros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function mapNutrientsToMacros(
  nutrients: UsdaFoodNutrient[],
): MappedMacros {
  const findNutrient = (id: number): number => {
    const nutrient = nutrients.find((n) => n.nutrientId === id);
    return nutrient?.value ?? 0;
  };

  // USDA nutrient IDs
  const ENERGY_KCAL = 1008;
  const PROTEIN = 1003;
  const CARBS = 1005;
  const FAT = 1004;

  return {
    calories: findNutrient(ENERGY_KCAL),
    protein: findNutrient(PROTEIN),
    carbs: findNutrient(CARBS),
    fat: findNutrient(FAT),
  };
}
