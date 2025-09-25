import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { unmatchedPayments, payments } from '@/db/schema';
import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

async function importStripePayments() {
  const paymentLinkId = process.env.STRIPE_PAYMENT_LINK_ID;

  const sessions = await stripe.checkout.sessions.list({
    limit: 100,
    expand: ['data.payment_intent', 'data.payment_intent.charges'],
    created: {
      gte: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 30, // last 30 days
    },
  });

  const filtered = sessions.data.filter(
    (s) => s.payment_link === paymentLinkId && s.payment_status === 'paid'
  );

  const newPayments = [];

  for (const session of filtered) {
    const intent = session.payment_intent as Stripe.PaymentIntent;
    const id = intent.id;

    const exists = await db
      .select()
      .from(unmatchedPayments)
      .where(eq(unmatchedPayments.stripePaymentId, id))
      .limit(1);

    const alreadyAssigned = await db
      .select()
      .from(payments)
      .where(eq(payments.stripePaymentId, id))
      .limit(1);

    if (exists.length === 0 && alreadyAssigned.length === 0) {
      // Get the latest charge for this payment intent
      const charges = await stripe.charges.list({
        payment_intent: intent.id,
        limit: 1,
      });
      const charge = charges.data[0];
      
      await db
        .insert(unmatchedPayments)
        .values({
          id: crypto.randomUUID(),
          stripePaymentId: id,
          amountPaid: session.amount_total! / 100,
          paymentDate: new Date(session.created * 1000).toISOString(),
          paymentMethod: 'card', // Stripe payments are always card payments
          cardLast4: charge?.payment_method_details?.card?.last4 ?? '',
          customerName: session.customer_details?.name ?? '',
          notes: session.metadata?.note ?? '',
        });

      newPayments.push(id);
    }
  }

  return { imported: newPayments.length };
}

export async function GET() {
  try {
    const result = await importStripePayments();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error importing Stripe payments:', error);
    return NextResponse.json(
      { error: 'Failed to import Stripe payments' },
      { status: 500 }
    );
  }
}