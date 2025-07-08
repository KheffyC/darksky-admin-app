import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { members, payments } from '@/db/schema';

export async function DELETE(request: NextRequest) {
  try {
    // First delete all payments (foreign key constraint)
    const deletedPayments = await db.delete(payments);
    
    // Then delete all members
    const deletedMembers = await db.delete(members);

    return NextResponse.json({
      success: true,
      message: 'All members and payments deleted successfully',
      deletedPayments: Array.isArray(deletedPayments) ? deletedPayments.length : 0,
      deletedMembers: Array.isArray(deletedMembers) ? deletedMembers.length : 0
    });
  } catch (error) {
    console.error('Failed to delete members and payments:', error);
    return NextResponse.json(
      { error: 'Failed to delete members and payments' },
      { status: 500 }
    );
  }
}
