import { useState, type FC } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useLogoutMutation } from '../../features/auth/authApi';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { roleLabels } from '../../utils/labels';
import Avatar from '../Avatar';
import styles from './Layout.module.css';

// Small inline icons for the side navigation.
const icons = {
  dashboard: 'M4 13h6V4H4zM14 20h6v-9h-6zM14 4v4h6V4zM4 20h6v-3H4z',
  users: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM21 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8',
  site: 'M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z',
  logout: 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l-5-5 5-5M5 12h11',
};

const NavIcon: FC<{ path: string }> = ({ path }) => (
  <svg className={styles.navIcon} viewBox="0 0 24 24" aria-hidden="true">
    <path d={path} />
  </svg>
);

const Layout: FC = () => {
  const { user } = useCurrentUser();
  const [logout, { isLoading }] = useLogoutMutation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? `${styles.link} ${styles.active}` : styles.link);

  return (
    <div className={styles.shell}>
      <aside className={menuOpen ? `${styles.sidebar} ${styles.sidebarOpen}` : styles.sidebar}>
        <div className={styles.brandRow}>
          <Link to="/dashboard" className={styles.brand}>
            <span className={styles.logo} aria-hidden="true">
              IL
            </span>
            InsureLeads
          </Link>
          <button className={styles.menuButton} onClick={() => setMenuOpen((open) => !open)} aria-label="תפריט">
            <span />
            <span />
            <span />
          </button>
        </div>

        <nav className={styles.nav} onClick={() => setMenuOpen(false)}>
          <span className={styles.navLabel}>ניהול</span>
          <NavLink to="/dashboard" className={linkClass}>
            <NavIcon path={icons.dashboard} />
            לוח בקרה
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/users" className={linkClass}>
              <NavIcon path={icons.users} />
              משתמשים
            </NavLink>
          )}
          <span className={styles.navLabel}>כללי</span>
          <Link to="/" className={styles.link}>
            <NavIcon path={icons.site} />
            לאתר הציבורי
          </Link>
        </nav>

        {user && (
          <div className={styles.userCard}>
            <Avatar name={user.name} size="sm" />
            <div className={styles.userText}>
              <strong>{user.name}</strong>
              <span>{roleLabels[user.role]}</span>
            </div>
            <button className={styles.logout} onClick={handleLogout} disabled={isLoading} aria-label="יציאה" title="יציאה">
              <NavIcon path={icons.logout} />
            </button>
          </div>
        )}
      </aside>

      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
