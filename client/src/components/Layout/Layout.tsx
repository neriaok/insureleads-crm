import type { FC } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { useLogoutMutation } from '../../features/auth/authApi';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { roleLabels } from '../../utils/labels';
import styles from './Layout.module.css';

const Layout: FC = () => {
  const { user } = useCurrentUser();
  const [logout, { isLoading }] = useLogoutMutation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? `${styles.link} ${styles.active}` : styles.link);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.brand}>🛡️ InsureLeads</span>
        <nav className={styles.nav}>
          <NavLink to="/dashboard" className={linkClass}>
            לידים
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/users" className={linkClass}>
              משתמשים
            </NavLink>
          )}
        </nav>
        {user && (
          <div className={styles.user}>
            <span>
              {user.name} · {roleLabels[user.role]}
            </span>
            <button className={styles.logout} onClick={handleLogout} disabled={isLoading}>
              יציאה
            </button>
          </div>
        )}
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
