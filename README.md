# The $1.8M Internet Experiment — Autonomous Campaign CEO

An autonomous, bounded campaign system designed to test whether a transparent internet experiment can grow from a small operating budget toward a $1,800,000 post-tax target through legitimate voluntary contributions.

## Current architecture
- Next.js frontend and Netlify deployment configuration.
- Supabase PostgreSQL campaign state and public progress data.
- **Campaign CEO agent** (`agent/ceo-agent.mjs`) that reads telemetry, asks an AI model for growth experiments, applies hard budget filters, and records recommendations/results.
- **Survival monitor** (`agent/agent.mjs`) that transitions the campaign to recoverable `DORMANT` state rather than deleting infrastructure.
- GitHub Actions heartbeat every 6 hours.
- Agent budget ledger and experiment/run tables.
- Human-approval boundary around material financial actions.

## Operating model
Starting operating capital is configured as `$100` by default. The CEO can recommend experiments, but each proposed experiment is capped by `MAX_EXPERIMENT_SPEND` (default `$10`). The system tracks operating capital separately from contributor funds.

The agent's objective is not "raise money by any means." It must optimize for legitimate acquisition and transparent voluntary contributions and must not recommend fake contributors, fake testimonials, spam, deceptive urgency, regulatory evasion, or unauthorized financial transfers.

## AI model
The agent accepts `AGENT_MODEL` as an environment variable. When running through Netlify AI Gateway, use a model listed as currently supported by Netlify's gateway. Netlify's gateway injects provider credentials into supported compute contexts and provides usage/rate-limit controls.

## Required secrets for the automated CEO heartbeat
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (or replace the model adapter with another approved provider)
- `AGENT_MODEL` (optional; defaults to `gpt-5.6-luna`)

## Database
Run `db/schema.sql` in Supabase. It creates campaign state, contributions, an operating budget ledger, experiments, and agent-run telemetry.

## Important: real-money launch is disabled until approved
The software is not a license to collect international contributions. Before enabling a real payment processor, establish the legal classification of the transaction, the entity receiving funds, foreign-source contribution requirements, tax treatment, KYC/AML/payment-provider rules, refund policy, and required disclosures. Do not use the contributor-country/currency list as a workaround for financial regulation.

## Deployment
The repository contains `netlify.toml` for a Next.js Netlify deployment. Netlify AI Gateway requires a production deployment before gateway calls are active. The Gateway currently supports multiple OpenAI, Anthropic, Google and other models; select only a model that Netlify currently lists as supported.

## Run locally
```bash
npm install
npm run dev
npm run agent:ceo
npm run agent:check
```

## Autonomous philosophy
The campaign can "die" economically by entering `DORMANT`. It does not self-delete infrastructure or erase its database. That keeps the experiment recoverable, auditable and safe while preserving the autonomous survival concept.
