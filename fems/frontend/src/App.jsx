import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { setUnauthorizedHandler } from './api';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Extinguishers from './pages/Extinguishers';
import Notifications from './pages/Notifications';
import Escalations from './pages/Escalations';
import Users from './pages/Users';
import { useEffect } from 'react';

function AppLayout() {
  const { logout } = useAuth();

  useEffect(() => {
    setUnauthorizedHandler(() => logout());
  }, [logout]);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/extinguishers" element={<Extinguishers />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/escalations" element={<Escalations />} />
          <Route path="/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
