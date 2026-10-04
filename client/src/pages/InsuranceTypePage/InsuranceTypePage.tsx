import type { FC } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import FaqList from '../../components/FaqList';
import InsuranceIcon from '../../components/InsuranceIcon';
import LandingFooter from '../../components/LandingFooter';
import LandingHeader from '../../components/LandingHeader';
import LeadWizard from '../../components/LeadWizard';
import { INSURANCE_TYPES } from '../../types/models';
import { insurancePages } from '../../utils/insuranceContent';
import { insuranceTypeLabels, isInsuranceType } from '../../utils/labels';
import styles from './InsuranceTypePage.module.css';

// A dedicated page per insurance type, with the quote form preset to that type.
const InsuranceTypePage: FC = () => {
  const { type = '' } = useParams();

  if (!isInsuranceType(type)) {
    return <Navigate to="/" replace />;
  }

  const content = insurancePages[type];
  const otherTypes = INSURANCE_TYPES.filter((t) => t !== type);

  return (
    <div className={styles.page}>
      <LandingHeader />

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.badge}>
              <span className={styles.badgeIcon}>
                <InsuranceIcon type={type} />
              </span>
              {insuranceTypeLabels[type]}
            </span>
            <h1>{content.headline}</h1>
            <p>{content.subtitle}</p>
          </div>
          {/* key remounts the wizard when navigating between insurance pages. */}
          <LeadWizard key={type} presetType={type} />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.inner}>
          <h2 className={styles.title}>מה הביטוח כולל?</h2>
          <div className={styles.coverages}>
            {content.coverages.map((coverage) => (
              <div key={coverage.title} className={styles.coverage}>
                <h3>{coverage.title}</h3>
                <p>{coverage.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.alt}`}>
        <div className={`${styles.inner} ${styles.narrow}`}>
          <h2 className={styles.title}>שאלות נפוצות על {insuranceTypeLabels[type]}</h2>
          <FaqList items={content.faq} />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.inner}>
          <h2 className={styles.title}>ביטוחים נוספים</h2>
          <div className={styles.others}>
            {otherTypes.map((other) => (
              <Link key={other} to={`/insurance/${other}`} className={styles.other}>
                <span className={styles.otherIcon}>
                  <InsuranceIcon type={other} />
                </span>
                {insuranceTypeLabels[other]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default InsuranceTypePage;
