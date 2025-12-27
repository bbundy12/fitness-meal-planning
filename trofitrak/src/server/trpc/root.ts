import { ingredientRouter } from "./routers/ingredient";
import { recipeRouter } from "./routers/recipe";
import { mealPlanRouter } from "./routers/mealPlan";
import { shoppingRouter } from "./routers/shopping";
import { router } from "./trpc";

export const appRouter = router({
  ingredient: ingredientRouter,
  recipe: recipeRouter,
  mealPlan: mealPlanRouter,
  shopping: shoppingRouter,
});

export type AppRouter = typeof appRouter;
