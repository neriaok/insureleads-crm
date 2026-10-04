import type { FC } from 'react';
import type { LeadStatus } from '../../types/models';
import { statusLabels } from '../../utils/labels';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: LeadStatus;
}

const StatusBadge: FC<StatusBadgeProps> = ({ status }) => {
  return <span className={`${styles.badge} ${styles[status]}`}>{statusLabels[status]}</span>;
};

export default StatusBadge;
