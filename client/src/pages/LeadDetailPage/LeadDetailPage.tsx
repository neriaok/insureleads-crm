import { useState, type ChangeEvent, type FC, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import AssignSelect from '../../components/AssignSelect';
import StatusBadge from '../../components/StatusBadge';
import {
  useCreateNoteMutation,
  useGetLeadQuery,
  useListNotesQuery,
  useUpdateLeadStatusMutation,
} from '../../features/leads/leadsApi';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { LEAD_STATUSES, RENEWABLE_INSURANCE_TYPES, type Lead, type LeadStatus } from '../../types/models';
import { getErrorMessage } from '../../utils/errors';
import { formatDate, formatDateTime, insuranceTypeLabels, isLeadStatus, statusLabels } from '../../utils/labels';
import styles from './LeadDetailPage.module.css';

// Converts an ISO date to the "YYYY-MM-DDTHH:mm" local format that datetime-local inputs use.
function toLocalInputValue(iso: string): string {
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

interface StatusFormProps {
  lead: Lead;
}

const StatusForm: FC<StatusFormProps> = ({ lead }) => {
  const [status, setStatus] = useState<LeadStatus>(lead.status);
  const [callbackAt, setCallbackAt] = useState(lead.callbackAt ? toLocalInputValue(lead.callbackAt) : '');
  const [policyEndDate, setPolicyEndDate] = useState(lead.policyEndDate ?? '');
  const needsPolicyEndDate = status === 'won' && RENEWABLE_INSURANCE_TYPES.includes(lead.insuranceType);
  const [updateStatus, { isLoading, error }] = useUpdateLeadStatusMutation();

  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (isLeadStatus(value)) setStatus(value);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void updateStatus({
      id: lead.id,
      status,
      callbackAt: status === 'callback' && callbackAt ? new Date(callbackAt).toISOString() : undefined,
      policyEndDate: status === 'won' && policyEndDate ? policyEndDate : undefined,
    });
  };

  return (
    <form className={styles.statusForm} onSubmit={handleSubmit}>
      <label>
        סטטוס
        <select value={status} onChange={handleStatusChange}>
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabels[s]}
            </option>
          ))}
        </select>
      </label>
      {status === 'callback' && (
        <label>
          מועד לחזור
          <input type="datetime-local" value={callbackAt} onChange={(e) => setCallbackAt(e.target.value)} required />
        </label>
      )}
      {needsPolicyEndDate && (
        <label>
          תאריך סיום הפוליסה
          <input type="date" value={policyEndDate} onChange={(e) => setPolicyEndDate(e.target.value)} required />
          <span className={styles.hint}>ליד חידוש ייפתח אוטומטית 45 יום לפני התאריך</span>
        </label>
      )}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'שומר...' : 'עדכון סטטוס'}
      </button>
      {error && <p className={styles.error}>{getErrorMessage(error)}</p>}
    </form>
  );
};

interface NotesProps {
  leadId: number;
}

const Notes: FC<NotesProps> = ({ leadId }) => {
  const [content, setContent] = useState('');
  const { data: notes = [], isLoading } = useListNotesQuery(leadId);
  const [createNote, { isLoading: isSaving, error }] = useCreateNoteMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await createNote({ leadId, content });
    if (!result.error) setContent('');
  };

  return (
    <section className={styles.card}>
      <h2>הערות ושיחות</h2>
      <form className={styles.noteForm} onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="סיכום שיחה, פרטים חשובים..."
          rows={3}
          required
        />
        <button type="submit" disabled={isSaving || content.trim() === ''}>
          הוספת הערה
        </button>
        {error && <p className={styles.error}>{getErrorMessage(error)}</p>}
      </form>
      {isLoading && <p className={styles.muted}>טוען הערות...</p>}
      {!isLoading && notes.length === 0 && <p className={styles.muted}>אין הערות עדיין</p>}
      <ul className={styles.notes}>
        {notes.map((note) => (
          <li key={note.id} className={note.authorId === null ? `${styles.note} ${styles.systemNote}` : styles.note}>
            <div className={styles.noteMeta}>
              <strong>{note.authorName ?? 'מערכת'}</strong>
              <span>{formatDateTime(note.createdAt)}</span>
            </div>
            <p>{note.content}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

const LeadDetailPage: FC = () => {
  const leadId = Number(useParams().id);
  const { user } = useCurrentUser();
  const { data: lead, isLoading, error } = useGetLeadQuery(leadId, { skip: !Number.isInteger(leadId) });

  if (isLoading) return <p className={styles.muted}>טוען...</p>;
  if (error || !lead) {
    return (
      <div className={styles.page}>
        <p className={styles.error}>{getErrorMessage(error) ?? 'הליד לא נמצא'}</p>
        <Link to="/dashboard">חזרה לרשימה</Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link to="/dashboard" className={styles.back}>
        → חזרה לרשימה
      </Link>
      <div className={styles.heading}>
        <h1>{lead.fullName}</h1>
        <StatusBadge status={lead.status} />
        {lead.renewalOfLeadId && <span className={styles.renewal}>חידוש</span>}
      </div>

      <div className={styles.grid}>
        <section className={styles.card}>
          <h2>פרטי הליד</h2>
          <dl className={styles.details}>
            <dt>טלפון</dt>
            <dd>
              <a href={`tel:${lead.phone}`} dir="ltr">
                {lead.phone}
              </a>
            </dd>
            <dt>אימייל</dt>
            <dd>
              <span dir="ltr">{lead.email ?? '—'}</span>
            </dd>
            <dt>סוג ביטוח</dt>
            <dd>{insuranceTypeLabels[lead.insuranceType]}</dd>
            <dt>סוכן</dt>
            <dd>
              {user?.role === 'admin' ? <AssignSelect leadId={lead.id} agentId={lead.agentId} /> : (lead.agentName ?? '—')}
            </dd>
            <dt>לחזור ב-</dt>
            <dd>{lead.callbackAt ? formatDateTime(lead.callbackAt) : '—'}</dd>
            {lead.policyEndDate && (
              <>
                <dt>סיום פוליסה</dt>
                <dd>{formatDate(lead.policyEndDate)}</dd>
              </>
            )}
            {lead.renewalOfLeadId && (
              <>
                <dt>חידוש של</dt>
                <dd>
                  <Link to={`/leads/${lead.renewalOfLeadId}`}>ליד #{lead.renewalOfLeadId}</Link>
                </dd>
              </>
            )}
            <dt>הסכמה לפרטיות</dt>
            <dd>{formatDateTime(lead.consentAt)}</dd>
            <dt>נוצר</dt>
            <dd>{formatDateTime(lead.createdAt)}</dd>
          </dl>
        </section>

        <section className={styles.card}>
          <h2>עדכון סטטוס</h2>
          {/* Remount when the saved lead changes so the form starts from fresh values. */}
          <StatusForm key={lead.updatedAt} lead={lead} />
        </section>
      </div>

      <Notes leadId={lead.id} />
    </div>
  );
};

export default LeadDetailPage;
