-- Renewal engine: a won car/home lead stores when its policy ends, and a daily job
-- creates a renewal lead ahead of that date.
ALTER TABLE leads ADD COLUMN policy_end_date DATE;

-- Points from a renewal lead to the won lead it renews. UNIQUE guarantees at most one
-- renewal per policy, which also makes the daily job safe to run more than once.
ALTER TABLE leads ADD COLUMN renewal_of_lead_id INTEGER UNIQUE REFERENCES leads (id) ON DELETE SET NULL;

CREATE INDEX leads_policy_end_date_idx ON leads (policy_end_date) WHERE status = 'won';
