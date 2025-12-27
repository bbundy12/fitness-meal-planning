import { db } from "../db/client";

// Hard-coded user ID (we'll add auth later)
const DEFAULT_USER_ID = "default-user";

export async function createContext() {
  return {
    db,
    userId: DEFAULT_USER_ID,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
