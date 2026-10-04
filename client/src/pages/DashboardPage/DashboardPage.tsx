import { useMemo, useState, type FC } from 'react';
import { useNavigate } from 'react-router';
import AssignSelect from '../../components/AssignSelect';
import Avatar from '../../components/Avatar';
import InsuranceIcon from '../../components/InsuranceIcon';
import StatusBadge from '../../components/StatusBadge';
import { useListLeadsQuery } from '../../features/leads/leadsApi';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { LEAD_STATUSES, type Lead, type LeadStatus } from '../../types/models';
import { getErrorMessage } from '../../utils/errors';
import {
  formatDateTime,
  formatRelative,
  formatTime,
  insuranceTypeLabels,
  statusLabels,
  toLocalDateKey,
} from '../../utils/labels';
import styles from './DashboardPage.module.css';

type StatusFilter = LeadStatus | 'all';

interface Stats {
  newTotal: number;
  newToday: number;
  callbacksDue: Lead[];
  overdueCount: number;
  closeRate: number | null;
  wonCount: number;
  openRenewals: number;
}

// Everything on the dashboard is derived from the one list the API already returns.
function computeStats(leads: Lead[], now: Date): Stats {
  const todayKey = toLocalDateKey(now);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const callbacksDue = leads
    .filter((lead) => lead.status === 'callback' && lead.callbackAt && new Date(lead.callbackAt) <= endOfToday)
    .sort((a, b) => (a.callbackAt ?? '').localeCompare(b.callbackAt ?? ''));
  const won = leads.filter((lead) => lead.status === 'won').length;
  const lost = leads.filter((lead) => lead.status === 'lost').length;

  return {
    newTotal: leads.filter((lead) => lead.status === 'new').length,
    newToday: leads.filter((lead) => toLocalDateKey(new Date(lead.createdAt)) === todayKey).length,
    callbacksDue,
    overdueCount: callbacksDue.filter((lead) => new Date(lead.callbackAt ?? '') < now).length,
    closeRate: won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null,
    wonCount: won,
    openRenewals: leads.filter((lead) => lead.renewalOfLeadId !== null && lead.status !== 'won' && lead.status !== 'lost')
      .length,
  };
}

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return 'בוקר טוב';
  if (hour < 18) return 'צהריים טובים';
  return 'ערב טוב';
}

