import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { db } from "../../db/client";

/**
 * InBody tRPC Router
 *
 * Provides procedures for managing InBody scan data:
 * - list: Query scans with optional date range filtering
 * - latest: Get the most recent scan
 * - create: Add a new scan
 * - update: Edit an existing scan
 * - delete: Remove a scan
 */

export const inbodyRouter = router({
  /**
   * list: Get all scans for the current user, optionally filtered by date range
   * Returns scans ordered by scanDate ascending (oldest first)
   */
  list: publicProcedure
    .input(
      z.object({
        from: z.string().optional(), // ISO date string (YYYY-MM-DD)
        to: z.string().optional(), // ISO date string (YYYY-MM-DD)
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Build where clause with optional date filtering
      const where: {
        userId: string;
        scanDate?: { gte?: Date; lte?: Date };
      } = { userId };

      if (input.from || input.to) {
        where.scanDate = {};
        if (input.from) {
          where.scanDate.gte = new Date(input.from);
        }
        if (input.to) {
          // Include the entire day by setting to end of day
          const toDate = new Date(input.to);
          toDate.setUTCHours(23, 59, 59, 999);
          where.scanDate.lte = toDate;
        }
      }

      const scans = await db.inBodyScan.findMany({
        where,
        orderBy: {
          scanDate: "asc", // Oldest first for chronological viewing
        },
      });

      return scans;
    }),

  /**
   * latest: Get the most recent scan for the current user
   * Returns null if no scans exist
   */
  latest: publicProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    const latestScan = await db.inBodyScan.findFirst({
      where: { userId },
      orderBy: {
        scanDate: "desc",
      },
    });

    return latestScan;
  }),

  /**
   * create: Add a new InBody scan
   * All measurements are required except notes
   */
  create: publicProcedure
    .input(
      z.object({
        scanDate: z.string(), // ISO date string (YYYY-MM-DD)
        weightLbs: z.number().positive(),
        bodyFatPercent: z.number().min(0).max(100),
        skeletalMuscleMassKg: z.number().positive(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const newScan = await db.inBodyScan.create({
        data: {
          userId,
          scanDate: new Date(input.scanDate),
          weightLbs: input.weightLbs,
          bodyFatPercent: input.bodyFatPercent,
          skeletalMuscleMassKg: input.skeletalMuscleMassKg,
          notes: input.notes,
        },
      });

      return newScan;
    }),

  /**
   * update: Edit an existing scan
   * All fields are optional except id
   */
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        scanDate: z.string().optional(),
        weightLbs: z.number().positive().optional(),
        bodyFatPercent: z.number().min(0).max(100).optional(),
        skeletalMuscleMassKg: z.number().positive().optional(),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Build update data object with only provided fields
      const updateData: {
        scanDate?: Date;
        weightLbs?: number;
        bodyFatPercent?: number;
        skeletalMuscleMassKg?: number;
        notes?: string;
      } = {};

      if (input.scanDate !== undefined) {
        updateData.scanDate = new Date(input.scanDate);
      }
      if (input.weightLbs !== undefined) {
        updateData.weightLbs = input.weightLbs;
      }
      if (input.bodyFatPercent !== undefined) {
        updateData.bodyFatPercent = input.bodyFatPercent;
      }
      if (input.skeletalMuscleMassKg !== undefined) {
        updateData.skeletalMuscleMassKg = input.skeletalMuscleMassKg;
      }
      if (input.notes !== undefined) {
        updateData.notes = input.notes;
      }

      const updatedScan = await db.inBodyScan.update({
        where: {
          id: input.id,
          userId, // Ensure user can only update their own scans
        },
        data: updateData,
      });

      return updatedScan;
    }),

  /**
   * delete: Remove a scan
   * User can only delete their own scans
   */
  delete: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      await db.inBodyScan.delete({
        where: {
          id: input.id,
          userId, // Ensure user can only delete their own scans
        },
      });

      return { success: true };
    }),
});
