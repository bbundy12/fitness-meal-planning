import { db } from "../db/client";
import { auth } from "../auth";
import { TRPCError } from "@trpc/server";

export async function createContext() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return {
    db,
    userId: session.user.id,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
