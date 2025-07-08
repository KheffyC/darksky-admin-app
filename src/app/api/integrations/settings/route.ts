import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrationSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  try {
    const settings = await db.query.integrationSettings.findFirst({
      where: eq(integrationSettings.jotformFormId, request.nextUrl.searchParams.get('jotformFormId') || '')
    });

    // Don't expose the actual API key
    const response = {
      id: settings?.id,
      hasApiKey: !!settings?.jotformApiKey,
      jotformFormId: settings?.jotformFormId,
      fieldMapping: settings?.fieldMapping ? JSON.parse(settings.fieldMapping) : [],
      lastSyncDate: settings?.lastSyncDate,
      isActive: settings?.isActive || false
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to get integration settings:', error);
    return NextResponse.json(
      { error: 'Failed to get integration settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jotformApiKey, jotformFormId, fieldMapping, isActive } = body;

    // Validate required fields
    if (!jotformApiKey || !jotformFormId) {
      return NextResponse.json(
        { error: 'API key and form ID are required' },
        { status: 400 }
      );
    }

    // Check if settings already exist
    const existingSettings = await db.query.integrationSettings.findFirst({
      where: eq(integrationSettings.jotformFormId, jotformFormId)
    });

    const settingsData = {
      jotformApiKey,
      jotformFormId,
      fieldMapping: JSON.stringify(fieldMapping || []),
      isActive: isActive || false,
      updatedAt: new Date().toISOString()
    };

    if (existingSettings) {
      // Update existing settings
      await db.update(integrationSettings)
        .set(settingsData)
        .where(eq(integrationSettings.id, existingSettings.id));
    } else {
      // Create new settings
      await db.insert(integrationSettings).values({
        id: nanoid(),
        ...settingsData,
        createdAt: new Date().toISOString()
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save integration settings:', error);
    return NextResponse.json(
      { error: 'Failed to save integration settings' },
      { status: 500 }
    );
  }
}
