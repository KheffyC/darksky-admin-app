import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    // Get the current season's settings
    const result = await db.select().from(settings).where(eq(settings.currentSeason, true)).limit(1);
    
    if (result.length === 0) {
      // If no current season, get the first one or return defaults
      const firstSeason = await db.select().from(settings).limit(1);
      if (firstSeason.length > 0) {
        return NextResponse.json(firstSeason[0]);
      }
      
      // Return default settings if none exist
      return NextResponse.json({
        organizationName: 'Dark Sky',
        season: '2024-2025',
        defaultTuition: 1000,
        paymentDueDate: '',
        emailNotifications: true,
        autoReconcile: false,
      });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Failed to load settings:', error);
    return NextResponse.json(
      { error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organizationName,
      season,
      defaultTuition,
      paymentDueDate,
      emailNotifications,
      autoReconcile,
    } = body;

    // Validate required fields
    if (!organizationName || !season) {
      return NextResponse.json(
        { error: 'Organization name and season are required' },
        { status: 400 }
      );
    }

    // Check if settings for this season already exist
    const existingSettings = await db.select().from(settings).where(eq(settings.season, season)).limit(1);
    
    if (existingSettings.length === 0) {
      // Check if this is the first season being created
      const anySettings = await db.select().from(settings).limit(1);
      const isFirstSeason = anySettings.length === 0;
      
      // Create new settings entry for this season
      await db.insert(settings).values({
        id: uuidv4(),
        organizationName,
        season,
        defaultTuition: defaultTuition || 1000,
        paymentDueDate: paymentDueDate || null,
        emailNotifications: emailNotifications ?? true,
        autoReconcile: autoReconcile ?? false,
        currentSeason: isFirstSeason, // Set as current if it's the first season
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Update existing settings for this season
      await db
        .update(settings)
        .set({
          organizationName,
          defaultTuition: defaultTuition || 1000,
          paymentDueDate: paymentDueDate || null,
          emailNotifications: emailNotifications ?? true,
          autoReconcile: autoReconcile ?? false,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(settings.id, existingSettings[0].id));
    }

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
