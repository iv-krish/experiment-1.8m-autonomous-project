import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getClients() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_dummy_key', {
    apiVersion: '2023-10-16',
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
  const supabase = createClient(supabaseUrl, supabaseKey);

  return { stripe, supabase };
}

export async function POST(req: Request) {
  const { stripe, supabase } = getClients();
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const amount = (session.amount_total || 0) / 100;
    const country = session.customer_details?.address?.country || 'GLOBAL';

    // 1. Log contribution
    await supabase.from('contributions').insert({
      stripe_session_id: session.id,
      amount_usd: amount,
      donor_country: country,
    });

    // 2. Fetch current experiment state
    const { data: state } = await supabase
      .from('experiment_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (state && state.is_alive) {
      const currentTotal = Number(state.total_raised) + amount;
      const currentCount = Number(state.contributions_count) + 1;

      // Extend lifespan: 1 hour per $5 contributed
      const additionalHours = (amount / 5) * 1;
      const currentDeath = new Date(state.death_timestamp).getTime();
      const newDeath = new Date(Math.max(currentDeath, Date.now()) + additionalHours * 3600 * 1000);

      await supabase
        .from('experiment_state')
        .update({
          total_raised: currentTotal,
          contributions_count: currentCount,
          death_timestamp: newDeath.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);
    }
  }

  return NextResponse.json({ received: true });
}
