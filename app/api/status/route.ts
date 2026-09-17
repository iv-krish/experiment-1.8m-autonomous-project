import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('experiment_state')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      // Fallback default state
      return NextResponse.json({
        total_raised: 0,
        target_amount: 1800000,
        is_alive: true,
        death_timestamp: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
        contributions_count: 0,
      });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
