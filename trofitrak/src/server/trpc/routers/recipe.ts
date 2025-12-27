import { z } from "zod";
import { calculateRecipeMacros } from "../../../lib/macroMath";
import { publicProcedure, router } from "../trpc";

const recipeItemInputSchema = z.object({
  ingredientId: z.string(),
  quantity: z.number().min(0.1),
  unit: z.enum(["grams", "serving"]),
});

const recipeInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  instructions: z.string().optional(),
  servings: z.number().min(1),
  items: z.array(recipeItemInputSchema),
});

export const recipeRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.recipe.findMany({
      where: { userId: ctx.userId },
      include: {
        items: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  get: publicProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.db.recipe.findUnique({
      where: {
        id: input.id,
        userId: ctx.userId,
      },
      include: {
        items: {
          include: {
            ingredient: true,
          },
        },
      },
    });
  }),

  create: publicProcedure.input(recipeInputSchema).mutation(async ({ ctx, input }) => {
    const { items: itemsInput, ...recipeData } = input;

    // Get all ingredients to calculate macros
    const ingredients = await ctx.db.ingredient.findMany({
      where: {
        id: { in: itemsInput.map((item) => item.ingredientId) },
        userId: ctx.userId,
      },
    });

    // Calculate recipe totals
    const itemsForCalculation = itemsInput.map((item) => {
      const ingredient = ingredients.find((ing: { id: string }) => ing.id === item.ingredientId);
      if (!ingredient) {
        throw new Error(`Ingredient ${item.ingredientId} not found`);
      }
      return {
        ...item,
        ingredient: {
          calories: ingredient.calories,
          protein: ingredient.protein,
          carbs: ingredient.carbs,
          fat: ingredient.fat,
          gramsPerServing: ingredient.gramsPerServing,
        },
      };
    });

    const totals = calculateRecipeMacros(itemsForCalculation);

    return ctx.db.recipe.create({
      data: {
        userId: ctx.userId,
        ...recipeData,
        calories: totals.calories,
        protein: totals.protein,
        carbs: totals.carbs,
        fat: totals.fat,
        items: {
          create: itemsInput,
        },
      },
      include: {
        items: {
          include: {
            ingredient: true,
          },
        },
      },
    });
  }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        data: recipeInputSchema.partial().omit({ items: true }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.recipe.update({
        where: {
          id: input.id,
          userId: ctx.userId,
        },
        data: input.data,
        include: {
          items: {
            include: {
              ingredient: true,
            },
          },
        },
      });
    }),

  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.db.recipe.delete({
      where: {
        id: input.id,
        userId: ctx.userId,
      },
    });
  }),
});
