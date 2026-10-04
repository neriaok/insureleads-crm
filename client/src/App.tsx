import { useEffect, type FC } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import DashboardPage from './pages/DashboardPage';
import LeadDetailPage from './pages/LeadDetailPage';
import InsuranceTypePage from './pages/InsuranceTypePage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import UsersPage from './pages/UsersPage';

// Opens every new page at the top, unless the link points to a section (#anchor).
const ScrollToTop: FC = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);
  return null;
};

const App: FC = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/insurance/:type" element={<InsuranceTypePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/leads/:id" element={<LeadDetailPage />} />
          <Route
            path="/users"
            element={
              <RequireAuth role="admin">
                <UsersPage />
              </RequireAuth>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
