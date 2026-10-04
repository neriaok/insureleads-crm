// CLI entry point: npm run renewals
// Runs the same daily job as the /api/cron/renewals endpoint, for local use.
import { todayInIsrael } from '../utils/dates.js';
import { pool } from './pool.js';
import { createDueRenewals, RENEWAL_LEAD_DAYS } from './queries/renewalQueries.js';

try {
  const today = todayInIsrael();
  const created = await createDueRenewals(today);
  console.log(`Policies ending within ${RENEWAL_LEAD_DAYS} days of ${today}: created ${created.length} renewal lead(s)`);
  for (const renewal of created) {
    console.log(`  lead #${renewal.renewalLeadId} renews #${renewal.originalLeadId} (ends ${renewal.policyEndDate})`);
  }
} finally {
  await pool.end();
}
