import { useState, type FC } from 'react';
import { Link, NavLink } from 'react-router';
import { INSURANCE_TYPES } from '../../types/models';
import { insuranceTypeLabels } from '../../utils/labels';
import styles from './LandingHeader.module.css';

// Public site header: insurance pages, quote button and agent login.
const LandingHeader: FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? `${styles.link} ${styles.active}` : styles.link);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            IL
          </span>
          InsureLeads
        </Link>

        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label="תפריט"
        >
          <span />
          <span />
          <span />
        </button>

        <nav className={menuOpen ? `${styles.nav} ${styles.navOpen}` : styles.nav} onClick={() => setMenuOpen(false)}>
          {INSURANCE_TYPES.map((type) => (
            <NavLink key={type} to={`/insurance/${type}`} className={linkClass}>
              {insuranceTypeLabels[type]}
            </NavLink>
          ))}
          <Link to="/login" className={styles.login}>
            כניסת סוכנים
          </Link>
          <a href="/#quote" className={styles.cta}>
            קבלת הצעה
          </a>
        </nav>
      </div>
    </header>
  );
};

export default LandingHeader;
