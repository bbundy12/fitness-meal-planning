import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { getWeekStartDate } from "../../../lib/week";

const mealSlotEnum = z.enum(["BREAKFAST", "SNACK1", "LUNCH", "SNACK2", "DINNER", "SNACK3"]);

export const mealPlanRouter = router({
  getWeek: publicProcedure
    .input(z.object({ weekStartDate: z.string() }))
    .query(async ({ ctx, input }) => {
      const weekDate = new Date(input.weekStartDate);
      const normalizedDate = getWeekStartDate(weekDate);

      const week = await ctx.db.mealPlanWeek.findUnique({
        where: {
          userId_weekStartDate: {
            userId: ctx.userId,
            weekStartDate: normalizedDate,
          },
        },
        include: {
          items: {
            include: {
              recipe: {
                select: {
                  id: true,
                  title: true,
                  calories: true,
                  protein: true,
                  carbs: true,
                  fat: true,
                  servings: true,
                },
              },
            },
          },
        },
      });

      // Return week with items, or empty structure if doesn't exist
      return (
        week || {
          id: "",
          userId: ctx.userId,
          weekStartDate: normalizedDate,
          items: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );
    }),

  upsertItem: publicProcedure
    .input(
      z.object({
        weekStartDate: z.string(),
        dayOfWeek: z.number().min(0).max(6),
        slot: mealSlotEnum,
        recipeId: z.string(),
        servingsMult: z.number().min(0.1).max(10).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const weekDate = new Date(input.weekStartDate);
      const normalizedDate = getWeekStartDate(weekDate);

      // Ensure week exists (create if missing)
      const week = await ctx.db.mealPlanWeek.upsert({
        where: {
          userId_weekStartDate: {
            userId: ctx.userId,
            weekStartDate: normalizedDate,
          },
        },
        create: {
          userId: ctx.userId,
          weekStartDate: normalizedDate,
        },
        update: {},
      });

      // Upsert the meal item
      const item = await ctx.db.mealPlanItem.upsert({
        where: {
          weekId_dayOfWeek_slot: {
            weekId: week.id,
            dayOfWeek: input.dayOfWeek,
            slot: input.slot,
          },
        },
        create: {
          weekId: week.id,
          dayOfWeek: input.dayOfWeek,
          slot: input.slot,
          recipeId: input.recipeId,
          servingsMult: input.servingsMult,
        },
        update: {
          recipeId: input.recipeId,
          servingsMult: input.servingsMult,
        },
        include: {
          recipe: {
            select: {
              id: true,
              title: true,
              calories: true,
              protein: true,
              carbs: true,
              fat: true,
              servings: true,
            },
          },
        },
      });

      return item;
    }),

  removeItem: publicProcedure
    .input(
      z.object({
        weekStartDate: z.string(),
        dayOfWeek: z.number().min(0).max(6),
        slot: mealSlotEnum,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const weekDate = new Date(input.weekStartDate);
      const normalizedDate = getWeekStartDate(weekDate);

      // Find week
      const week = await ctx.db.mealPlanWeek.findUnique({
        where: {
          userId_weekStartDate: {
            userId: ctx.userId,
            weekStartDate: normalizedDate,
          },
        },
      });

      if (!week) return { success: true }; // Nothing to delete

      // Delete item if exists (no error if missing)
      await ctx.db.mealPlanItem.deleteMany({
        where: {
          weekId: week.id,
          dayOfWeek: input.dayOfWeek,
          slot: input.slot,
        },
      });

      return { success: true };
    }),

  resetWeek: publicProcedure
    .input(z.object({ weekStartDate: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const weekDate = new Date(input.weekStartDate);
      const normalizedDate = getWeekStartDate(weekDate);

      // Delete week (cascades to items)
      await ctx.db.mealPlanWeek.deleteMany({
        where: {
          userId: ctx.userId,
          weekStartDate: normalizedDate,
        },
      });

      return { success: true };
    }),

  copyDayToAll: publicProcedure
    .input(
      z.object({
        weekStartDate: z.string(),
        fromDayOfWeek: z.number().min(0).max(6),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const weekDate = new Date(input.weekStartDate);
      const normalizedDate = getWeekStartDate(weekDate);

      // Find week
      const week = await ctx.db.mealPlanWeek.findUnique({
        where: {
          userId_weekStartDate: {
            userId: ctx.userId,
            weekStartDate: normalizedDate,
          },
        },
        include: {
          items: {
            where: {
              dayOfWeek: input.fromDayOfWeek,
            },
          },
        },
      });

      if (!week || week.items.length === 0) {
        return { success: true }; // Nothing to copy
      }

      // Ensure week exists
      const ensuredWeek = await ctx.db.mealPlanWeek.upsert({
        where: {
          userId_weekStartDate: {
            userId: ctx.userId,
            weekStartDate: normalizedDate,
          },
        },
        create: {
          userId: ctx.userId,
          weekStartDate: normalizedDate,
        },
        update: {},
      });

      // Copy items to other days
      const sourceItems = week.items;
      const targetDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => d !== input.fromDayOfWeek);

      for (const targetDay of targetDays) {
        for (const sourceItem of sourceItems) {
          await ctx.db.mealPlanItem.upsert({
            where: {
              weekId_dayOfWeek_slot: {
                weekId: ensuredWeek.id,
                dayOfWeek: targetDay,
                slot: sourceItem.slot,
              },
            },
            create: {
              weekId: ensuredWeek.id,
              dayOfWeek: targetDay,
              slot: sourceItem.slot,
              recipeId: sourceItem.recipeId,
              servingsMult: sourceItem.servingsMult,
            },
            update: {
              recipeId: sourceItem.recipeId,
              servingsMult: sourceItem.servingsMult,
            },
          });
        }
      }

      return { success: true };
    }),
});
