import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, settings, tuitionEditLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { nanoid } from 'nanoid';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const {
      firstName,
      lastName,
      legalName,
      section,
      birthday,
      instrument,
      email,
      phone,
      address,
      mailingAddress,
      school,
      parentEmail,
      parentPhone,
      previousSeasons,
    } = body;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    const seasons = previousSeasons === undefined || previousSeasons === '' ? undefined : Number(previousSeasons);
    if (seasons !== undefined && (!Number.isInteger(seasons) || seasons < 0 || seasons > 50)) {
      return NextResponse.json(
        { error: 'Previous seasons must be a whole number of 0 or more' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'A valid email is required' },
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
      email: email.trim(),
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      mailingAddress: mailingAddress?.trim() || null,
      school: school?.trim() || null,
      parentEmail: parentEmail?.trim() || null,
      parentPhone: parentPhone?.trim() || null,
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

    await db.transaction(async (tx) => {
      // Changing previous seasons moves tuition by the season's vet discount for
      // the difference, so other manual tuition adjustments are kept
      if (seasons !== undefined) {
        const [member] = await tx.select().from(members).where(eq(members.id, id)).limit(1);
        if (member && member.previousSeasons !== seasons) {
          const [seasonSettings] = await tx
            .select({ vetDiscount: settings.vetDiscount })
            .from(settings)
            .where(eq(settings.season, member.season))
            .limit(1);
          const discount = (seasons - member.previousSeasons) * (seasonSettings?.vetDiscount ?? 0);
          const newTuition = Math.max(member.tuitionAmount - discount, 0);

          updateData.previousSeasons = seasons;
          if (newTuition !== member.tuitionAmount) {
            updateData.tuitionAmount = newTuition;
            await tx.insert(tuitionEditLogs).values({
              id: nanoid(),
              memberId: id,
              oldAmount: Math.round(member.tuitionAmount),
              newAmount: Math.round(newTuition),
              editedBy: `${session.user?.email || session.user?.name || 'Unknown'} (previous seasons ${member.previousSeasons} → ${seasons})`,
              editedAt: new Date().toISOString(),
            });
          }
        }
      }

      await tx
        .update(members)
        .set(updateData)
        .where(eq(members.id, id));
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Unique violation on Member_email_key
    if (error?.code === '23505' || error?.cause?.code === '23505') {
      return NextResponse.json(
        { error: 'Another member already uses that email' },
        { status: 409 }
      );
    }
    console.error('Error updating member info:', error);
    return NextResponse.json(
      { error: 'Failed to update member information' },
      { status: 500 }
    );
  }
}
