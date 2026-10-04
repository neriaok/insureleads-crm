import type { FC } from 'react';
import { Link } from 'react-router';
import { INSURANCE_TYPES } from '../../types/models';
import { insuranceTypeLabels } from '../../utils/labels';
import styles from './LandingFooter.module.css';

const LandingFooter: FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.about}>
          <span className={styles.brand}>InsureLeads</span>
          <p>השוואת ביטוחים עם ליווי אישי של סוכן, מהבקשה הראשונה ועד החידוש.</p>
        </div>
        <div>
          <h4>ביטוחים</h4>
          <ul>
            {INSURANCE_TYPES.map((type) => (
              <li key={type}>
                <Link to={`/insurance/${type}`}>{insuranceTypeLabels[type]}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>החברה</h4>
          <ul>
            <li>
              <a href="/#how">איך זה עובד</a>
            </li>
            <li>
              <a href="/#faq">שאלות נפוצות</a>
            </li>
            <li>
              <Link to="/login">כניסת סוכנים</Link>
            </li>
          </ul>
        </div>
      </div>
      <p className={styles.note}>פרויקט תיק עבודות. אין לראות בתוכן האתר הצעה לביטוח.</p>
    </footer>
  );
};

export default LandingFooter;
