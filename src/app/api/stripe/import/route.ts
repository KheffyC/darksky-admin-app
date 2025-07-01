import { stripe } from '@/lib/stripe';
import prisma from '@/lib/db';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  const paymentLinkId = process.env.STRIPE_PAYMENT_LINK_ID;

  const sessions = await stripe.checkout.sessions.list({
    limit: 100,
    expand: ['data.payment_intent', 'data.payment_intent.charges'],
    created: {
      gte: Math.floor(Date.now() / 1000) - 60 * 60 * 24 * 90, // last 90 days
    },
  });

  const filtered = sessions.data.filter(
    (s) => s.payment_link === paymentLinkId && s.payment_status === 'paid'
  );

  const newPayments = [];

  for (const session of filtered) {
    const intent = session.payment_intent as Stripe.PaymentIntent;
    const id = intent.id;

    const exists = await prisma.unmatchedPayment.findUnique({
      where: { stripePaymentId: id },
    });

    if (!exists) {
      // Get the latest charge for this payment intent
      const charges = await stripe.charges.list({
        payment_intent: intent.id,
        limit: 1,
      });
      const charge = charges.data[0];
      
      await prisma.unmatchedPayment.create({
        data: {
          stripePaymentId: id,
          amountPaid: session.amount_total! / 100,
          paymentDate: new Date(session.created * 1000),
          cardLast4: charge?.payment_method_details?.card?.last4 ?? '',
          customerName: session.customer_details?.name ?? '',
          notes: session.metadata?.note ?? '',
        },
      });

      newPayments.push(id);
    }
  }

  return NextResponse.json({ imported: newPayments.length });
}