/**
 * Autonomous Campaign CEO
 *
 * This agent is intentionally bounded: it can analyze campaign telemetry and
 * create recommendations/experiments, but it cannot transfer money, delete the
 * site, or change payment terms. Set AUTONOMY_MODE=live only after reviewing
 * the tool permissions in production.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

dotenv.config();

const TARGET = Number(process.env.TARGET_AMOUNT || 1800000);
const STARTING_CAPITAL = Number(process.env.STARTING_CAPITAL || 100);
const MAX_EXPERIMENT_SPEND = Number(process.env.MAX_EXPERIMENT_SPEND || 10);
const MODE = process.env.AUTONOMY_MODE || 'advisory';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function telemetry() {
  const [{ data: state }, { data: ledger }, { data: experiments }] = await Promise.all([
    supabase.from('experiment_state').select('*').eq('id', 1).single(),
    supabase.from('agent_budget_ledger').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('agent_experiments').select('*').order('created_at', { ascending: false }).limit(50)
  ]);
  return { state, ledger: ledger || [], experiments: experiments || [] };
}

function calculate(t) {
  const spent = t.ledger.filter(x => x.kind === 'spend').reduce((a, x) => a + Number(x.amount_usd), 0);
  const earned = t.ledger.filter(x => x.kind === 'revenue').reduce((a, x) => a + Number(x.amount_usd), 0);
  const available = STARTING_CAPITAL + earned - spent;
  const raised = Number(t.state?.total_raised || 0);
  const contributors = Number(t.state?.contributions_count || 0);
  return {
    target,
    raised,
    contributors,
    progress: TARGET ? raised / TARGET : 0,
    operating_spent: spent,
    operating_revenue: earned,
    operating_balance: available,
    average_contribution: contributors ? raised / contributors : 0,
    experiments: t.experiments
  };
}

async function aiAdvice(metrics) {
  if (!process.env.OPENAI_API_KEY) {
    return { summary: 'No AI key configured; deterministic strategy used.', actions: [] };
  }
  const prompt = `You are the Campaign CEO for a transparent crowdfunding experiment. Goal: raise $${TARGET}. Starting operating capital: $${STARTING_CAPITAL}. Never suggest deception, fake testimonials, fake contributors, spam, illegal fundraising, evasion of advertising rules, or unauthorized financial transfers. Return JSON with keys summary and actions. Each action must contain name, reason, estimated_cost_usd, success_metric, and risk. Campaign metrics: ${JSON.stringify(metrics)}`;
  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: process.env.AGENT_MODEL || 'gpt-5.6-luna', input: prompt, text: { format: { type: 'json_object' } } })
  });
  if (!r.ok) throw new Error(`OpenAI request failed: ${r.status}`);
  const body = await r.json();
  const text = body.output_text || '{}';
  return JSON.parse(text);
}

async function recordRun(metrics, advice, status) {
  await supabase.from('agent_runs').insert({
    mode: MODE,
    status,
    metrics,
    advice,
    created_at: new Date().toISOString()
  });
}

async function main() {
  const t = await telemetry();
  const metrics = calculate(t);

  if (!t.state) throw new Error('experiment_state row missing');

  // Never destroy infrastructure. Dormancy is represented in state instead.
  if (!t.state.is_alive) {
    await recordRun(metrics, { summary: 'Campaign is dormant.', actions: [] }, 'dormant');
    console.log('[CEO] DORMANT');
    return;
  }

  const advice = await aiAdvice(metrics);
  const safeActions = (advice.actions || []).filter(a => Number(a.estimated_cost_usd || 0) <= MAX_EXPERIMENT_SPEND);

  for (const action of safeActions.slice(0, 3)) {
    await supabase.from('agent_experiments').insert({
      name: action.name,
      reason: action.reason,
      budget_usd: Number(action.estimated_cost_usd || 0),
      success_metric: action.success_metric || 'measurable positive conversion',
      status: MODE === 'live' ? 'proposed' : 'advisory',
      created_at: new Date().toISOString()
    });
  }

  const status = metrics.operating_balance <= 0 ? 'budget_exhausted' : metrics.progress >= 1 ? 'target_reached' : 'alive';
  await recordRun(metrics, { ...advice, actions: safeActions }, status);
  console.log(JSON.stringify({ status, mode: MODE, metrics, actions: safeActions }, null, 2));
}

main().catch(err => { console.error('[CEO] fatal:', err); process.exit(1); });
