"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Plus, X, Edit, Trash2 } from "lucide-react";

interface Ingredient {
  id: string;
  text: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Recipe {
  id: string;
  title: string;
  servings: number;
  instructions: string;
  ingredients: Ingredient[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export function RecipeBuilder() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [servings, setServings] = useState("1");
  const [instructions, setInstructions] = useState("");
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);

  // Mock saved recipes
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: "1",
      title: "Grilled Chicken with Rice",
      servings: 1,
      instructions:
        "1. Season chicken breast\n2. Grill for 6-7 minutes per side\n3. Cook rice according to package\n4. Serve together",
      ingredients: [],
      totalCalories: 520,
      totalProtein: 45,
      totalCarbs: 52,
      totalFat: 12,
    },
    {
      id: "2",
      title: "Salmon and Sweet Potato",
      servings: 1,
      instructions:
        "1. Bake salmon at 400°F for 12-15 minutes\n2. Roast sweet potato at 425°F for 25-30 minutes\n3. Season and serve",
      ingredients: [],
      totalCalories: 480,
      totalProtein: 38,
      totalCarbs: 45,
      totalFat: 18,
    },
    {
      id: "3",
      title: "Greek Yogurt Parfait",
      servings: 1,
      instructions:
        "1. Layer Greek yogurt in a bowl\n2. Add berries\n3. Top with granola\n4. Drizzle with honey",
      ingredients: [],
      totalCalories: 280,
      totalProtein: 24,
      totalCarbs: 36,
      totalFat: 6,
    },
  ]);

  // Mock Nutritionix API call
  const fetchNutritionInfo = (input: string): Ingredient => {
    // Simple mock responses
    const mockData: { [key: string]: Partial<Ingredient> } = {
      rice: { calories: 206, protein: 4.3, carbs: 45, fat: 0.4 },
      chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      salmon: { calories: 208, protein: 20, carbs: 0, fat: 13 },
      "sweet potato": { calories: 112, protein: 2, carbs: 26, fat: 0.1 },
      yogurt: { calories: 100, protein: 17, carbs: 7, fat: 0.7 },
    };

    let matched = mockData.rice;
    for (const [key, value] of Object.entries(mockData)) {
      if (input.toLowerCase().includes(key)) {
        matched = value;
        break;
      }
    }

    return {
      id: Date.now().toString(),
      text: input,
      calories: matched.calories || 100,
      protein: matched.protein || 5,
      carbs: matched.carbs || 15,
      fat: matched.fat || 3,
    };
  };

  const handleAddIngredient = () => {
    if (!ingredientInput.trim()) return;
    const ingredient = fetchNutritionInfo(ingredientInput);
    setIngredients([...ingredients, ingredient]);
    setIngredientInput("");
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  const calculateTotals = () => {
    return ingredients.reduce(
      (acc, ing) => ({
        calories: acc.calories + ing.calories,
        protein: acc.protein + ing.protein,
        carbs: acc.carbs + ing.carbs,
        fat: acc.fat + ing.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const servingsCount = Math.max(parseInt(servings, 10) || 1, 1);

  const handleSaveRecipe = () => {
    if (!title.trim()) return;
    const totals = calculateTotals();
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      title,
      servings: servingsCount,
      instructions,
      ingredients: [...ingredients],
      totalCalories: Math.round(totals.calories),
      totalProtein: Math.round(totals.protein),
      totalCarbs: Math.round(totals.carbs),
      totalFat: Math.round(totals.fat),
    };
    setRecipes([newRecipe, ...recipes]);
    setTitle("");
    setServings("1");
    setInstructions("");
    setIngredients([]);
    setShowForm(false);
  };

  const totals = calculateTotals();
  const perServing = {
    calories: Math.round(totals.calories / servingsCount),
    protein: Math.round(totals.protein / servingsCount),
    carbs: Math.round(totals.carbs / servingsCount),
    fat: Math.round(totals.fat / servingsCount),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl">Recipe Builder</h2>
        <p className="text-slate-500">
          Create and manage your recipes with automatic macro calculations
        </p>
      </div>
      <Button onClick={() => setShowForm(!showForm)} className="bg-rose-600 hover:bg-rose-700">
        {showForm ? (
          "Cancel"
        ) : (
          <>
            <Plus className="mr-2 h-4 w-4" />
            New Recipe
          </>
        )}
      </Button>

      {/* Recipe Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Recipe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Recipe Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Chicken and Rice Bowl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="servings">Number of Servings</Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredient">Add Ingredients</Label>
              <div className="flex gap-2">
                <Input
                  id="ingredient"
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  placeholder="e.g., 1 cup rice, 6 oz chicken breast"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddIngredient();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddIngredient} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-slate-500">
                Type ingredient with quantity (e.g., "1 cup rice") and press Enter or click +
              </p>
            </div>

            {/* Ingredients List */}
            {ingredients.length > 0 && (
              <div className="space-y-2">
                <Label>Ingredients ({ingredients.length})</Label>
                <div className="space-y-2">
                  {ingredients.map((ing) => (
                    <div
                      key={ing.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <div className="text-slate-900">{ing.text}</div>
                        <div className="text-slate-500 flex gap-3">
                          <span>{ing.calories} cal</span>
                          <span>P: {ing.protein}g</span>
                          <span>C: {ing.carbs}g</span>
                          <span>F: {ing.fat}g</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveIngredient(ing.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Macro Summary */}
            {ingredients.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-rose-50 rounded-lg">
                <div>
                  <p className="text-slate-500">Calories/serving</p>
                  <div className="text-slate-900">{perServing.calories}</div>
                </div>
                <div>
                  <p className="text-slate-500">Protein</p>
                  <div className="text-slate-900">{perServing.protein}g</div>
                </div>
                <div>
                  <p className="text-slate-500">Carbs</p>
                  <div className="text-slate-900">{perServing.carbs}g</div>
                </div>
                <div>
                  <p className="text-slate-500">Fat</p>
                  <div className="text-slate-900">{perServing.fat}g</div>
                </div>
              </div>
            )}

            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter cooking instructions here"
              rows={4}
            />

            <Button
              onClick={handleSaveRecipe}
              className="bg-rose-600 hover:bg-rose-700"
              disabled={!title.trim() || ingredients.length === 0}
            >
              Save Recipe
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Saved Recipes */}
      <div>
        <h3 className="mb-4">Saved Recipes ({recipes.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <span>{recipe.title}</span>
                  <Badge variant="outline">
                    {recipe.servings} serving{recipe.servings > 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-slate-500">Calories</p>
                    <div className="text-slate-900">{recipe.totalCalories}</div>
                  </div>
                  <div>
                    <p className="text-slate-500">Protein</p>
                    <div className="text-slate-900">{recipe.totalProtein}g</div>
                  </div>
                  <div>
                    <p className="text-slate-500">Carbs</p>
                    <div className="text-slate-900">{recipe.totalCarbs}g</div>
                  </div>
                  <div>
                    <p className="text-slate-500">Fat</p>
                    <div className="text-slate-900">{recipe.totalFat}g</div>
                  </div>
                </div>
                {recipe.instructions && (
                  <div>
                    <p className="text-slate-500">Instructions</p>
                    <p className="text-slate-900 whitespace-pre-line line-clamp-3">
                      {recipe.instructions}
                    </p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
