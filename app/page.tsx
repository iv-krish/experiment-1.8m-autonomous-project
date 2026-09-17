'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseClient = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

interface ExperimentData {
  total_raised: number;
  target_amount: number;
  is_alive: boolean;
  death_timestamp: string;
  contributions_count: number;
}

export default function ExperimentHome() {
  const [data, setData] = useState<ExperimentData>({
    total_raised: 0,
    target_amount: 1800000,
    is_alive: true,
    death_timestamp: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    contributions_count: 0,
  });
  const [timeLeft, setTimeLeft] = useState<number>(72 * 3600);
  const [loadingTier, setLoadingTier] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');

  // Fetch real-time status from backend or directly from Supabase (for static GitHub Pages)
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        const diff = Math.max(
          0,
          Math.floor((new Date(json.death_timestamp).getTime() - Date.now()) / 1000)
        );
        setTimeLeft(diff);
        return;
      }
    } catch (e) {
      // Fall through to client-side Supabase query
    }

    if (supabaseClient) {
      try {
        const { data: dbData } = await supabaseClient
          .from('experiment_state')
          .select('*')
          .eq('id', 1)
          .single();
        if (dbData) {
          setData(dbData);
          const diff = Math.max(
            0,
            Math.floor((new Date(dbData.death_timestamp).getTime() - Date.now()) / 1000)
          );
          setTimeLeft(diff);
        }
      } catch (err) {
        console.warn('Supabase direct query fallback error:', err);
      }
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000); // Polling sync every 15s
    return () => clearInterval(interval);
  }, []);

  // Tick down the local timer
  useEffect(() => {
    if (!data.is_alive || timeLeft <= 0) return;
    const ticker = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(ticker);
  }, [data.is_alive, timeLeft]);

  const formatCountdown = (secs: number) => {
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${d}d ${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s
      .toString()
      .padStart(2, '0')}s`;
  };

  const handleCheckout = async (amount: number) => {
    if (isNaN(amount) || amount < 1 || amount > 1000) {
      alert('Please enter a valid amount between $1 and $1,000 USD.');
      return;
    }
    setLoadingTier(amount);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.url) {
          window.location.href = result.url;
        } else {
          alert(result.error || 'Failed to initialize payment');
        }
      } else {
        alert('Stripe dynamic checkout requires a full-stack backend (e.g. Netlify/Vercel) or Stripe Payment Links.');
      }
    } catch (err) {
      alert('Stripe dynamic checkout requires a full-stack backend (e.g. Netlify/Vercel) or Stripe Payment Links.');
    } finally {
      setLoadingTier(null);
    }
  };

  if (!data.is_alive || timeLeft <= 0) {
    return (
      <main className="min-h-screen bg-black text-rose-600 font-mono flex flex-col items-center justify-center p-6 text-center">
        <div className="border border-rose-900/60 bg-rose-950/20 p-8 sm:p-12 rounded-2xl max-w-lg shadow-2xl backdrop-blur-md">
          <div className="text-rose-500 text-6xl mb-4 font-bold">✝</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            SYSTEM TERMINATED
          </h1>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            The autonomous economic threshold was not sustained. The lifespan counter hit zero, and the node executed its self-destruct protocol.
          </p>
          <div className="inline-block px-3 py-1 bg-rose-950/60 border border-rose-800 text-rose-400 text-xs rounded tracking-widest uppercase">
            Final Pool: ${data.total_raised.toLocaleString()} USD
          </div>
        </div>
      </main>
    );
  }

  const pct = Math.min((data.total_raised / data.target_amount) * 100, 100).toFixed(4);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-10 font-sans selection:bg-emerald-400 selection:text-black">
      {/* Top Telemetry Header */}
      <header className="w-full max-w-4xl flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 font-bold tracking-widest">NODE ONLINE</span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">{data.contributions_count} BACKERS</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-md">
          <span className="text-slate-500">LIFESPAN:</span>
          <span className="text-amber-400 font-bold font-mono">{formatCountdown(timeLeft)}</span>
        </div>
      </header>

      {/* Main Pitch */}
      <section className="w-full max-w-3xl my-auto py-10 flex flex-col items-center text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-900 border border-slate-800 text-slate-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
          Internet Social Experiment #001
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
          What happens when a webpage asks for{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            $1.8 Million?
          </span>
        </h1>

        <p className="text-slate-400 max-w-xl text-base sm:text-lg leading-relaxed font-normal">
          No corporate pitch. No charity facade. Just a single autonomous script given a life countdown. 
          Every contribution adds hours to its existence. If the clock reaches zero before the milestone, 
          it wipes its records and deletes itself forever.
        </p>

        {/* Dynamic Progress Card */}
        <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5 backdrop-blur-sm shadow-xl">
          <div className="flex justify-between items-end font-mono">
            <div className="text-left">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Accumulated</div>
              <div className="text-3xl sm:text-5xl font-black text-white">
                ${data.total_raised.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-500 font-sans">USD</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Target Post-Tax</div>
              <div className="text-xl sm:text-2xl font-bold text-slate-300">
                ${data.target_amount.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.max(parseFloat(pct), 0.5)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs font-mono text-slate-500">
            <span>{pct}% of $1.8M milestone</span>
            <span>Auto-destruct active upon zero</span>
          </div>
        </div>

        {/* Contribution Tiers */}
        <div className="w-full space-y-4">
          <div className="text-xs font-mono uppercase tracking-widest text-slate-400">
            Contribute to Extend Node Lifespan
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { amount: 5, label: 'Coffee', lifespan: '+2 Hours' },
              { amount: 25, label: 'Supporter', lifespan: '+12 Hours' },
              { amount: 100, label: 'Patron', lifespan: '+48 Hours' },
              { amount: 500, label: 'Sponsor', lifespan: '+7 Days' },
            ].map((tier) => (
              <button
                key={tier.amount}
                disabled={loadingTier !== null}
                onClick={() => handleCheckout(tier.amount)}
                className="group relative flex flex-col items-center justify-center p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-850 hover:border-emerald-500/60 transition duration-200 active:scale-95 disabled:opacity-50"
              >
                <div className="text-2xl font-black text-white group-hover:text-emerald-400 transition">
                  ${tier.amount}
                </div>
                <div className="text-xs font-mono text-emerald-400 mt-1">{tier.lifespan}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{tier.label}</div>
              </button>
            ))}
          </div>

          {/* Custom contribution input */}
          <div className="flex items-center justify-center gap-2 max-w-sm mx-auto pt-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-sm">$</span>
              <input
                type="number"
                min="1"
                max="1000"
                placeholder="Custom ($1 - $1,000)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <button
              onClick={() => handleCheckout(Number(customAmount))}
              disabled={loadingTier !== null || !customAmount}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-sm rounded-lg transition disabled:opacity-50"
            >
              Fuel Node
            </button>
          </div>
        </div>

        {/* What does $1.8M achieve section */}
        <div className="w-full text-left bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 space-y-3 font-sans text-xs text-slate-400">
          <div className="font-mono text-slate-200 uppercase font-semibold text-sm">
            What Does $1.8 Million Post-Tax Do?
          </div>
          <p>
            1. Proves whether a digital entity can survive purely on viral intrigue without selling goods.
          </p>
          <p>
            2. Fully covers cross-border payment processing fees (Stripe 2.9% + 30¢) and sovereign tax obligations.
          </p>
          <p>
            3. Upon crossing the target, the complete ledger, bank audit, and internet sociological report will be published openly for public domain download.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-4xl border-t border-slate-900 pt-6 flex flex-wrap justify-between items-center text-xs text-slate-600 font-mono gap-3">
        <span>Autonomous Experiment Agent v1.2</span>
        <span>Accepts USD, GBP, AUD, AED via Stripe</span>
      </footer>
    </main>
  );
}
