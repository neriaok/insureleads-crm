// Fills the database with realistic demo data: 3 agents and leads of every insurance type
// and status, with notes, callbacks, and won policies that trigger renewal leads.
// Usage: npm run seed:demo [-- --agent-password <password>]
// Without --agent-password the demo agents get a random password nobody knows, so they
// appear in the app (assignments, notes) but cannot log in.
import { randomBytes } from 'node:crypto';
import { parseArgs } from 'node:util';
import type { PoolClient } from 'pg';
import type { InsuranceType, LeadStatus } from '../types/models.js';
import { hashPassword } from '../utils/auth.js';
import { todayInIsrael } from '../utils/dates.js';
import { pool } from './pool.js';
import { createDueRenewals } from './queries/renewalQueries.js';
import { findUserByEmail } from './queries/userQueries.js';
import { withTransaction } from './transaction.js';

const { values } = parseArgs({ options: { 'agent-password': { type: 'string' } } });
const agentPassword = values['agent-password'] ?? randomBytes(24).toString('hex');
if (agentPassword.length < 8) {
  console.error('--agent-password must be at least 8 characters');
  process.exit(1);
}

const AGENTS = [
  { name: 'דנה כהן', email: 'demo.dana@example.com' },
  { name: 'יוסי לוי', email: 'demo.yossi@example.com' },
  { name: 'מיכל אברהם', email: 'demo.michal@example.com' },
];

interface DemoLead {
  fullName: string;
  phone: string;
  email?: string;
  type: InsuranceType;
  status: LeadStatus;
  agent: number | null; // index into AGENTS
  daysAgo: number;
  callbackInHours?: number;
  policyEndsInDays?: number;
  notes?: string[];
}

const LEADS: DemoLead[] = [
  { fullName: 'אבי מזרחי', phone: '0521110001', type: 'car', status: 'new', agent: null, daysAgo: 0 },
  { fullName: 'רונית שפירא', phone: '0541110002', email: 'ronit@example.com', type: 'home', status: 'new', agent: null, daysAgo: 0 },
  { fullName: 'משה ביטון', phone: '0501110003', type: 'travel', status: 'new', agent: null, daysAgo: 1 },
  { fullName: 'שירה גולן', phone: '0531110004', type: 'mortgage', status: 'new', agent: 0, daysAgo: 1 },
  { fullName: 'עומר פרץ', phone: '0581110005', email: 'omer@example.com', type: 'health_life', status: 'new', agent: 1, daysAgo: 2 },
  {
    fullName: 'נועה אשכנזי', phone: '0521110006', type: 'car', status: 'in_progress', agent: 0, daysAgo: 3,
    notes: ['שיחה ראשונה: רכב מאזדה 3 מ-2021, מבוטחת כיום בהראל. מבקשת הצעה לפני חידוש בעוד חודש.'],
  },
  {
    fullName: 'איתי חדד', phone: '0541110007', type: 'home', status: 'in_progress', agent: 1, daysAgo: 4,
    notes: ['דירת 4 חדרים בחולון. רוצה גם כיסוי לתכולה. שלחתי טופס פרטים במייל.'],
  },
  {
    fullName: 'ליאת ברק', phone: '0501110008', email: 'liat@example.com', type: 'mortgage', status: 'in_progress', agent: 2, daysAgo: 5,
    notes: ['משכנתא חדשה בבנק לאומי, צריכה אישור ביטוח תוך שבוע.'],
  },
  {
    fullName: 'גיא רוזן', phone: '0521110009', type: 'car', status: 'callback', agent: 0, daysAgo: 2, callbackInHours: 3,
    notes: ['לא ענה בבוקר. ביקש לחזור אחר הצהריים.'],
  },
  {
    fullName: 'הדס נחום', phone: '0531110010', type: 'travel', status: 'callback', agent: 1, daysAgo: 1, callbackInHours: 20,
    notes: ['טסה ליוון בעוד שבועיים עם שני ילדים. מחכה לאישור תאריכים מהעבודה.'],
  },
  {
    fullName: 'יעקב דהן', phone: '0581110011', type: 'health_life', status: 'callback', agent: 2, daysAgo: 6, callbackInHours: 26,
    notes: ['מעוניין בביטוח חיים למשכנתא + בריאות. בן הזוג צריך להיות בשיחה.'],
  },
  {
    fullName: 'תמר וקנין', phone: '0541110012', email: 'tamar@example.com', type: 'car', status: 'quote_sent', agent: 0, daysAgo: 7,
    notes: ['שלחתי 3 הצעות: מקיף + צד ג׳. הזולה ב-15% מהמחיר הנוכחי שלה.', 'אמרה שתחליט עד סוף השבוע.'],
  },
  {
    fullName: 'רועי אלון', phone: '0501110013', type: 'home', status: 'quote_sent', agent: 1, daysAgo: 9,
    notes: ['הצעה למבנה ותכולה נשלחה בוואטסאפ.'],
  },
  {
    fullName: 'סיגל טל', phone: '0521110014', type: 'mortgage', status: 'quote_sent', agent: 2, daysAgo: 8,
    notes: ['הצעה נשלחה, החיסכון לעומת הבנק כ-40,000 ₪ לאורך התקופה.'],
  },
  {
    fullName: 'דוד אוחיון', phone: '0531110015', type: 'car', status: 'won', agent: 0, daysAgo: 25, policyEndsInDays: 30,
    notes: ['נסגר! מקיף בהפניקס. הפוליסה מתחדשת בקרוב, פוליסה קצרה עד סוף תקופת הרישוי.'],
  },
  {
    fullName: 'אורית לוין', phone: '0581110016', type: 'home', status: 'won', agent: 1, daysAgo: 28, policyEndsInDays: 40,
    notes: ['נסגר ביטוח מבנה ותכולה.'],
  },
  {
    fullName: 'בני שמואלי', phone: '0541110017', type: 'car', status: 'won', agent: 2, daysAgo: 20, policyEndsInDays: 350,
    notes: ['נסגר מקיף לשנה.'],
  },
  {
    fullName: 'מאיה קליין', phone: '0501110018', email: 'maya@example.com', type: 'travel', status: 'won', agent: 1, daysAgo: 12,
    notes: ['נרכש ביטוח נסיעות לאירופה, כולל כיסוי סקי.'],
  },
  {
    fullName: 'אלון בן דוד', phone: '0521110019', type: 'health_life', status: 'won', agent: 2, daysAgo: 18,
    notes: ['נסגר ביטוח חיים + בריאות משלים.'],
  },
  {
    fullName: 'קרן יוסף', phone: '0531110020', type: 'car', status: 'lost', agent: 0, daysAgo: 15,
    notes: ['בחרה להישאר בחברה הנוכחית אחרי שהציעו לה הנחה.'],
  },
  {
    fullName: 'ניר אדלר', phone: '0581110021', type: 'home', status: 'lost', agent: 1, daysAgo: 14,
    notes: ['לא זמין אחרי 4 ניסיונות.'],
  },
  {
    fullName: 'שני גבאי', phone: '0541110022', type: 'mortgage', status: 'lost', agent: null, daysAgo: 21,
    notes: ['העסקה על הדירה בוטלה.'],
  },
  { fullName: 'אריאל סויסה', phone: '0501110023', type: 'travel', status: 'in_progress', agent: 0, daysAgo: 2 },
  { fullName: 'לירון חזן', phone: '0521110024', email: 'liron@example.com', type: 'health_life', status: 'quote_sent', agent: 1, daysAgo: 6 },
];

