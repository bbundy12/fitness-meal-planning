import { ingredientRouter } from "./routers/ingredient";
import { recipeRouter } from "./routers/recipe";
import { mealPlanRouter } from "./routers/mealPlan";
import { shoppingRouter } from "./routers/shopping";
import { inbodyRouter } from "./routers/inbody";
import { router } from "./trpc";

export const appRouter = router({
  ingredient: ingredientRouter,
  recipe: recipeRouter,
  mealPlan: mealPlanRouter,
  shopping: shoppingRouter,
  inbody: inbodyRouter,
});

export type AppRouter = typeof appRouter;
