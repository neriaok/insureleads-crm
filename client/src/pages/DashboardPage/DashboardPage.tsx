import { useState, type FC } from 'react';
import { useNavigate } from 'react-router';
import AssignSelect from '../../components/AssignSelect';
import StatusBadge from '../../components/StatusBadge';
import { useListLeadsQuery } from '../../features/leads/leadsApi';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { LEAD_STATUSES, type LeadStatus } from '../../types/models';
import { getErrorMessage } from '../../utils/errors';
import { formatDateTime, insuranceTypeLabels, statusLabels } from '../../utils/labels';
import styles from './DashboardPage.module.css';

type StatusFilter = LeadStatus | 'all';

const DashboardPage: FC = () => {
  const { user } = useCurrentUser();
  const isAdmin = user?.role === 'admin';
  const [filter, setFilter] = useState<StatusFilter>('all');
  // Fetch every visible lead once; counts and filtering happen on the client.
  const { data: leads = [], isLoading, error } = useListLeadsQuery({});
  const navigate = useNavigate();

  const countByStatus = (status: LeadStatus) => leads.filter((lead) => lead.status === status).length;
  const visibleLeads = filter === 'all' ? leads : leads.filter((lead) => lead.status === filter);

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1>{isAdmin ? 'כל הלידים' : 'הלידים שלי'}</h1>
        <span className={styles.total}>{leads.length} לידים</span>
      </div>

      <div className={styles.filters}>
        <button
          className={filter === 'all' ? `${styles.filter} ${styles.activeFilter}` : styles.filter}
          onClick={() => setFilter('all')}
        >
          הכל ({leads.length})
        </button>
        {LEAD_STATUSES.map((status) => (
          <button
            key={status}
            className={filter === status ? `${styles.filter} ${styles.activeFilter}` : styles.filter}
            onClick={() => setFilter(status)}
          >
            {statusLabels[status]} ({countByStatus(status)})
          </button>
        ))}
      </div>

      {isLoading && <p className={styles.message}>טוען לידים...</p>}
      {error && <p className={styles.error}>{getErrorMessage(error)}</p>}
      {!isLoading && !error && visibleLeads.length === 0 && <p className={styles.message}>אין לידים להצגה</p>}

      {visibleLeads.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>שם</th>
                <th>טלפון</th>
                <th>סוג ביטוח</th>
                <th>סטטוס</th>
                <th>סוכן</th>
                <th>לחזור ב-</th>
                <th>נוצר</th>
              </tr>
            </thead>
            <tbody>
              {visibleLeads.map((lead) => (
                <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                  <td className={styles.name}>{lead.fullName}</td>
                  <td dir="ltr" className={styles.phone}>
                    {lead.phone}
                  </td>
                  <td>{insuranceTypeLabels[lead.insuranceType]}</td>
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
                  <td className={styles.muted}>{formatDateTime(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
