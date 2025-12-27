"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Plus, Clock, Copy, RotateCcw } from "lucide-react";
import { Progress } from "./ui/progress";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { trpc } from "@/lib/trpc";
import { getCurrentWeekStart, dayIndexFromName } from "@/lib/week";

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

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

type SlotKey = keyof DayPlan;

const SLOT_TO_ENUM: Record<SlotKey, string> = {
  breakfast: "BREAKFAST",
  snack1: "SNACK1",
  lunch: "LUNCH",
  snack2: "SNACK2",
  dinner: "DINNER",
  snack3: "SNACK3",
};

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
  const utils = trpc.useUtils();

  // Get current week start date
  const weekStartDate = useMemo(() => {
    return getCurrentWeekStart();
  }, []);

  // Load week plan from DB
  const { data: weekData, isLoading } = trpc.mealPlan.getWeek.useQuery({
    weekStartDate,
  });

  // Get available recipes for drag/drop
  const { data: recipes = [] } = trpc.recipe.list.useQuery();

  // Convert recipes to the format expected by UI
  const availableRecipes: Recipe[] = recipes.slice(0, 6).map((r) => ({
    id: r.id,
    title: r.title,
    servings: r.servings,
    calories: r.calories,
    protein: r.protein,
    carbs: r.carbs,
    fat: r.fat,
  }));

  // Convert DB data to UI format
  const weekPlan = useMemo(() => {
    const plan = createEmptyWeekPlan();

    if (!weekData?.items) return plan;

    for (const item of weekData.items) {
      const dayName = DAYS[item.dayOfWeek];
      const slotKey = Object.keys(SLOT_TO_ENUM).find(
        (key) => SLOT_TO_ENUM[key as SlotKey] === item.slot,
      ) as SlotKey | undefined;

      if (dayName && slotKey) {
        plan[dayName][slotKey] = {
          id: `${dayName}-${slotKey}`,
          recipe: {
            id: item.recipe.id,
            title: item.recipe.title,
            servings: item.recipe.servings,
            calories: item.recipe.calories * item.servingsMult,
            protein: item.recipe.protein * item.servingsMult,
            carbs: item.recipe.carbs * item.servingsMult,
            fat: item.recipe.fat * item.servingsMult,
          },
        };
      }
    }

    return plan;
  }, [weekData]);

  // Mutations with optimistic updates
  const upsertItemMutation = trpc.mealPlan.upsertItem.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await utils.mealPlan.getWeek.cancel({ weekStartDate });

      // Snapshot previous value
      const previousData = utils.mealPlan.getWeek.getData({ weekStartDate });

      // Optimistically update
      utils.mealPlan.getWeek.setData({ weekStartDate }, (old) => {
        if (!old) return old;

        const newItems = [...(old.items || [])];
        const existingIndex = newItems.findIndex(
          (item) =>
            item.dayOfWeek === variables.dayOfWeek &&
            item.slot === variables.slot,
        );

        const recipe = recipes.find((r) => r.id === variables.recipeId);
        if (!recipe) return old;

        const newItem = {
          id:
            existingIndex >= 0
              ? newItems[existingIndex].id
              : `temp-${Date.now()}`,
          weekId: old.id || "",
          dayOfWeek: variables.dayOfWeek,
          slot: variables.slot as
            | "BREAKFAST"
            | "SNACK1"
            | "LUNCH"
            | "SNACK2"
            | "DINNER"
            | "SNACK3",
          recipeId: variables.recipeId,
          servingsMult: variables.servingsMult || 1,
          recipe: {
            id: recipe.id,
            title: recipe.title,
            calories: recipe.calories,
            protein: recipe.protein,
            carbs: recipe.carbs,
            fat: recipe.fat,
            servings: recipe.servings,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
          newItems[existingIndex] = newItem;
        } else {
          newItems.push(newItem);
        }

        return { ...old, items: newItems };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.mealPlan.getWeek.setData({ weekStartDate }, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      utils.mealPlan.getWeek.invalidate({ weekStartDate });
    },
  });

  const removeItemMutation = trpc.mealPlan.removeItem.useMutation({
    onMutate: async (variables) => {
      await utils.mealPlan.getWeek.cancel({ weekStartDate });
      const previousData = utils.mealPlan.getWeek.getData({ weekStartDate });

      utils.mealPlan.getWeek.setData({ weekStartDate }, (old) => {
        if (!old) return old;

        const newItems = (old.items || []).filter(
          (item) =>
            !(
              item.dayOfWeek === variables.dayOfWeek &&
              item.slot === variables.slot
            ),
        );

        return { ...old, items: newItems };
      });

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        utils.mealPlan.getWeek.setData({ weekStartDate }, context.previousData);
      }
    },
    onSettled: () => {
      utils.mealPlan.getWeek.invalidate({ weekStartDate });
    },
  });

  const resetWeekMutation = trpc.mealPlan.resetWeek.useMutation({
    onSuccess: () => {
      utils.mealPlan.getWeek.invalidate({ weekStartDate });
    },
  });

  const copyDayToAllMutation = trpc.mealPlan.copyDayToAll.useMutation({
    onSuccess: () => {
      utils.mealPlan.getWeek.invalidate({ weekStartDate });
    },
  });
  // Daily macro goals (would come from Dashboard in real app)
  const dailyGoals = {
    calories: 2250,
    protein: 169,
    carbs: 225,
    fat: 75,
  };

  // Mock recipes for drag and drop
  // NOTE: Using real recipes from DB above (availableRecipes)

  const [draggedRecipe, setDraggedRecipe] = useState<Recipe | null>(null);
  const [repeatDaily, setRepeatDaily] = useState(false);

  const handleDragStart = (recipe: Recipe) => {
    setDraggedRecipe(recipe);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (day: string, mealType: keyof DayPlan) => {
    if (!draggedRecipe) return;

    const dayIndex = dayIndexFromName(day);
    const slotEnum = SLOT_TO_ENUM[mealType] as
      | "BREAKFAST"
      | "SNACK1"
      | "LUNCH"
      | "SNACK2"
      | "DINNER"
      | "SNACK3";

    if (repeatDaily) {
      // Apply to all days when in repeat mode
      for (const d of DAYS) {
        const dIndex = dayIndexFromName(d);
        upsertItemMutation.mutate({
          weekStartDate,
          dayOfWeek: dIndex,
          slot: slotEnum,
          recipeId: draggedRecipe.id,
          servingsMult: 1,
        });
      }
    } else {
      // Apply only to selected day
      upsertItemMutation.mutate({
        weekStartDate,
        dayOfWeek: dayIndex,
        slot: slotEnum,
        recipeId: draggedRecipe.id,
        servingsMult: 1,
      });
    }
    setDraggedRecipe(null);
  };

  const handleRemoveMeal = (day: string, mealType: keyof DayPlan) => {
    const dayIndex = dayIndexFromName(day);
    const slotEnum = SLOT_TO_ENUM[mealType] as
      | "BREAKFAST"
      | "SNACK1"
      | "LUNCH"
      | "SNACK2"
      | "DINNER"
      | "SNACK3";

    if (repeatDaily) {
      // Remove from all days when in repeat mode
      for (const d of DAYS) {
        const dIndex = dayIndexFromName(d);
        removeItemMutation.mutate({
          weekStartDate,
          dayOfWeek: dIndex,
          slot: slotEnum,
        });
      }
    } else {
      // Remove only from selected day
      removeItemMutation.mutate({
        weekStartDate,
        dayOfWeek: dayIndex,
        slot: slotEnum,
      });
    }
  };

  const copyMondayToAllDays = () => {
    const mondayIndex = dayIndexFromName("Mon");
    copyDayToAllMutation.mutate({
      weekStartDate,
      fromDayOfWeek: mondayIndex,
    });
  };

  const resetWeekPlan = () => {
    if (
      window.confirm(
        "Are you sure you want to reset the entire week? This will clear all meals.",
      )
    ) {
      resetWeekMutation.mutate({ weekStartDate });
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
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  };

  const weekTotals = getWeekTotals();
  const weekAverage = {
    calories: Math.round(weekTotals.calories / 7),
    protein: Math.round(weekTotals.protein / 7),
    carbs: Math.round(weekTotals.carbs / 7),
    fat: Math.round(weekTotals.fat / 7),
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl">Meal Planner</h2>
        <div className="text-center py-8 text-slate-500">
          Loading meal plan...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl">Meal Planner</h2>
          <p className="text-slate-500">
            Click on any meal slot to browse and select recipes
          </p>
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
                <Switch
                  id="repeat-mode"
                  checked={repeatDaily}
                  onCheckedChange={setRepeatDaily}
                />
              </div>
              <p className="text-slate-500">
                {repeatDaily
                  ? "Changes apply to all days - plan once and repeat"
                  : "Plan different meals for each day of the week"}
              </p>
            </div>
            {!repeatDaily && (
              <Button
                variant="outline"
                onClick={copyMondayToAllDays}
                className="ml-4"
              >
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
                      {dayTotals.calories} cal | P: {dayTotals.protein}g | C:{" "}
                      {dayTotals.carbs}g | F: {dayTotals.fat}g
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
                        value={getProgress(
                          dayTotals.calories,
                          dailyGoals.calories,
                        )}
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
                        value={getProgress(
                          dayTotals.protein,
                          dailyGoals.protein,
                        )}
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
                  {(
                    [
                      "breakfast",
                      "snack1",
                      "lunch",
                      "snack2",
                      "dinner",
                      "snack3",
                    ] as const
                  ).map((mealType) => {
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
                        onClick={() =>
                          onNavigateToRecipeSelector?.(day, mealType)
                        }
                        className={`p-4 rounded-lg border-2 border-dashed min-h-[120px] transition-colors text-left ${
                          slot.recipe
                            ? "border-rose-300 bg-rose-50"
                            : "border-slate-200 bg-slate-50 hover:border-rose-300 hover:bg-rose-50"
                        }`}
                      >
                        <div className="text-slate-500 mb-2 capitalize">
                          {displayName}
                        </div>
                        {slot.recipe ? (
                          <div className="space-y-2">
                            <div className="text-slate-900">
                              {slot.recipe.title}
                            </div>
                            <div className="text-slate-600">
                              {slot.recipe.calories} cal
                            </div>
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
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
