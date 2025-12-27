"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Plus, X, Edit, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface RecipeItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: "grams" | "serving";
}

export function RecipeBuilder() {
  const utils = trpc.useUtils();
  const { data: ingredients = [] } = trpc.ingredient.list.useQuery();
  const { data: recipes = [], isLoading } = trpc.recipe.list.useQuery();
  const createRecipeMutation = trpc.recipe.create.useMutation({
    onSuccess: () => {
      utils.recipe.list.invalidate();
    },
  });
  const deleteRecipeMutation = trpc.recipe.delete.useMutation({
    onSuccess: () => {
      utils.recipe.list.invalidate();
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [servings, setServings] = useState("1");
  const [instructions, setInstructions] = useState("");
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(
    null,
  );
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<"grams" | "serving">("serving");
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);

  const filteredIngredients = ingredients.filter((ing: { name: string }) =>
    ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()),
  );

  const handleAddIngredient = () => {
    if (!selectedIngredient || !quantity) return;
    const ingredient = ingredients.find(
      (ing: { id: string }) => ing.id === selectedIngredient,
    );
    if (!ingredient) return;

    const newItem: RecipeItem = {
      id: `${selectedIngredient}-${Date.now()}`,
      ingredientId: selectedIngredient,
      ingredientName: ingredient.name,
      quantity: parseFloat(quantity),
      unit,
    };
    setRecipeItems([...recipeItems, newItem]);
    setSelectedIngredient(null);
    setQuantity("");
    setIngredientSearch("");
  };

  const handleRemoveIngredient = (id: string) => {
    setRecipeItems(recipeItems.filter((item) => item.id !== id));
  };

  const calculateTotals = () => {
    return recipeItems.reduce(
      (acc, item) => {
        const ingredient = ingredients.find(
          (ing) => ing.id === item.ingredientId,
        );
        if (!ingredient) return acc;

        let factor = 1;
        if (item.unit === "serving") {
          factor = item.quantity;
        } else {
          // grams
          factor = item.quantity / ingredient.gramsPerServing;
        }

        return {
          calories: acc.calories + ingredient.calories * factor,
          protein: acc.protein + ingredient.protein * factor,
          carbs: acc.carbs + ingredient.carbs * factor,
          fat: acc.fat + ingredient.fat * factor,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  };

  const servingsCount = Math.max(parseInt(servings, 10) || 1, 1);

  const handleSaveRecipe = () => {
    if (!title.trim() || recipeItems.length === 0) return;

    createRecipeMutation.mutate({
      title,
      servings: servingsCount,
      instructions,
      items: recipeItems.map((item) => ({
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unit: item.unit,
      })),
    });

    setTitle("");
    setServings("1");
    setInstructions("");
    setRecipeItems([]);
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
      <Button
        onClick={() => setShowForm(!showForm)}
        className="bg-rose-600 hover:bg-rose-700"
      >
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
              <div className="space-y-2">
                <Input
                  id="ingredient"
                  value={ingredientSearch}
                  onChange={(e) => {
                    setIngredientSearch(e.target.value);
                    setSelectedIngredient(null);
                  }}
                  placeholder="Search for ingredient..."
                />
                {ingredientSearch &&
                  filteredIngredients.length > 0 &&
                  !selectedIngredient && (
                    <div className="border border-slate-200 rounded-lg p-2 max-h-48 overflow-y-auto">
                      {filteredIngredients
                        .slice(0, 5)
                        .map((ing: (typeof ingredients)[0]) => (
                          <button
                            key={ing.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded"
                            onClick={() => {
                              setSelectedIngredient(ing.id);
                              setIngredientSearch(ing.name);
                            }}
                          >
                            <div className="text-slate-900">{ing.name}</div>
                            <div className="text-slate-500">
                              {ing.servingSize} {ing.servingUnit} •{" "}
                              {ing.calories} cal
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                {selectedIngredient && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Quantity"
                      className="w-32"
                    />
                    <select
                      value={unit}
                      onChange={(e) =>
                        setUnit(e.target.value as "grams" | "serving")
                      }
                      className="border border-slate-300 rounded px-3"
                    >
                      <option value="serving">Serving</option>
                      <option value="grams">Grams</option>
                    </select>
                    <Button
                      type="button"
                      onClick={handleAddIngredient}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-slate-500">
                Search for an ingredient, then enter quantity and unit
              </p>
            </div>

            {/* Ingredients List */}
            {recipeItems.length > 0 && (
              <div className="space-y-2">
                <Label>Ingredients ({recipeItems.length})</Label>
                <div className="space-y-2">
                  {recipeItems.map((item) => {
                    const ingredient = ingredients.find(
                      (ing: { id: string }) => ing.id === item.ingredientId,
                    );
                    if (!ingredient) return null;

                    let factor = 1;
                    if (item.unit === "serving") {
                      factor = item.quantity;
                    } else {
                      factor = item.quantity / ingredient.gramsPerServing;
                    }

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div>
                          <div className="text-slate-900">
                            {item.ingredientName} ({item.quantity} {item.unit})
                          </div>
                          <div className="text-slate-500 flex gap-3">
                            <span>
                              {Math.round(ingredient.calories * factor)} cal
                            </span>
                            <span>
                              P:{" "}
                              {Math.round(ingredient.protein * factor * 10) /
                                10}
                              g
                            </span>
                            <span>
                              C:{" "}
                              {Math.round(ingredient.carbs * factor * 10) / 10}g
                            </span>
                            <span>
                              F: {Math.round(ingredient.fat * factor * 10) / 10}
                              g
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveIngredient(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Macro Summary */}
            {recipeItems.length > 0 && (
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
              disabled={!title.trim() || recipeItems.length === 0}
            >
              Save Recipe
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Saved Recipes */}
      <div>
        <h3 className="mb-4">Saved Recipes ({recipes.length})</h3>
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No recipes yet. Create one above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map((recipe: (typeof recipes)[0]) => (
              <Card
                key={recipe.id}
                className="hover:shadow-md transition-shadow"
              >
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
                      <div className="text-slate-900">
                        {Math.round(recipe.calories)}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500">Protein</p>
                      <div className="text-slate-900">
                        {Math.round(recipe.protein)}g
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500">Carbs</p>
                      <div className="text-slate-900">
                        {Math.round(recipe.carbs)}g
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500">Fat</p>
                      <div className="text-slate-900">
                        {Math.round(recipe.fat)}g
                      </div>
                    </div>
                  </div>
                  {recipe.description && (
                    <div>
                      <p className="text-slate-500">Description</p>
                      <p className="text-slate-900 line-clamp-2">
                        {recipe.description}
                      </p>
                    </div>
                  )}
                  {recipe.instructions && (
                    <div>
                      <p className="text-slate-500">Instructions</p>
                      <p className="text-slate-900 whitespace-pre-line line-clamp-3">
                        {recipe.instructions}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-slate-500">Ingredients</p>
                    <p className="text-slate-900">
                      {recipe.items.length} items
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() =>
                        deleteRecipeMutation.mutate({ id: recipe.id })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
