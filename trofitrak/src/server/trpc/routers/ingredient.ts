import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { searchFoods, getFoodDetails, mapNutrientsToMacros } from "../../providers/usda";

const ingredientInputSchema = z.object({
  name: z.string().min(1),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  servingSize: z.number().min(0.1),
  servingUnit: z.string().min(1),
  gramsPerServing: z.number().min(0.1),
  source: z.enum(["MANUAL", "USDA"]),
  sourceId: z.string().nullable().optional(),
});

export const ingredientRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.ingredient.findMany({
      where: { userId: ctx.userId },
      orderBy: { name: "asc" },
    });
  }),

  searchLocal: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      const query = input.query.toLowerCase();
      return ctx.db.ingredient.findMany({
        where: {
          userId: ctx.userId,
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        orderBy: { name: "asc" },
      });
    }),

  create: publicProcedure.input(ingredientInputSchema).mutation(async ({ ctx, input }) => {
    return ctx.db.ingredient.create({
      data: {
        userId: ctx.userId,
        ...input,
      },
    });
  }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        data: ingredientInputSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.ingredient.update({
        where: {
          id: input.id,
          userId: ctx.userId,
        },
        data: input.data,
      });
    }),

  delete: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    return ctx.db.ingredient.delete({
      where: {
        id: input.id,
        userId: ctx.userId,
      },
    });
  }),

  /**
   * searchExternal: Search USDA FoodData Central for ingredients
   * Returns top results without saving to database
   */
  searchExternal: publicProcedure
    .input(
      z.object({
        query: z.string().min(2).max(100),
      })
    )
    .query(async ({ input }) => {
      return searchFoods(input.query);
    }),

  /**
   * importExternal: Import a USDA ingredient into the database
   * Creates a new Ingredient with source=USDA and sourceId=fdcId
   * Prevents duplicates via unique constraint on (userId, source, sourceId)
   */
  importExternal: publicProcedure
    .input(
      z.object({
        fdcId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const sourceId = String(input.fdcId);

      // Check if already imported
      const existing = await ctx.db.ingredient.findUnique({
        where: {
          userId_source_sourceId: {
            userId: ctx.userId,
            source: "USDA",
            sourceId,
          },
        },
      });

      if (existing) {
        return existing;
      }

      // Fetch USDA details
      const foodDetails = await getFoodDetails(input.fdcId);

      // Map nutrients to macros (per 100g)
      const macros = mapNutrientsToMacros(foodDetails.foodNutrients);

      // Create ingredient
      return ctx.db.ingredient.create({
        data: {
          userId: ctx.userId,
          name: foodDetails.description.trim(),
          calories: macros.calories,
          protein: macros.protein,
          carbs: macros.carbs,
          fat: macros.fat,
          servingSize: 100,
          servingUnit: "g",
          gramsPerServing: 100,
          source: "USDA",
          sourceId,
        },
      });
    }),
});
