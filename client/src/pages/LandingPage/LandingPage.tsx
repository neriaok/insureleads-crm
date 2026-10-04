import type { FC } from 'react';
import { Link } from 'react-router';
import FaqList from '../../components/FaqList';
import InsuranceIcon from '../../components/InsuranceIcon';
import LandingFooter from '../../components/LandingFooter';
import LandingHeader from '../../components/LandingHeader';
import LeadWizard from '../../components/LeadWizard';
import { INSURANCE_TYPES } from '../../types/models';
import { generalFaq, insuranceDescriptions } from '../../utils/insuranceContent';
import { insuranceTypeLabels } from '../../utils/labels';
import styles from './LandingPage.module.css';

const steps = [
  { title: 'בוחרים ביטוח', text: 'שלוש שאלות קצרות, פחות מדקה. בלי טפסים ארוכים.' },
  { title: 'משווים הצעות', text: 'סוכן אישי בונה השוואה בין חברות הביטוח המובילות.' },
  { title: 'חוסכים ונהנים', text: 'בוחרים את ההצעה המשתלמת, ואנחנו מטפלים בכל השאר.' },
];

const benefits = [
  { title: 'סוכן אישי, לא מוקד', text: 'אותו סוכן מלווה אתכם מההצעה הראשונה ועד התביעה.' },
  { title: 'תזכורת לפני חידוש', text: 'כחודש וחצי לפני סיום הפוליסה נחזור אליכם עם הצעות חדשות.' },
  { title: 'בלי עלות ובלי התחייבות', text: 'ההשוואה והליווי חינם. משלמים רק על הפוליסה שבחרתם.' },
  { title: 'שקיפות מלאה', text: 'כל הכיסויים, ההחרגות והמחירים מוצגים מראש, בשפה פשוטה.' },
];

const LandingPage: FC = () => {
  return (
    <div className={styles.page}>
      <LandingHeader />

      <section className={styles.hero} id="quote">
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.eyebrow}>השוואת ביטוחים עם ליווי אישי</span>
            <h1 className={styles.heroTitle}>
              הביטוח הנכון,
              <br />
              <span className={styles.gradientText}>במחיר שמגיע לכם.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              ממלאים פרטים פעם אחת, וסוכן אישי משווה בשבילכם בין חברות הביטוח, מלווה עד החתימה, ומזכיר
              לפני כל חידוש.
            </p>
            <ul className={styles.heroPoints}>
              <li>ללא עלות</li>
              <li>פחות מדקה</li>
              <li>סוכן אישי</li>
            </ul>
          </div>
          <div className={styles.heroForm}>
            <LeadWizard />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>כל הביטוחים במקום אחד</h2>
          <p className={styles.sectionSubtitle}>בחרו תחום כדי לקרוא עליו ולקבל הצעה מותאמת</p>
          <div className={styles.typeGrid}>
            {INSURANCE_TYPES.map((type) => (
              <Link key={type} to={`/insurance/${type}`} className={styles.typeCard}>
                <span className={styles.typeIcon}>
                  <InsuranceIcon type={type} />
                </span>
                <h3>{insuranceTypeLabels[type]}</h3>
                <p>{insuranceDescriptions[type]}</p>
                <span className={styles.typeLink}>לפרטים והצעה ←</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`} id="how">
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>איך זה עובד?</h2>
          <div className={styles.steps}>
            {steps.map((step, index) => (
              <div key={step.title} className={styles.step}>
                <span className={styles.stepNumber}>{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>למה InsureLeads?</h2>
          <div className={styles.benefits}>
            {benefits.map((benefit) => (
              <div key={benefit.title} className={styles.benefit}>
                <span className={styles.benefitDot} aria-hidden="true" />
                <div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`} id="faq">
        <div className={`${styles.sectionInner} ${styles.narrow}`}>
          <h2 className={styles.sectionTitle}>שאלות נפוצות</h2>
          <FaqList items={generalFaq} />
        </div>
      </section>

      <section className={styles.ctaBand}>
        <h2>מוכנים לחסוך בביטוח?</h2>
        <p>זה לוקח פחות מדקה, וזה בחינם.</p>
        <a href="#quote" className={styles.ctaButton}>
          לקבלת הצעה
        </a>
      </section>

      <LandingFooter />
    </div>
  );
};

export default LandingPage;
