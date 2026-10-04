import { useState, type ChangeEvent, type FC, type FormEvent } from 'react';
import { useCreateUserMutation, useListUsersQuery, type CreateUserBody } from '../../features/users/usersApi';
import { getErrorMessage } from '../../utils/errors';
import Avatar from '../../components/Avatar';
import { formatDateTime, roleLabels } from '../../utils/labels';
import styles from './UsersPage.module.css';

const emptyForm: CreateUserBody = { name: '', email: '', password: '', role: 'agent' };

const UsersPage: FC = () => {
  const [form, setForm] = useState<CreateUserBody>(emptyForm);
  const { data: users = [], isLoading } = useListUsersQuery();
  const [createUser, { isLoading: isSaving, error }] = useCreateUserMutation();

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'admin' || value === 'agent') {
      setForm((prev) => ({ ...prev, role: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await createUser(form);
    if (!result.error) setForm(emptyForm);
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>צוות</h1>
        <p>{users.length} משתמשים במערכת</p>
      </header>
      <div className={styles.grid}>
        <section className={styles.card}>
          {isLoading ? (
            <p className={styles.muted}>טוען...</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>שם</th>
                  <th>אימייל</th>
                  <th>תפקיד</th>
                  <th>נוצר</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.person}>
                        <Avatar name={user.name} size="sm" />
                        <strong>{user.name}</strong>
                      </div>
                    </td>
                    <td dir="ltr" className={styles.email}>
                      {user.email}
                    </td>
                    <td>
                      <span className={user.role === 'admin' ? `${styles.role} ${styles.admin}` : styles.role}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className={styles.muted}>{formatDateTime(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <form className={styles.card} onSubmit={handleSubmit}>
          <h2>הוספת משתמש</h2>
          <p className={styles.formHint}>סוכן חדש יוכל להתחבר מיד עם האימייל והסיסמה שתגדירו.</p>
          <label>
            שם
            <input name="name" value={form.name} onChange={handleTextChange} required minLength={2} />
          </label>
          <label>
            אימייל
            <input name="email" type="email" dir="ltr" value={form.email} onChange={handleTextChange} required />
          </label>
          <label>
            סיסמה (לפחות 8 תווים)
            <input name="password" type="password" dir="ltr" value={form.password} onChange={handleTextChange} required minLength={8} />
          </label>
          <label>
            תפקיד
            <select value={form.role} onChange={handleRoleChange}>
              <option value="agent">{roleLabels.agent}</option>
              <option value="admin">{roleLabels.admin}</option>
            </select>
          </label>
          {error && <p className={styles.error}>{getErrorMessage(error)}</p>}
          <button type="submit" disabled={isSaving}>
            {isSaving ? 'שומר...' : 'הוספה'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UsersPage;
