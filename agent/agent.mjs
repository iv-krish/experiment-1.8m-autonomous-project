/**
 * Autonomous Survival Agent Daemon
 * Can be run via cron: npm run agent:check
 */
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const TARGET_AMOUNT = 1800000;

async function checkSurvival() {
  console.log('[AGENT] Running autonomous health check...');

  const { data: state, error } = await supabase
    .from('experiment_state')
    .select('*')
    .eq('id', 1)
    .single();

  if (error || !state) {
    console.error('[AGENT] Database unreachable:', error);
    process.exit(1);
  }

  if (!state.is_alive) {
    console.log('[AGENT] State is already DEAD. No operations needed.');
    return;
  }

  const now = new Date();
  const deathTime = new Date(state.death_timestamp);

  console.log(`[AGENT] Current Balance: $${state.total_raised} / $${TARGET_AMOUNT}`);
  console.log(`[AGENT] Death Timestamp: ${deathTime.toISOString()}`);

  // Check death condition
  if (now >= deathTime && state.total_raised < TARGET_AMOUNT) {
    console.warn('[AGENT] CRITICAL: Lifespan expired without achieving target. Executing Self-Destruct...');
    
    // 1. Mark dead in database
    await supabase
      .from('experiment_state')
      .update({ is_alive: false, updated_at: now.toISOString() })
      .eq('id', 1);

    // 2. Call Vercel API to revoke deployment (if configured)
    if (VERCEL_TOKEN && VERCEL_PROJECT_ID) {
      try {
        console.log('[AGENT] Deleting Vercel project deployment...');
        await axios.delete(`https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}`, {
          headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
        });
        console.log('[AGENT] Deployment successfully revoked.');
      } catch (vErr) {
        console.error('[AGENT] Failed to unpublish from Vercel:', vErr.message);
      }
    }

    console.log('[AGENT] Execution complete. Node is officially dead.');
  } else {
    const diffSec = Math.floor((deathTime - now) / 1000);
    console.log(`[AGENT] Heartbeat healthy. Remaining lifespan: ${diffSec}s`);
  }
}

checkSurvival().catch(console.error);
