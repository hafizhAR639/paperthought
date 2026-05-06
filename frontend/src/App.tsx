import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Lazy load pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import AnalysisPage from './pages/AnalysisPage';
import RevisionPage from './pages/RevisionPage';
import ReferencesPage from './pages/ReferencesPage';
import SettingsPage from './pages/SettingsPage';
import HomePage from './pages/HomePage';

function App() {
  const { isAuthenticated, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Router>
      <div className="min-h-screen bg-neutral-50">
        {isAuthenticated && <Navbar />}
        <Routes>
          {/* Public routes */}
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <HomePage />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />

          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/papers/:paperId/analysis" element={<AnalysisPage />} />
            <Route path="/papers/:paperId/revise" element={<RevisionPage />} />
            <Route path="/references" element={<ReferencesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
