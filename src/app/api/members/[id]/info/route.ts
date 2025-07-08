import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      firstName,
      lastName,
      legalName,
      section,
      birthday,
      instrument,
    } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Calculate age if birthday is provided
    let age = null;
    if (birthday) {
      const today = new Date();
      const birthDate = new Date(birthday);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    // Update member information
    const updateData: any = {
      firstName,
      lastName,
      section: section || null,
      instrument: instrument || null,
      updatedAt: new Date().toISOString(),
    };

    // Only include legalName if it's provided and not empty
    if (legalName && legalName.trim() !== '') {
      updateData.legalName = legalName;
    } else {
      updateData.legalName = null;
    }

    // Only include birthday and age if birthday is provided
    if (birthday) {
      updateData.birthday = birthday;
      updateData.age = age;
    } else {
      updateData.birthday = null;
      updateData.age = null;
    }

    await db
      .update(members)
      .set(updateData)
      .where(eq(members.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating member info:', error);
    return NextResponse.json(
      { error: 'Failed to update member information' },
      { status: 500 }
    );
  }
}
