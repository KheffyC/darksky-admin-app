import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { integrationSettings } from '@/db/schema';
import { settings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { MemberImportService } from '@/lib/member-import';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received sync request:', body);
    const { sinceLast, triggeredBy, jotformFormId } = body;
    
    // Get active integration settings
    const jotformSettings = await db.query.integrationSettings.findFirst({
      where: eq(integrationSettings.jotformFormId, jotformFormId || '')
    });

    const organizationSettings = await db.query.settings.findFirst({
      where: eq(settings.season, '2026') // TODO: Make this dynamic
    });

    console.log('Settings:', jotformSettings);

    if (!jotformSettings || !jotformSettings.jotformApiKey || !jotformSettings.jotformFormId) {
      return NextResponse.json(
        { error: 'Jotform integration not configured' },
        { status: 400 }
      );
    }

    const fieldMappings = jotformSettings.fieldMapping ? JSON.parse(jotformSettings.fieldMapping) : [];
    
    // Filter out invalid/incomplete field mappings
    const validFieldMappings = fieldMappings.filter(mapping => 
      mapping.jotformField && 
      mapping.jotformField.trim() !== '' && 
      mapping.memberField && 
      mapping.memberField.trim() !== '' &&
      mapping.jotformFieldName && 
      mapping.jotformFieldName.trim() !== ''
    );
    
    console.log('Original mappings:', fieldMappings.length);
    console.log('Valid mappings:', validFieldMappings.length);
    
    if (validFieldMappings.length === 0) {
      return NextResponse.json(
        { error: 'No valid field mappings configured' },
        { status: 400 }
      );
    }

    // Start import process
    const importService = new MemberImportService(jotformSettings.jotformApiKey);
    
    // Add debugging: log sample submission data
    console.log('=== JOTFORM SYNC DEBUG ===');
    console.log('Form ID:', jotformSettings.jotformFormId);
    console.log('Field Mappings:', validFieldMappings);
    console.log('Since Last:', sinceLast);
    
    const result = await importService.importMembers({
      formId: jotformSettings.jotformFormId,
      fieldMappings: validFieldMappings,
      defaultSeason: organizationSettings?.season || '2026', // TODO: Make this configurable
      sinceLast: sinceLast,
      triggeredBy: triggeredBy || 'system',
      tuitionAmount: organizationSettings?.defaultTuition || 1000 // Default to 1000 if not set
    });

    console.log('Import Result:', result);
    console.log('=== END JOTFORM SYNC DEBUG ===');

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to sync members:', error);
    return NextResponse.json(
      { error: 'Failed to sync members from Jotform' },
      { status: 500 }
    );
  }
}
