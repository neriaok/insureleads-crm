import { useState, type ChangeEvent, type FC, type FormEvent } from 'react';
import { Link } from 'react-router';
import { getErrorMessage } from '../../utils/errors';
import { useCreateLeadMutation, type CreateLeadBody } from '../../features/leads/leadsApi';
import { INSURANCE_TYPES } from '../../types/models';
import { insuranceTypeLabels, isInsuranceType } from '../../utils/labels';
import styles from './LeadFormPage.module.css';

const emptyForm: CreateLeadBody = {
  fullName: '',
  phone: '',
  email: '',
  insuranceType: 'car',
  consent: false,
};

const LeadFormPage: FC = () => {
  const [form, setForm] = useState<CreateLeadBody>(emptyForm);
  const [submitted, setSubmitted] = useState(false);
  const [createLead, { isLoading, error }] = useCreateLeadMutation();

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (isInsuranceType(value)) {
      setForm((prev) => ({ ...prev, insuranceType: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await createLead(form);
    if (!result.error) {
      setSubmitted(true);
      setForm(emptyForm);
    }
  };

  const errorMessage = getErrorMessage(error);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.brand}>🛡️ InsureLeads</span>
        <h1 className={styles.title}>ביטוח שמתאים בדיוק לך</h1>
        <p className={styles.subtitle}>השאירו פרטים, וסוכן מקצועי יחזור אליכם עם הצעה משתלמת. בלי התחייבות.</p>
      </section>

      <div className={styles.card}>
        {submitted ? (
          <div className={styles.success}>
            <h2>תודה! הפרטים התקבלו</h2>
            <p>סוכן יחזור אליכם בהקדם.</p>
            <button onClick={() => setSubmitted(false)}>שליחת פנייה נוספת</button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <h2>קבלת הצעת מחיר</h2>
            <label>
              שם מלא
              <input name="fullName" value={form.fullName} onChange={handleTextChange} required minLength={2} />
            </label>
            <label>
              טלפון
              <input name="phone" type="tel" dir="ltr" value={form.phone} onChange={handleTextChange} required placeholder="050-1234567" />
            </label>
            <label>
              אימייל (לא חובה)
              <input name="email" type="email" dir="ltr" value={form.email} onChange={handleTextChange} />
            </label>
            <label>
              סוג ביטוח
              <select value={form.insuranceType} onChange={handleTypeChange}>
                {INSURANCE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {insuranceTypeLabels[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.consent}>
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setForm((prev) => ({ ...prev, consent: e.target.checked }))}
                required
              />
              אני מאשר/ת את תנאי הפרטיות ויצירת קשר לצורך קבלת הצעה
            </label>
            {errorMessage && <p className={styles.error}>{errorMessage}</p>}
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'שולח...' : 'שלחו לי הצעה'}
            </button>
          </form>
        )}
      </div>

      <footer className={styles.footer}>
        <Link to="/login">כניסת סוכנים</Link>
      </footer>
    </div>
  );
};

export default LeadFormPage;
