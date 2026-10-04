import { useState, type FC, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useLoginMutation } from '../../features/auth/authApi';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { getErrorMessage } from '../../utils/errors';
import styles from './LoginPage.module.css';

const features = ['כל הלידים והשיחות במקום אחד', 'תזכורות לשיחות חוזרות', 'חידושי פוליסות אוטומטיים'];

const LoginPage: FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { user } = useCurrentUser();
  const [login, { isLoading, error }] = useLoginMutation();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await login({ email, password });
    if (!result.error) {
      navigate('/dashboard');
    }
  };

  const errorMessage = getErrorMessage(error);

  return (
    <div className={styles.page}>
      <section className={styles.showcase}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            IL
          </span>
          InsureLeads
        </Link>
        <div className={styles.pitch}>
          <h1>
            מערכת הסוכנים
            <br />
            <span>שעובדת בשבילך.</span>
          </h1>
          <ul>
            {features.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>
        </div>
        <span className={styles.footnote}>InsureLeads CRM</span>
      </section>

      <section className={styles.formSide}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <h2>ברוכים השבים</h2>
          <p className={styles.subtitle}>התחברו כדי לראות את הלידים שלכם</p>
          <label>
            אימייל
            <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>
          <label>
            סיסמה
            <input type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {errorMessage && <p className={styles.error}>{errorMessage}</p>}
          <button type="submit" disabled={isLoading} className={styles.submit}>
            {isLoading ? 'מתחבר...' : 'כניסה'}
          </button>
          <Link to="/" className={styles.back}>
            → חזרה לאתר
          </Link>
        </form>
      </section>
    </div>
  );
};

export default LoginPage;
