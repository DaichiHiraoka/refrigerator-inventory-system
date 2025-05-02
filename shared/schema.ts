import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// FridgeItem table
export const fridgeItems = pgTable("fridge_items", {
  item_id: serial("item_id").primaryKey(),
  name: text("name").notNull(),
  first_seen: timestamp("first_seen").notNull(),
  last_seen: timestamp("last_seen").notNull()
});

// Insertion schema
export const fridgeItemInsertSchema = createInsertSchema(fridgeItems);
export type FridgeItemInsert = z.infer<typeof fridgeItemInsertSchema>;

// Selection schema
export const fridgeItemSelectSchema = createSelectSchema(fridgeItems);
export type FridgeItem = z.infer<typeof fridgeItemSelectSchema>;

// Keep users table for compatibility
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
