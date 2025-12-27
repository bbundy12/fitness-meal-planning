import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { getWeekStartDate, toISODateOnly } from "../../../lib/week";

// Helper types for computed shopping list
type AmountEntry = {
  quantity: number;
  unit: string;
};

type GeneratedItem = {
  ingredientId: string;
  name: string;
  amounts: AmountEntry[];
  checked: boolean;
};

type CustomItem = {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  checked: boolean;
};

export const shoppingRouter = router({
  getWeekList: publicProcedure
    .input(
      z.object({
        weekStartDate: z.string(), // YYYY-MM-DD
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const weekStart = getWeekStartDate(new Date(input.weekStartDate));
      const weekStartDate = toISODateOnly(weekStart);

      // 1. Get or create shopping list state for this week
      let state = await ctx.db.shoppingListState.findUnique({
        where: {
          userId_weekStartDate: {
            userId,
            weekStartDate: weekStart,
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

      if (!state) {
        state = await ctx.db.shoppingListState.create({
          data: {
            userId,
            weekStartDate: weekStart,
          },
          include: {
            items: {
              include: {
                ingredient: true,
              },
            },
          },
        });
      }

      // 2. Compute generated items from meal plan
      const mealPlanWeek = await ctx.db.mealPlanWeek.findUnique({
        where: {
          userId_weekStartDate: {
            userId,
            weekStartDate: weekStart,
          },
        },
        include: {
          items: {
            include: {
              recipe: {
                include: {
                  items: {
                    include: {
                      ingredient: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Accumulate ingredients from all meal plan items
      const ingredientMap = new Map<
        string,
        { name: string; amounts: Map<string, number> }
      >();

      if (mealPlanWeek) {
        for (const mealItem of mealPlanWeek.items) {
          const servingsMult = mealItem.servingsMult;
          for (const recipeItem of mealItem.recipe.items) {
            const ingredientId = recipeItem.ingredientId;
            const ingredientName = recipeItem.ingredient.name;
            const quantity = recipeItem.quantity * servingsMult;
            const unit = recipeItem.unit;

            if (!ingredientMap.has(ingredientId)) {
              ingredientMap.set(ingredientId, {
                name: ingredientName,
                amounts: new Map(),
              });
            }

            const ingredient = ingredientMap.get(ingredientId);
            if (!ingredient) continue;
            const currentAmount = ingredient.amounts.get(unit) ?? 0;
            ingredient.amounts.set(unit, currentAmount + quantity);
          }
        }
      }

      // 3. Merge with saved checked state
      const generated: GeneratedItem[] = [];
      for (const [ingredientId, data] of ingredientMap) {
        const savedState = state.items.find(
          (item) => item.ingredientId === ingredientId,
        );
        const checked = savedState?.checked ?? false;

        const amounts: AmountEntry[] = [];
        for (const [unit, quantity] of data.amounts) {
          amounts.push({ quantity, unit });
        }

        generated.push({
          ingredientId,
          name: data.name,
          amounts,
          checked,
        });
      }

      // Sort generated items alphabetically
      generated.sort((a, b) => a.name.localeCompare(b.name));

      // 4. Get custom items
      const custom: CustomItem[] = state.items
        .filter((item) => item.customName != null)
        .map((item) => ({
          id: item.id,
          name: item.customName as string,
          quantity: item.quantity ?? undefined,
          unit: item.unit ?? undefined,
          checked: item.checked,
        }));

      return {
        weekStartDate,
        generated,
        custom,
      };
    }),

  toggleChecked: publicProcedure
    .input(
      z.object({
        weekStartDate: z.string(),
        ingredientId: z.string().optional(),
        customItemId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const weekStart = getWeekStartDate(new Date(input.weekStartDate));

      // Get or create state
      let state = await ctx.db.shoppingListState.findUnique({
        where: {
          userId_weekStartDate: {
            userId,
            weekStartDate: weekStart,
          },
        },
      });

      if (!state) {
        state = await ctx.db.shoppingListState.create({
          data: {
            userId,
            weekStartDate: weekStart,
          },
        });
      }

      if (input.ingredientId) {
        // Toggle for generated ingredient
        const existing = await ctx.db.shoppingListItemState.findUnique({
          where: {
            stateId_ingredientId: {
              stateId: state.id,
              ingredientId: input.ingredientId,
            },
          },
        });

        if (existing) {
          await ctx.db.shoppingListItemState.update({
            where: { id: existing.id },
            data: { checked: !existing.checked },
          });
        } else {
          await ctx.db.shoppingListItemState.create({
            data: {
              stateId: state.id,
              ingredientId: input.ingredientId,
              checked: true,
            },
          });
        }
      } else if (input.customItemId) {
        // Toggle for custom item
        const existing = await ctx.db.shoppingListItemState.findUnique({
          where: { id: input.customItemId },
        });

        if (existing) {
          await ctx.db.shoppingListItemState.update({
            where: { id: input.customItemId },
            data: { checked: !existing.checked },
          });
        }
      }

      return { success: true };
    }),

  setChecked: publicProcedure
    .input(
      z.object({
        weekStartDate: z.string(),
        ingredientId: z.string().optional(),
        customItemId: z.string().optional(),
        checked: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const weekStart = getWeekStartDate(new Date(input.weekStartDate));

      // Get or create state
      let state = await ctx.db.shoppingListState.findUnique({
        where: {
          userId_weekStartDate: {
            userId,
            weekStartDate: weekStart,
          },
        },
      });

      if (!state) {
        state = await ctx.db.shoppingListState.create({
          data: {
            userId,
            weekStartDate: weekStart,
          },
        });
      }

      if (input.ingredientId) {
        // Set for generated ingredient
        await ctx.db.shoppingListItemState.upsert({
          where: {
            stateId_ingredientId: {
              stateId: state.id,
              ingredientId: input.ingredientId,
            },
          },
          create: {
            stateId: state.id,
            ingredientId: input.ingredientId,
            checked: input.checked,
          },
          update: {
            checked: input.checked,
          },
        });
      } else if (input.customItemId) {
        // Set for custom item
        await ctx.db.shoppingListItemState.update({
          where: { id: input.customItemId },
          data: { checked: input.checked },
        });
      }

      return { success: true };
    }),

  addCustomItem: publicProcedure
    .input(
      z.object({
        weekStartDate: z.string(),
        name: z.string(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const weekStart = getWeekStartDate(new Date(input.weekStartDate));

      // Get or create state
      let state = await ctx.db.shoppingListState.findUnique({
        where: {
          userId_weekStartDate: {
            userId,
            weekStartDate: weekStart,
          },
        },
      });

      if (!state) {
        state = await ctx.db.shoppingListState.create({
          data: {
            userId,
            weekStartDate: weekStart,
          },
        });
      }

      const item = await ctx.db.shoppingListItemState.create({
        data: {
          stateId: state.id,
          customName: input.name,
          quantity: input.quantity,
          unit: input.unit,
          checked: false,
        },
      });

      return {
        id: item.id,
        name: item.customName as string,
        quantity: item.quantity ?? undefined,
        unit: item.unit ?? undefined,
        checked: item.checked,
      };
    }),

  removeCustomItem: publicProcedure
    .input(
      z.object({
        customItemId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.shoppingListItemState.delete({
        where: { id: input.customItemId },
      });

      return { success: true };
    }),

  clearChecks: publicProcedure
    .input(
      z.object({
        weekStartDate: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const weekStart = getWeekStartDate(new Date(input.weekStartDate));

      const state = await ctx.db.shoppingListState.findUnique({
        where: {
          userId_weekStartDate: {
            userId,
            weekStartDate: weekStart,
          },
        },
      });

      if (state) {
        await ctx.db.shoppingListItemState.updateMany({
          where: { stateId: state.id },
          data: { checked: false },
        });
      }

      return { success: true };
    }),
});
