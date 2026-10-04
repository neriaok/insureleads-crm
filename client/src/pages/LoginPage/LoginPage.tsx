import { useState, type FC, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { getErrorMessage } from '../../utils/errors';
import { useLoginMutation } from '../../features/auth/authApi';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import styles from './LoginPage.module.css';

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
      <form className={styles.card} onSubmit={handleSubmit}>
        <span className={styles.brand}>🛡️ InsureLeads</span>
        <h1 className={styles.title}>כניסה למערכת</h1>
        <label>
          אימייל
          <input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          סיסמה
          <input type="password" dir="ltr" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {errorMessage && <p className={styles.error}>{errorMessage}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'מתחבר...' : 'כניסה'}
        </button>
        <Link to="/" className={styles.back}>
          לטופס הלידים
        </Link>
      </form>
    </div>
  );
};

export default LoginPage;
