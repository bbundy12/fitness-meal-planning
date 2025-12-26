"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ArrowLeft, Search } from "lucide-react";

interface Recipe {
  id: string;
  title: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  instructions?: string;
}

interface RecipeSelectorProps {
  context: {
    day: string;
    mealType: string;
  } | null;
  onSelectRecipe: (recipe: Recipe) => void;
  onBack: () => void;
}

export function RecipeSelector({ context, onSelectRecipe, onBack }: RecipeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  if (!context) {
    return <div>Loading...</div>;
  }

  const { day, mealType } = context;

  // Mock recipe database (would come from Supabase in real app)
  const allRecipes: Recipe[] = [
    {
      id: "r1",
      title: "Grilled Chicken with Rice",
      servings: 1,
      calories: 520,
      protein: 45,
      carbs: 52,
      fat: 12,
      instructions: "Grill chicken, cook rice, serve together",
    },
    {
      id: "r2",
      title: "Salmon and Sweet Potato",
      servings: 1,
      calories: 480,
      protein: 38,
      carbs: 45,
      fat: 18,
      instructions: "Bake salmon, roast sweet potato",
    },
    {
      id: "r3",
      title: "Greek Yogurt Parfait",
      servings: 1,
      calories: 280,
      protein: 24,
      carbs: 36,
      fat: 6,
      instructions: "Layer yogurt, berries, and granola",
    },
    {
      id: "r4",
      title: "Protein Smoothie",
      servings: 1,
      calories: 320,
      protein: 30,
      carbs: 28,
      fat: 10,
      instructions: "Blend protein powder, banana, almond milk",
    },
    {
      id: "r5",
      title: "Turkey Sandwich",
      servings: 1,
      calories: 420,
      protein: 32,
      carbs: 48,
      fat: 12,
      instructions: "Assemble turkey, veggies, whole wheat bread",
    },
    {
      id: "r6",
      title: "Egg White Omelet",
      servings: 1,
      calories: 250,
      protein: 28,
      carbs: 12,
      fat: 8,
      instructions: "Cook egg whites with veggies and cheese",
    },
    {
      id: "r7",
      title: "Chicken Stir Fry",
      servings: 1,
      calories: 380,
      protein: 35,
      carbs: 38,
      fat: 10,
      instructions: "Stir fry chicken with mixed vegetables",
    },
    {
      id: "r8",
      title: "Tuna Salad Bowl",
      servings: 1,
      calories: 340,
      protein: 30,
      carbs: 25,
      fat: 14,
      instructions: "Mix tuna with greens and olive oil",
    },
    {
      id: "r9",
      title: "Overnight Oats",
      servings: 1,
      calories: 350,
      protein: 15,
      carbs: 52,
      fat: 8,
      instructions: "Mix oats, protein powder, milk, refrigerate overnight",
    },
    {
      id: "r10",
      title: "Beef and Broccoli",
      servings: 1,
      calories: 450,
      protein: 40,
      carbs: 30,
      fat: 18,
      instructions: "Sauté beef with broccoli and soy sauce",
    },
  ];

  const filteredRecipes = allRecipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl">Select Recipe</h2>
          <p className="text-slate-500">
            {context ? `Choose a recipe for ${day} ${mealType}` : "Browse all recipes"}
          </p>
        </div>
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Recipe Grid */}
      <div>
        <h3 className="mb-4">
          {searchQuery
            ? `Search Results (${filteredRecipes.length})`
            : `All Recipes (${filteredRecipes.length})`}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectRecipe(recipe)}
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
                    <div className="text-slate-900">{recipe.calories}</div>
                  </div>
                  <div>
                    <p className="text-slate-500">Protein</p>
                    <div className="text-slate-900">{recipe.protein}g</div>
                  </div>
                  <div>
                    <p className="text-slate-500">Carbs</p>
                    <div className="text-slate-900">{recipe.carbs}g</div>
                  </div>
                  <div>
                    <p className="text-slate-500">Fat</p>
                    <div className="text-slate-900">{recipe.fat}g</div>
                  </div>
                </div>
                {recipe.instructions && (
                  <div>
                    <p className="text-slate-500">Instructions</p>
                    <p className="text-slate-900 line-clamp-2">{recipe.instructions}</p>
                  </div>
                )}
                <Button className="w-full bg-rose-600 hover:bg-rose-700">Add to {mealType}</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