const DashboardPage: FC = () => {
  const { user } = useCurrentUser();
  const isAdmin = user?.role === 'admin';
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const { data: leads = [], isLoading, error } = useListLeadsQuery({});
  const navigate = useNavigate();

  const now = useMemo(() => new Date(), [leads]);
  const stats = useMemo(() => computeStats(leads, now), [leads, now]);
  const countByStatus = (status: LeadStatus) => leads.filter((lead) => lead.status === status).length;
  const maxStatusCount = Math.max(1, ...LEAD_STATUSES.map(countByStatus));

  const query = search.trim().toLowerCase();
  const queryDigits = query.replace(/\D/g, '');
  const visibleLeads = leads.filter(
    (lead) =>
      (filter === 'all' || lead.status === filter) &&
      (query === '' ||
        lead.fullName.toLowerCase().includes(query) ||
        (queryDigits !== '' && lead.phone.includes(queryDigits))),
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>
            {greeting(now)}, {user?.name.split(' ')[0]}
          </h1>
          <p>{isAdmin ? 'תמונת מצב של כל הלידים בסוכנות' : 'הלידים והמשימות שלך להיום'}</p>
        </div>
        <span className={styles.date}>
          {now.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </header>

      {error && <p className={styles.error}>{getErrorMessage(error)}</p>}

      <section className={styles.kpis}>
        <div className={`${styles.kpi} ${styles.kpiIndigo}`}>
          <span className={styles.kpiLabel}>לידים חדשים</span>
          <strong className={styles.kpiValue}>{stats.newTotal}</strong>
          <span className={styles.kpiHint}>{stats.newToday} הגיעו היום</span>
        </div>
        <div className={`${styles.kpi} ${styles.kpiViolet}`}>
          <span className={styles.kpiLabel}>שיחות להיום</span>
          <strong className={styles.kpiValue}>{stats.callbacksDue.length}</strong>
          <span className={stats.overdueCount > 0 ? `${styles.kpiHint} ${styles.kpiAlert}` : styles.kpiHint}>
            {stats.overdueCount > 0 ? `${stats.overdueCount} באיחור` : 'אין שיחות באיחור'}
          </span>
        </div>
        <div className={`${styles.kpi} ${styles.kpiMint}`}>
          <span className={styles.kpiLabel}>אחוז סגירה</span>
          <strong className={styles.kpiValue}>{stats.closeRate === null ? '—' : `${stats.closeRate}%`}</strong>
          <span className={styles.kpiHint}>{stats.wonCount} עסקאות נסגרו</span>
        </div>
        <div className={`${styles.kpi} ${styles.kpiAmber}`}>
          <span className={styles.kpiLabel}>חידושים פתוחים</span>
          <strong className={styles.kpiValue}>{stats.openRenewals}</strong>
          <span className={styles.kpiHint}>לפני סיום פוליסה</span>
        </div>
      </section>

      <section className={styles.panels}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>שיחות להיום</h2>
            <span className={styles.count}>{stats.callbacksDue.length}</span>
          </div>
          {stats.callbacksDue.length === 0 ? (
            <p className={styles.empty}>אין שיחות מתוכננות להיום 🎉</p>
          ) : (
            <ul className={styles.callbacks}>
              {stats.callbacksDue.map((lead) => {
                const overdue = new Date(lead.callbackAt ?? '') < now;
                return (
                  <li key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                    <span className={overdue ? `${styles.time} ${styles.overdue}` : styles.time}>
                      {lead.callbackAt && formatTime(lead.callbackAt)}
                    </span>
                    <div className={styles.callbackText}>
                      <strong>{lead.fullName}</strong>
                      <span>
                        {insuranceTypeLabels[lead.insuranceType]}
                        {isAdmin && lead.agentName ? ` · ${lead.agentName}` : ''}
                      </span>
                    </div>
                    {overdue && <span className={styles.overdueTag}>באיחור</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>משפך מכירות</h2>
          </div>
          <ul className={styles.funnel}>
            {LEAD_STATUSES.map((status) => {
              const count = countByStatus(status);
              return (
                <li key={status}>
                  <span className={styles.funnelLabel}>{statusLabels[status]}</span>
                  <div className={styles.funnelTrack}>
                    <span
                      className={`${styles.funnelBar} ${styles[`bar_${status}`]}`}
                      // Bar width is data-driven, so it is set at runtime.
                      style={{ width: `${(count / maxStatusCount) * 100}%` }}
                    />
                  </div>
                  <span className={styles.funnelCount}>{count}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className={styles.tableCard}>
        <div className={styles.tableToolbar}>
          <h2>{isAdmin ? 'כל הלידים' : 'הלידים שלי'}</h2>
          <input
            className={styles.search}
            type="search"
            placeholder="חיפוש לפי שם או טלפון..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filters}>
          <button
            className={filter === 'all' ? `${styles.filter} ${styles.activeFilter}` : styles.filter}
            onClick={() => setFilter('all')}
          >
            הכל <span>{leads.length}</span>
          </button>
          {LEAD_STATUSES.map((status) => (
            <button
              key={status}
              className={filter === status ? `${styles.filter} ${styles.activeFilter}` : styles.filter}
              onClick={() => setFilter(status)}
            >
              {statusLabels[status]} <span>{countByStatus(status)}</span>
            </button>
          ))}
        </div>

        {isLoading && <p className={styles.empty}>טוען לידים...</p>}
        {!isLoading && visibleLeads.length === 0 && <p className={styles.empty}>לא נמצאו לידים</p>}

        {visibleLeads.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>לקוח</th>
                  <th>טלפון</th>
                  <th>ביטוח</th>
                  <th>סטטוס</th>
                  <th>סוכן</th>
                  <th>לחזור ב-</th>
                  <th>התקבל</th>
                </tr>
              </thead>
              <tbody>
                {visibleLeads.map((lead) => (
                  <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                    <td>
                      <div className={styles.customer}>
                        <Avatar name={lead.fullName} size="sm" />
                        <div>
                          <strong>{lead.fullName}</strong>
                          {lead.renewalOfLeadId && <span className={styles.renewal}>חידוש</span>}
                        </div>
                      </div>
                    </td>
                    <td dir="ltr" className={styles.phone}>
                      {lead.phone}
                    </td>
                    <td>
                      <span className={styles.type}>
                        <span className={styles.typeIcon}>
                          <InsuranceIcon type={lead.insuranceType} />
                        </span>
                        {insuranceTypeLabels[lead.insuranceType]}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={lead.status} />
                    </td>
                    <td>
                      {isAdmin ? (
                        <AssignSelect leadId={lead.id} agentId={lead.agentId} />
                      ) : (
                        (lead.agentName ?? '—')
                      )}
                    </td>
                    <td>{lead.callbackAt ? formatDateTime(lead.callbackAt) : '—'}</td>
                    <td className={styles.muted} title={formatDateTime(lead.createdAt)}>
                      {formatRelative(lead.createdAt, now)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
