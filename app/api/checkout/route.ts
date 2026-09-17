import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const { amount } = await req.json();
    const numAmount = Number(amount);

    if (!numAmount || numAmount < 1 || numAmount > 1000) {
      return NextResponse.json(
        { error: 'Amount must be between $1 and $1,000 USD.' },
        { status: 400 }
      );
    }

    const host = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `$${numAmount} Lifespan Fuel`,
              description: 'Lifespan extension contribution for The $1.8M Internet Experiment.',
            },
            unit_amount: Math.round(numAmount * 100), // in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        amount_usd: numAmount.toString(),
      },
      success_url: `${host}/?success=true`,
      cancel_url: `${host}/?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
