import { ingredientRouter } from "./routers/ingredient";
import { recipeRouter } from "./routers/recipe";
import { router } from "./trpc";

export const appRouter = router({
  ingredient: ingredientRouter,
  recipe: recipeRouter,
});

export type AppRouter = typeof appRouter;
