// Canned fixtures returned by the AI Agents client when BFF_DEMO_MODE=true.
// Lets the FE boot end-to-end without any backend creds.
//
// Shapes mirror the AU collections envelope so the existing FE charts/logs
// components render unchanged.

import {
  AU_COLLECTIONS_AGENT_UUID,
  AU_CHAT_AGENT_UUID,
  AU_LISTING_AGENT_UUID,
  AU_VERIFICATION_AGENT_UUID,
  SG_COLLECTIONS_AGENT_UUID,
} from './agent-uuids';

const iso = (d = new Date()) => d.toISOString();

export function demoAgents() {
  return [
    {
      id: AU_COLLECTIONS_AGENT_UUID,
      name: 'AU Collections Agent',
      market: 'AU',
      status: 'online',
      description: 'Stella + Mark collections agent (Australia).',
      lastHeartbeat: iso(),
      uptime: '99.7%',
      config: {},
      logs: [],
    },
    {
      id: SG_COLLECTIONS_AGENT_UUID,
      name: 'SG Collections Agent',
      market: 'SG',
      status: 'online',
      description: 'Singapore collections agent (Temporal + Hono + Supabase).',
      lastHeartbeat: iso(),
      uptime: '99.4%',
      config: {},
      logs: [],
    },
    {
      id: AU_CHAT_AGENT_UUID,
      name: 'Chat Agent',
      market: 'AU',
      status: 'online',
      description: 'Conversational agent.',
      lastHeartbeat: iso(),
      uptime: '99.9%',
      config: {},
      logs: [],
    },
    {
      id: AU_LISTING_AGENT_UUID,
      name: 'Listing Agent',
      market: 'AU',
      status: 'online',
      description: 'Listing image / quality agent.',
      lastHeartbeat: iso(),
      uptime: '99.6%',
      config: {},
      logs: [],
    },
    {
      id: AU_VERIFICATION_AGENT_UUID,
      name: 'Verification Agent',
      market: 'AU',
      status: 'online',
      description: 'Identity & document verification agent.',
      lastHeartbeat: iso(),
      uptime: '99.5%',
      config: {},
      logs: [],
    },
  ];
}

export function demoAnalytics() {
  const weeks = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (11 - i) * 7);
    return d.toISOString().slice(0, 10);
  });
  return {
    sections: [
      {
        id: 'simplified_metrics',
        title: 'Collections Overview',
        layout: 'single',
        charts: [
          {
            id: 'simplified_metrics',
            type: 'cards',
            title: 'Collections Summary',
            data: {
              cards: [
                { title: 'Total Cases Initiated', value: '38', description: 'demo', color: '#00A3AD' },
                { title: 'Total Cases Resolved', value: '21', description: 'demo', color: '#026786' },
                { title: 'Resolution Rate', value: '55%', description: 'demo', color: '#10B981' },
                { title: 'Total Money Collected', value: '$18,420', description: 'demo', color: '#8B5CF6' },
              ],
            },
          },
        ],
      },
      {
        id: 'collections_distribution',
        title: 'Case Distribution by Stage',
        layout: 'single',
        charts: [
          {
            id: 'collections_distribution',
            type: 'horizontal_bar',
            title: 'Case Distribution by Stage',
            data: [
              { stage: 'In Progress', value: 10, percentage: 26.3, color: '#026786', description: 'demo' },
              { stage: 'Escalated', value: 2, percentage: 5.3, color: '#EF4444', description: 'demo' },
              { stage: 'Payment Plan Active', value: 4, percentage: 10.5, color: '#06B6D4', description: 'demo' },
              { stage: 'Default Filed', value: 1, percentage: 2.6, color: '#DC2626', description: 'demo' },
              { stage: 'Resolved', value: 21, percentage: 55.3, color: '#10B981', description: 'demo' },
            ],
            config: { showLabels: true, showPercentages: true, showValues: true, maxValue: 21 },
          },
        ],
      },
      {
        id: 'weekly_trends',
        title: 'Historical Weekly Trends',
        layout: 'single',
        charts: [
          {
            id: 'weekly_trends',
            type: 'line',
            title: 'Weekly Collections Metrics',
            data: weeks.map((week, i) => ({
              week,
              cases_initiated: 2 + (i % 4),
              cases_resolved: 1 + (i % 3),
              agent_responses: 4 + (i % 5),
              defaults_filed: 0,
            })),
            config: {
              xAxis: 'week',
              lines: [
                { key: 'cases_initiated', label: 'Cases Initiated', color: '#00A3AD' },
                { key: 'cases_resolved', label: 'Cases Resolved', color: '#026786' },
                { key: 'agent_responses', label: 'Agent Responses', color: '#8B5CF6' },
                { key: 'defaults_filed', label: 'Defaults Filed', color: '#EF4444' },
              ],
            },
          },
        ],
      },
    ],
  };
}

export function demoLogs(limit = 50) {
  const samples = [
    { level: 'info', message: 'Opened case for cus_3F2A (S$420 across 2 invoices)' },
    { level: 'info', message: 'email_sent day=3 to cus_3F2A via Intercom' },
    { level: 'success', message: 'payment_recorded $180 on case 9c1e' },
    { level: 'info', message: 'agent_replied via Claude on conversation 4f1a' },
    { level: 'warn', message: 'Escalated case 7b22 → human (hostile_tone)' },
    { level: 'info', message: 'payment_plan_active proposed for case 6df0' },
    { level: 'success', message: 'Case 9c1e marked paid; total recovered $420' },
    { level: 'info', message: 'Daily discovery — 12 candidates, 3 new cases opened' },
  ];
  const start = Date.now();
  const n = Math.min(limit, samples.length * 4);
  const out = [] as Array<{ id: string; timestamp: string; level: string; message: string }>;
  for (let i = 0; i < n; i++) {
    const s = samples[i % samples.length]!;
    out.push({
      id: `demo-${i}`,
      timestamp: new Date(start - i * 5 * 60_000).toISOString(),
      level: s.level,
      message: s.message,
    });
  }
  return out;
}

export function demoActions() {
  return [
    {
      id: 'open_case',
      name: 'Open Case',
      description: 'Manually open a new debt case.',
      parameters: [],
    },
    {
      id: 'escalate_case',
      name: 'Escalate Case',
      description: 'Hand a case to the human queue.',
      parameters: [{ name: 'reason', type: 'string', required: true }],
    },
    {
      id: 'mark_paid',
      name: 'Mark Paid',
      description: 'Signal a payment_made event into the case workflow.',
      parameters: [{ name: 'amount_cents', type: 'number', required: true }],
    },
  ];
}
