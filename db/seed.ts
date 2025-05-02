import { db } from "./index";
import { fridgeItems } from "@shared/schema";

async function seed() {
  try {
    console.log("Seeding fridge items...");
    
    // Demo food items with timestamps
    const now = new Date();
    
    // Fresh items (within 5 days)
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(now.getDate() - 3);
    
    // Items expiring soon (5-7 days old)
    const sixDaysAgo = new Date(now);
    sixDaysAgo.setDate(now.getDate() - 6);
    
    // Expired items (more than 7 days old)
    const tenDaysAgo = new Date(now);
    tenDaysAgo.setDate(now.getDate() - 10);
    
    // Sample food items
    const sampleItems = [
      { 
        name: "キャベツ", 
        first_seen: threeDaysAgo,
        last_seen: yesterday
      },
      { 
        name: "トマト", 
        first_seen: threeDaysAgo, 
        last_seen: yesterday
      },
      { 
        name: "牛乳", 
        first_seen: sixDaysAgo, 
        last_seen: sixDaysAgo
      },
      { 
        name: "卵", 
        first_seen: tenDaysAgo, 
        last_seen: tenDaysAgo
      },
      { 
        name: "にんじん", 
        first_seen: threeDaysAgo, 
        last_seen: yesterday
      }
    ];
    
    // Check if table already has items
    const existingItems = await db.select().from(fridgeItems);
    
    if (existingItems.length === 0) {
      // Insert sample items
      for (const item of sampleItems) {
        await db.insert(fridgeItems).values(item);
      }
      console.log(`Inserted ${sampleItems.length} sample food items`);
    } else {
      console.log(`Database already has ${existingItems.length} items, skipping seed`);
    }
    
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
