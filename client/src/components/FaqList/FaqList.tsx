import type { FC } from 'react';
import styles from './FaqList.module.css';

export interface FaqItem {
  question: string;
  answer: string;
}

interface FaqListProps {
  items: FaqItem[];
}

// Native <details> elements: accessible accordion without extra JavaScript.
const FaqList: FC<FaqListProps> = ({ items }) => {
  return (
    <div className={styles.list}>
      {items.map((item) => (
        <details key={item.question} className={styles.item}>
          <summary className={styles.question}>{item.question}</summary>
          <p className={styles.answer}>{item.answer}</p>
        </details>
      ))}
    </div>
  );
};

export default FaqList;
