import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import { Loader2 } from 'lucide-react';

// ============================================================
// Protected Route — faqat login qilgan foydalanuvchilar uchun
// ============================================================
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-numeo-bg flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-numeo-blue animate-spin mx-auto mb-4" />
          <p className="text-numeo-textMuted text-sm font-roboto italic">
            Yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// ============================================================
// Public Route — allaqachon login qilgan foydalanuvchilarni
// Dashboard ga yo'naltiradi
// ============================================================
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-numeo-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-numeo-blue animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// ============================================================
// App — Asosiy Router
// ============================================================
function App() {
  return (
    <Routes>
      {/* Login / Register sahifasi */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />

      {/* Dashboard — faqat himoyalangan */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Noma'lum route'lar — asosiy sahifaga */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

