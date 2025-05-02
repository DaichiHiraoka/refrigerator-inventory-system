import { db } from "@db";
import { fridgeItems } from "@shared/schema";
import { eq } from "drizzle-orm";

export const storage = {
  /**
   * Get all fridge items
   */
  getAllItems: async () => {
    try {
      return await db.query.fridgeItems.findMany({
        orderBy: (fridgeItems, { desc }) => [desc(fridgeItems.last_seen)]
      });
    } catch (error) {
      console.error('Error fetching all items:', error);
      throw error;
    }
  },
  
  /**
   * Get a fridge item by ID
   */
  getItemById: async (id: number) => {
    try {
      return await db.query.fridgeItems.findFirst({
        where: eq(fridgeItems.item_id, id)
      });
    } catch (error) {
      console.error(`Error fetching item with ID ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Get a fridge item by name
   */
  getItemByName: async (name: string) => {
    try {
      return await db.query.fridgeItems.findFirst({
        where: eq(fridgeItems.name, name)
      });
    } catch (error) {
      console.error(`Error fetching item with name ${name}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new fridge item
   */
  createItem: async (name: string, timestamp: Date) => {
    try {
      const [item] = await db.insert(fridgeItems).values({
        name,
        first_seen: timestamp,
        last_seen: timestamp
      }).returning();
      
      return item;
    } catch (error) {
      console.error(`Error creating item ${name}:`, error);
      throw error;
    }
  },
  
  /**
   * Update an existing fridge item's last_seen timestamp
   */
  updateItemLastSeen: async (id: number, timestamp: Date) => {
    try {
      const [item] = await db.update(fridgeItems)
        .set({ last_seen: timestamp })
        .where(eq(fridgeItems.item_id, id))
        .returning();
      
      return item;
    } catch (error) {
      console.error(`Error updating item ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a fridge item
   */
  deleteItem: async (id: number) => {
    try {
      return await db.delete(fridgeItems)
        .where(eq(fridgeItems.item_id, id))
        .returning();
    } catch (error) {
      console.error(`Error deleting item ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Upsert a fridge item (create if not exists, update if exists)
   */
  upsertItem: async (name: string, timestamp: Date) => {
    try {
      const existingItem = await storage.getItemByName(name);
      
      if (existingItem) {
        return await storage.updateItemLastSeen(existingItem.item_id, timestamp);
      } else {
        return await storage.createItem(name, timestamp);
      }
    } catch (error) {
      console.error(`Error upserting item ${name}:`, error);
      throw error;
    }
  }
};
