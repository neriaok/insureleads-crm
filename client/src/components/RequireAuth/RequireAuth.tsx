import type { FC, ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import type { UserRole } from '../../types/models';
import styles from './RequireAuth.module.css';

interface RequireAuthProps {
  children: ReactNode;
  role?: UserRole;
}

// Route guard: sends guests to the login page and non-admins away from admin pages.
const RequireAuth: FC<RequireAuthProps> = ({ children, role }) => {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <p className={styles.loading}>טוען...</p>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export default RequireAuth;
