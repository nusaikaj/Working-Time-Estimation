import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import ProtectedRoute, { RoleRoute } from './routes/ProtectedRoute';
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import CreateTaskPage from './pages/CreateTaskPage';
import TaskDetailsPage from './pages/TaskDetailsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/tasks/:id" element={<TaskDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          <Route element={<RoleRoute allow={['PM']} />}>
            <Route path="/tasks/new" element={<CreateTaskPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
