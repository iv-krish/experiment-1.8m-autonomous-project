/**
 * Autonomous survival monitor.
 * The old implementation could delete external infrastructure. This version
 * only transitions the campaign to DORMANT; infrastructure remains recoverable.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const TARGET_AMOUNT = Number(process.env.TARGET_AMOUNT || 1800000);

async function checkSurvival() {
  const { data: state, error } = await supabase.from('experiment_state').select('*').eq('id', 1).single();
  if (error || !state) throw new Error(`Database unavailable: ${error?.message || 'missing state'}`);
  if (!state.is_alive) return console.log('[SURVIVAL] DORMANT');

  const now = new Date();
  const deadline = new Date(state.death_timestamp);
  const raised = Number(state.total_raised || 0);

  console.log(`[SURVIVAL] $${raised.toFixed(2)} / $${TARGET_AMOUNT.toFixed(2)}`);

  if (now >= deadline && raised < TARGET_AMOUNT) {
    await supabase.from('experiment_state').update({ is_alive: false, updated_at: now.toISOString() }).eq('id', 1);
    console.log('[SURVIVAL] Campaign transitioned to DORMANT. No infrastructure was deleted.');
    return;
  }

  console.log(`[SURVIVAL] ACTIVE; deadline ${deadline.toISOString()}`);
}

checkSurvival().catch(err => { console.error('[SURVIVAL] fatal:', err); process.exit(1); });
