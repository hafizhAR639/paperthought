import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Outlet } from 'react-router-dom';

export default function PrivateRoute() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
