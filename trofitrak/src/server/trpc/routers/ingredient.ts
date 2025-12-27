import { z } from "zod";
import { publicProcedure, router } from "../trpc";

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

  create: publicProcedure
    .input(ingredientInputSchema)
    .mutation(async ({ ctx, input }) => {
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
      }),
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

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.ingredient.delete({
        where: {
          id: input.id,
          userId: ctx.userId,
        },
      });
    }),
});
