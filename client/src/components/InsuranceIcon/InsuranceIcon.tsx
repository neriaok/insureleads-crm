import type { FC } from 'react';
import type { InsuranceType } from '../../types/models';
import styles from './InsuranceIcon.module.css';

interface InsuranceIconProps {
  type: InsuranceType;
}

// Simple line icons drawn inline, so they inherit the surrounding text color.
const paths: Record<InsuranceType, string[]> = {
  car: [
    'M5 17h14M3 13l2-5.5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5L21 13v4a1 1 0 0 1-1 1h-1',
    'M3 13v4a1 1 0 0 0 1 1h1M3 13h18',
    'M7.5 15.5h.01M16.5 15.5h.01',
  ],
  home: ['M3 11 12 4l9 7', 'M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9'],
  travel: ['M2 16l20-8-6 12-3-5-5-2z', 'M13 15l-3 3'],
  mortgage: ['M4 21V10l8-6 8 6v11', 'M9 21v-5a3 3 0 0 1 6 0v5', 'M12 10h.01'],
  health_life: [
    'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
    'M9.5 11h5M12 8.5v5',
  ],
};

const InsuranceIcon: FC<InsuranceIconProps> = ({ type }) => {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      {paths[type].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
};

export default InsuranceIcon;
