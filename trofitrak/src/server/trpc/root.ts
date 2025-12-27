import { ingredientRouter } from "./routers/ingredient";
import { recipeRouter } from "./routers/recipe";
import { mealPlanRouter } from "./routers/mealPlan";
import { router } from "./trpc";

export const appRouter = router({
  ingredient: ingredientRouter,
  recipe: recipeRouter,
  mealPlan: mealPlanRouter,
});

export type AppRouter = typeof appRouter;
