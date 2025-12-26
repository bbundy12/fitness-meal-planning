"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Plus, Clock, Copy, RotateCcw } from "lucide-react";
import { Progress } from "./ui/progress";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

interface MealSlot {
  id: string;
  recipe: Recipe | null;
}

interface DayPlan {
  breakfast: MealSlot;
  snack1: MealSlot;
  lunch: MealSlot;
  snack2: MealSlot;
  dinner: MealSlot;
  snack3: MealSlot;
}

interface Recipe {
  id: string;
  title: string;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealPlannerProps {
  onNavigateToRecipeSelector?: (day: string, mealType: string) => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const buildEmptyDayPlan = (day: string): DayPlan => ({
  breakfast: { id: `${day}-breakfast`, recipe: null },
  snack1: { id: `${day}-snack1`, recipe: null },
  lunch: { id: `${day}-lunch`, recipe: null },
  snack2: { id: `${day}-snack2`, recipe: null },
  dinner: { id: `${day}-dinner`, recipe: null },
  snack3: { id: `${day}-snack3`, recipe: null },
});

const createEmptyWeekPlan = () =>
  DAYS.reduce<Record<string, DayPlan>>((acc, day) => {
    acc[day] = buildEmptyDayPlan(day);
    return acc;
  }, {});

export function MealPlanner({ onNavigateToRecipeSelector }: MealPlannerProps) {
  // Daily macro goals (would come from Dashboard in real app)
  const dailyGoals = {
    calories: 2250,
    protein: 169,
    carbs: 225,
    fat: 75,
  };

  // Mock recipes for drag and drop
  const availableRecipes: Recipe[] = [
    {
      id: "r1",
      title: "Grilled Chicken with Rice",
      servings: 2,
      calories: 520,
      protein: 45,
      carbs: 52,
      fat: 12,
    },
    {
      id: "r2",
      title: "Salmon and Sweet Potato",
      servings: 2,
      calories: 480,
      protein: 38,
      carbs: 45,
      fat: 18,
    },
    {
      id: "r3",
      title: "Greek Yogurt Parfait",
      servings: 2,
      calories: 280,
      protein: 24,
      carbs: 36,
      fat: 6,
    },
    {
      id: "r4",
      title: "Protein Smoothie",
      servings: 2,
      calories: 320,
      protein: 30,
      carbs: 28,
      fat: 10,
    },
    {
      id: "r5",
      title: "Turkey Sandwich",
      servings: 2,
      calories: 420,
      protein: 32,
      carbs: 48,
      fat: 12,
    },
    {
      id: "r6",
      title: "Egg White Omelet",
      servings: 2,
      calories: 250,
      protein: 28,
      carbs: 12,
      fat: 8,
    },
  ];

  const [draggedRecipe, setDraggedRecipe] = useState<Recipe | null>(null);
  const [repeatDaily, setRepeatDaily] = useState(false);
  const [weekPlan, setWeekPlan] = useState<Record<string, DayPlan>>(() => createEmptyWeekPlan());

  const handleDragStart = (recipe: Recipe) => {
    setDraggedRecipe(recipe);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (day: string, mealType: keyof DayPlan) => {
    if (!draggedRecipe) return;

    if (repeatDaily) {
      // Apply to all days when in repeat mode
      const updatedPlan = { ...weekPlan };
      DAYS.forEach((d) => {
        updatedPlan[d] = {
          ...updatedPlan[d],
          [mealType]: { ...updatedPlan[d][mealType], recipe: draggedRecipe },
        };
      });
      setWeekPlan(updatedPlan);
    } else {
      // Apply only to selected day
      setWeekPlan({
        ...weekPlan,
        [day]: {
          ...weekPlan[day],
          [mealType]: { ...weekPlan[day][mealType], recipe: draggedRecipe },
        },
      });
    }
    setDraggedRecipe(null);
  };

  const handleRemoveMeal = (day: string, mealType: keyof DayPlan) => {
    if (repeatDaily) {
      // Remove from all days when in repeat mode
      const updatedPlan = { ...weekPlan };
      DAYS.forEach((d) => {
        updatedPlan[d] = {
          ...updatedPlan[d],
          [mealType]: { ...updatedPlan[d][mealType], recipe: null },
        };
      });
      setWeekPlan(updatedPlan);
    } else {
      // Remove only from selected day
      setWeekPlan({
        ...weekPlan,
        [day]: {
          ...weekPlan[day],
          [mealType]: { ...weekPlan[day][mealType], recipe: null },
        },
      });
    }
  };

  const copyMondayToAllDays = () => {
    const mondayPlan = weekPlan.Monday;
    const updatedPlan = { ...weekPlan };
    DAYS.forEach((day) => {
      if (day !== "Monday") {
        updatedPlan[day] = {
          breakfast: {
            ...updatedPlan[day].breakfast,
            recipe: mondayPlan.breakfast.recipe,
          },
          snack1: {
            ...updatedPlan[day].snack1,
            recipe: mondayPlan.snack1.recipe,
          },
          lunch: { ...updatedPlan[day].lunch, recipe: mondayPlan.lunch.recipe },
          snack2: {
            ...updatedPlan[day].snack2,
            recipe: mondayPlan.snack2.recipe,
          },
          dinner: {
            ...updatedPlan[day].dinner,
            recipe: mondayPlan.dinner.recipe,
          },
          snack3: {
            ...updatedPlan[day].snack3,
            recipe: mondayPlan.snack3.recipe,
          },
        };
      }
    });
    setWeekPlan(updatedPlan);
  };

  const resetWeekPlan = () => {
    if (
      window.confirm("Are you sure you want to reset the entire week? This will clear all meals.")
    ) {
      setWeekPlan(createEmptyWeekPlan());
    }
  };

  const getDayTotals = (dayPlan: DayPlan) => {
    const meals = [
      dayPlan.breakfast,
      dayPlan.snack1,
      dayPlan.lunch,
      dayPlan.snack2,
      dayPlan.dinner,
      dayPlan.snack3,
    ];
    return meals.reduce(
      (acc, slot) => {
        if (slot.recipe) {
          return {
            calories: acc.calories + slot.recipe.calories,
            protein: acc.protein + slot.recipe.protein,
            carbs: acc.carbs + slot.recipe.carbs,
            fat: acc.fat + slot.recipe.fat,
          };
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getWeekTotals = () => {
    return DAYS.reduce(
      (acc, day) => {
        const dayTotals = getDayTotals(weekPlan[day]);
        return {
          calories: acc.calories + dayTotals.calories,
          protein: acc.protein + dayTotals.protein,
          carbs: acc.carbs + dayTotals.carbs,
          fat: acc.fat + dayTotals.fat,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const weekTotals = getWeekTotals();
  const weekAverage = {
    calories: Math.round(weekTotals.calories / 7),
    protein: Math.round(weekTotals.protein / 7),
    carbs: Math.round(weekTotals.carbs / 7),
    fat: Math.round(weekTotals.fat / 7),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl">Meal Planner</h2>
          <p className="text-slate-500">Click on any meal slot to browse and select recipes</p>
        </div>
        <Button
          variant="outline"
          onClick={resetWeekPlan}
          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset Week
        </Button>
      </div>

      {/* Weekly Summary */}
      <Card className="bg-rose-50 border-rose-200">
        <CardHeader>
          <CardTitle>Weekly Average</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-500">Calories/day</p>
              <div className="text-slate-900">{weekAverage.calories}</div>
            </div>
            <div>
              <p className="text-slate-500">Protein</p>
              <div className="text-slate-900">{weekAverage.protein}g</div>
            </div>
            <div>
              <p className="text-slate-500">Carbs</p>
              <div className="text-slate-900">{weekAverage.carbs}g</div>
            </div>
            <div>
              <p className="text-slate-500">Fat</p>
              <div className="text-slate-900">{weekAverage.fat}g</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frequently Used Recipes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-500" />
            <CardTitle>Frequently Used Recipes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {availableRecipes.slice(0, 6).map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                draggable
                onDragStart={() => handleDragStart(recipe)}
                onClick={() => handleDragStart(recipe)}
                className="px-3 py-2 bg-rose-100 text-rose-800 rounded-lg cursor-move hover:bg-rose-200 transition-colors text-left"
              >
                <div>{recipe.title}</div>
                <div className="text-rose-600">{recipe.calories} cal</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Planning Mode Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="repeat-mode">Repeat Daily Mode</Label>
                <Switch id="repeat-mode" checked={repeatDaily} onCheckedChange={setRepeatDaily} />
              </div>
              <p className="text-slate-500">
                {repeatDaily
                  ? "Changes apply to all days - plan once and repeat"
                  : "Plan different meals for each day of the week"}
              </p>
            </div>
            {!repeatDaily && (
              <Button variant="outline" onClick={copyMondayToAllDays} className="ml-4">
                <Copy className="mr-2 h-4 w-4" />
                Copy Monday to All Days
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Calendar */}
      <div className="space-y-4">
        {DAYS.map((day) => {
          const dayTotals = getDayTotals(weekPlan[day]);
          return (
            <Card key={day}>
              <CardHeader>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>{day}</CardTitle>
                    <Badge variant="outline">
                      {dayTotals.calories} cal | P: {dayTotals.protein}g | C: {dayTotals.carbs}g |
                      F: {dayTotals.fat}g
                    </Badge>
                  </div>

                  {/* Daily Goals Progress */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-slate-50 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Calories</span>
                        <span className="text-slate-900">
                          {dayTotals.calories}/{dailyGoals.calories}
                        </span>
                      </div>
                      <Progress
                        value={getProgress(dayTotals.calories, dailyGoals.calories)}
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Protein</span>
                        <span className="text-slate-900">
                          {dayTotals.protein}g/{dailyGoals.protein}g
                        </span>
                      </div>
                      <Progress
                        value={getProgress(dayTotals.protein, dailyGoals.protein)}
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Carbs</span>
                        <span className="text-slate-900">
                          {dayTotals.carbs}g/{dailyGoals.carbs}g
                        </span>
                      </div>
                      <Progress
                        value={getProgress(dayTotals.carbs, dailyGoals.carbs)}
                        className="h-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Fat</span>
                        <span className="text-slate-900">
                          {dayTotals.fat}g/{dailyGoals.fat}g
                        </span>
                      </div>
                      <Progress
                        value={getProgress(dayTotals.fat, dailyGoals.fat)}
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {(["breakfast", "snack1", "lunch", "snack2", "dinner", "snack3"] as const).map(
                    (mealType) => {
                      const slot = weekPlan[day][mealType];
                      // Format display name for snacks
                      const displayName = mealType.startsWith("snack")
                        ? `Snack ${mealType.charAt(mealType.length - 1)}`
                        : mealType;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(day, mealType)}
                          onClick={() => onNavigateToRecipeSelector?.(day, mealType)}
                          className={`p-4 rounded-lg border-2 border-dashed min-h-[120px] transition-colors text-left ${
                            slot.recipe
                              ? "border-rose-300 bg-rose-50"
                              : "border-slate-200 bg-slate-50 hover:border-rose-300 hover:bg-rose-50"
                          }`}
                        >
                          <div className="text-slate-500 mb-2 capitalize">{displayName}</div>
                          {slot.recipe ? (
                            <div className="space-y-2">
                              <div className="text-slate-900">{slot.recipe.title}</div>
                              <div className="text-slate-600">{slot.recipe.calories} cal</div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigateToRecipeSelector?.(day, mealType);
                                  }}
                                  className="text-rose-600 hover:text-rose-700 p-0 h-auto"
                                >
                                  Change
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveMeal(day, mealType);
                                  }}
                                  className="text-red-600 hover:text-red-700 p-0 h-auto"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                              <Plus className="h-8 w-8 mb-1" />
                              <span className="text-slate-500">Click to add</span>
                            </div>
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
