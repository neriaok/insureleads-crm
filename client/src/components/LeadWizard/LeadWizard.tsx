import { useState, type ChangeEvent, type FC, type FormEvent } from 'react';
import { useCreateLeadMutation } from '../../features/leads/leadsApi';
import { INSURANCE_TYPES, type InsuranceType } from '../../types/models';
import { getErrorMessage } from '../../utils/errors';
import { insuranceTypeLabels } from '../../utils/labels';
import InsuranceIcon from '../InsuranceIcon';
import styles from './LeadWizard.module.css';

interface LeadWizardProps {
  // When set, the type step is skipped (e.g. on a dedicated insurance page).
  presetType?: InsuranceType;
}

type Step = 'type' | 'details' | 'confirm' | 'done';

interface Details {
  fullName: string;
  phone: string;
  email: string;
}

const emptyDetails: Details = { fullName: '', phone: '', email: '' };

// A three-step quote request: insurance type, contact details, consent and submit.
const LeadWizard: FC<LeadWizardProps> = ({ presetType }) => {
  const [step, setStep] = useState<Step>(presetType ? 'details' : 'type');
  const [type, setType] = useState<InsuranceType | null>(presetType ?? null);
  const [details, setDetails] = useState<Details>(emptyDetails);
  const [consent, setConsent] = useState(false);
  const [createLead, { isLoading, error, reset }] = useCreateLeadMutation();

  const steps: Step[] = presetType ? ['details', 'confirm'] : ['type', 'details', 'confirm'];
  const stepIndex = steps.indexOf(step);

  const handleTypeSelect = (selected: InsuranceType) => {
    setType(selected);
    setStep('details');
  };

  const handleDetailsChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetailsSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStep('confirm');
  };

  const handleConfirm = async (e: FormEvent) => {
    e.preventDefault();
    if (!type) return;
    const result = await createLead({ ...details, insuranceType: type, consent });
    if (!result.error) setStep('done');
  };

  const handleRestart = () => {
    reset();
    setDetails(emptyDetails);
    setConsent(false);
    setType(presetType ?? null);
    setStep(presetType ? 'details' : 'type');
  };

  if (step === 'done') {
    return (
      <div className={styles.card}>
        <div className={styles.done}>
          <div className={styles.check} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </div>
          <h3>הבקשה התקבלה!</h3>
          <p>סוכן אישי יחזור אליך בהקדם עם ההצעות המשתלמות ביותר.</p>
          <button className={styles.secondary} onClick={handleRestart}>
            בקשה נוספת
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.progress} aria-label={`שלב ${stepIndex + 1} מתוך ${steps.length}`}>
        {steps.map((s, index) => (
          <span key={s} className={index <= stepIndex ? `${styles.bar} ${styles.barActive}` : styles.bar} />
        ))}
      </div>

      {step === 'type' && (
        <div className={styles.step}>
          <h3 className={styles.title}>איזה ביטוח מעניין אותך?</h3>
          <div className={styles.types}>
            {INSURANCE_TYPES.map((t) => (
              <button key={t} type="button" className={styles.typeButton} onClick={() => handleTypeSelect(t)}>
                <span className={styles.typeIcon}>
                  <InsuranceIcon type={t} />
                </span>
                {insuranceTypeLabels[t]}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'details' && type && (
        <form className={styles.step} onSubmit={handleDetailsSubmit}>
          <div className={styles.titleRow}>
            <h3 className={styles.title}>לאן לשלוח את ההצעות?</h3>
            <span className={styles.chip}>
              <span className={styles.chipIcon}>
                <InsuranceIcon type={type} />
              </span>
              {insuranceTypeLabels[type]}
            </span>
          </div>
          <label>
            שם מלא
            <input name="fullName" value={details.fullName} onChange={handleDetailsChange} required minLength={2} autoFocus />
          </label>
          <label>
            טלפון נייד
            <input
              name="phone"
              type="tel"
              dir="ltr"
              value={details.phone}
              onChange={handleDetailsChange}
              required
              placeholder="050-1234567"
              pattern="[0-9+\-\s()]{9,16}"
            />
          </label>
          <label>
            <span>
              אימייל <span className={styles.optional}>(לא חובה)</span>
            </span>
            <input name="email" type="email" dir="ltr" value={details.email} onChange={handleDetailsChange} />
          </label>
          <div className={styles.actions}>
            {!presetType && (
              <button type="button" className={styles.secondary} onClick={() => setStep('type')}>
                חזרה
              </button>
            )}
            <button type="submit" className={styles.primary}>
              המשך
            </button>
          </div>
        </form>
      )}

      {step === 'confirm' && type && (
        <form className={styles.step} onSubmit={handleConfirm}>
          <h3 className={styles.title}>רגע לפני שליחה</h3>
          <dl className={styles.summary}>
            <dt>ביטוח</dt>
            <dd>{insuranceTypeLabels[type]}</dd>
            <dt>שם</dt>
            <dd>{details.fullName}</dd>
            <dt>טלפון</dt>
            <dd>
              <span dir="ltr">{details.phone}</span>
            </dd>
            {details.email && (
              <>
                <dt>אימייל</dt>
                <dd>
                  <span dir="ltr">{details.email}</span>
                </dd>
              </>
            )}
          </dl>
          <label className={styles.consent}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} required />
            אני מאשר/ת את מדיניות הפרטיות ויצירת קשר לצורך קבלת הצעות ביטוח
          </label>
          {error && <p className={styles.error}>{getErrorMessage(error)}</p>}
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => setStep('details')}>
              עריכה
            </button>
            <button type="submit" className={styles.primary} disabled={isLoading}>
              {isLoading ? 'שולח...' : 'שלחו לי הצעות'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LeadWizard;
