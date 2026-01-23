// lib/db-safe.ts
import { initDb } from "./db";

let initialized = false;

export async function ensureDb() {
  if (!initialized) {
    await initDb();
    initialized = true;
  }
}