async function insertDemoData(client: PoolClient, agentIds: number[]): Promise<number> {
  const today = todayInIsrael();
  for (const lead of LEADS) {
    const agentId = lead.agent === null ? null : (agentIds[lead.agent] ?? null);
    const inserted = await client.query<{ id: number }>(
      `INSERT INTO leads (full_name, phone, email, insurance_type, status, agent_id,
                          consent_at, callback_at, policy_end_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6,
               now() - make_interval(days => $7::int),
               CASE WHEN $8::int IS NULL THEN NULL ELSE now() + make_interval(hours => $8::int) END,
               CASE WHEN $9::int IS NULL THEN NULL ELSE $10::date + $9::int END,
               now() - make_interval(days => $7::int),
               now() - make_interval(days => $7::int))
       RETURNING id`,
      [
        lead.fullName,
        lead.phone,
        lead.email ?? null,
        lead.type,
        lead.status,
        agentId,
        lead.daysAgo,
        lead.callbackInHours ?? null,
        lead.policyEndsInDays ?? null,
        today,
      ],
    );
    const leadId = inserted.rows[0]?.id;
    for (const [index, content] of (lead.notes ?? []).entries()) {
      // Older notes first, spread across the time since the lead arrived.
      await client.query(
        `INSERT INTO lead_notes (lead_id, author_id, content, created_at)
         VALUES ($1, $2, $3, now() - make_interval(days => $4::int))`,
        [leadId, agentId, content, Math.max(lead.daysAgo - index - 1, 0)],
      );
    }
  }

  // One lead that also came in a second time through the form (the duplicate rule in action).
  await client.query(
    `INSERT INTO lead_notes (lead_id, author_id, content)
     SELECT id, NULL, 'Duplicate submission from the lead form: רונית שפירא, insurance type: car'
     FROM leads WHERE phone = '0541110002'`,
  );
  return LEADS.length;
}

try {
  if (await findUserByEmail(AGENTS[0]?.email ?? '')) {
    console.error('Demo data already exists (found demo agents). Nothing was changed.');
    process.exitCode = 1;
  } else {
    const passwordHash = await hashPassword(agentPassword);
    const leadCount = await withTransaction(async (client) => {
      const agentIds: number[] = [];
      for (const agent of AGENTS) {
        const result = await client.query<{ id: number }>(
          `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'agent') RETURNING id`,
          [agent.name, agent.email, passwordHash],
        );
        agentIds.push(result.rows[0]?.id ?? 0);
      }
      return insertDemoData(client, agentIds);
    });
    const renewals = await createDueRenewals(todayInIsrael());

    console.log(`Created ${AGENTS.length} demo agents, ${leadCount} leads and ${renewals.length} renewal lead(s).`);
    console.log(
      values['agent-password']
        ? `Demo agents can log in with the password you chose: ${AGENTS.map((a) => a.email).join(', ')}`
        : 'Demo agents have a random password and cannot log in (pass --agent-password to allow it).',
    );
  }
} finally {
  await pool.end();
}
