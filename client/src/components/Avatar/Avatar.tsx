import type { FC } from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

const COLORS = ['#4f46e5', '#0891b2', '#10b981', '#d97706', '#db2777', '#7c3aed', '#2563eb'];

// The same name always gets the same color.
function colorFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length] ?? COLORS[0] ?? '#4f46e5';
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('');
}

const Avatar: FC<AvatarProps> = ({ name, size = 'md' }) => {
  return (
    // The background color depends on the name, so it is a runtime value.
    <span className={`${styles.avatar} ${styles[size]}`} style={{ background: colorFor(name) }} aria-hidden="true">
      {initialsOf(name)}
    </span>
  );
};

export default Avatar;
