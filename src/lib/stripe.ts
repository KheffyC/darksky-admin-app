import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_RESTRICTED_KEY!, {
  // Using Stripe's default API version to avoid compatibility issues
  // apiVersion: "2025-06-30.basil",
});