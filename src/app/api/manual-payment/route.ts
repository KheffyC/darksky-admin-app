import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const payment = await prisma.unmatchedPayment.create({
      data: {
        amountPaid: parseFloat(data.amountPaid),
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod || 'card',
        cardLast4: data.paymentMethod === 'card' ? (data.cardLast4 || null) : null,
        customerName: data.customerName || null,
        notes: data.notes || null,
        stripePaymentId: data.stripePaymentId || null,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error('Manual payment error:', error);
    return new NextResponse('Failed to create payment', { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();

    const updated = await prisma.unmatchedPayment.update({
      where: { id: data.id },
      data: {
        amountPaid: parseFloat(data.amountPaid),
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod || 'card',
        cardLast4: data.paymentMethod === 'card' ? (data.cardLast4 || null) : null,
        customerName: data.customerName || null,
        notes: data.notes || null,
        stripePaymentId: data.stripePaymentId || null,
      },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error('Update manual payment error:', error);
    return new NextResponse('Failed to update payment', { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const data = await req.json();

    await prisma.unmatchedPayment.delete({
      where: { id: data.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete manual payment error:', error);
    return new NextResponse('Failed to delete payment', { status: 500 });
  }
}