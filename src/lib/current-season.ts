import { db } from '@/lib/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getCurrentSeason() {
  try {
    // Get the current season's settings
    const result = await db.select().from(settings).where(eq(settings.currentSeason, true)).limit(1);
    
    if (result.length === 0) {
      // If no current season, get the first one
      const firstSeason = await db.select().from(settings).limit(1);
      if (firstSeason.length > 0) {
        return firstSeason[0].season;
      }
      
      // Return default season if none exist
      return '2024-2025';
    }

    return result[0].season;
  } catch (error) {
    console.error('Failed to get current season:', error);
    return '2024-2025'; // Fallback
  }
}

export async function getCurrentSeasonSettings() {
  try {
    // Get the current season's settings
    const result = await db.select().from(settings).where(eq(settings.currentSeason, true)).limit(1);
    
    if (result.length === 0) {
      // If no current season, get the first one
      const firstSeason = await db.select().from(settings).limit(1);
      if (firstSeason.length > 0) {
        return firstSeason[0];
      }
      
      // Return null if no settings exist
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('Failed to get current season settings:', error);
    return null;
  }
}
