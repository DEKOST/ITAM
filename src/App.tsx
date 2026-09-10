import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Equipment from './pages/Equipment';
import EquipmentForm from './pages/EquipmentForm';
import EquipmentView from './pages/EquipmentView';
import EquipmentHistory from './pages/EquipmentHistory';
import ReplacementRecommendations from './pages/ReplacementRecommendations';
import Categories from './pages/Categories';
import Users from './pages/Users';
import UserView from './pages/UserView';
import Rooms from './pages/Rooms';
import Subdivisions from './pages/Subdivisions';
import MaintenanceTypes from './pages/MaintenanceTypes';
import QRGenerator from './pages/QRGenerator';
import QRScan from './pages/QRScan';
import Certificates from './pages/Certificates';
import AuthUsers from './pages/AuthUsers';
import Backups from './pages/Backups';
import EquipmentTemplates from './pages/EquipmentTemplates';
import Settings from './pages/Settings';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🚫</p>
          <p className="text-gray-600">Доступ запрещён</p>
          <p className="text-sm text-gray-500 mt-1">Требуются права администратора</p>
        </div>
      </Layout>
    );
  }

  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/equipment" element={<ProtectedRoute><Equipment /></ProtectedRoute>} />
      <Route path="/equipment/new" element={<ProtectedRoute><EquipmentForm /></ProtectedRoute>} />
      <Route path="/equipment/:id" element={<ProtectedRoute><EquipmentView /></ProtectedRoute>} />
      <Route path="/equipment/:id/edit" element={<ProtectedRoute><EquipmentForm /></ProtectedRoute>} />
      <Route path="/equipment/:id/history" element={<ProtectedRoute><EquipmentHistory /></ProtectedRoute>} />
      <Route path="/replacement-recommendations" element={<ProtectedRoute><ReplacementRecommendations /></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/users/:id" element={<ProtectedRoute><UserView /></ProtectedRoute>} />
      <Route path="/rooms" element={<ProtectedRoute><Rooms /></ProtectedRoute>} />
      <Route path="/subdivisions" element={<ProtectedRoute><Subdivisions /></ProtectedRoute>} />
      <Route path="/maintenance-types" element={<ProtectedRoute><MaintenanceTypes /></ProtectedRoute>} />
      <Route path="/qr-generator" element={<ProtectedRoute><QRGenerator /></ProtectedRoute>} />
      <Route path="/qr-scan" element={<ProtectedRoute><QRScan /></ProtectedRoute>} />
      <Route path="/certificates" element={<ProtectedRoute adminOnly><Certificates /></ProtectedRoute>} />
      <Route path="/auth-users" element={<ProtectedRoute adminOnly><AuthUsers /></ProtectedRoute>} />
      <Route path="/backups" element={<ProtectedRoute adminOnly><Backups /></ProtectedRoute>} />
      <Route path="/equipment-templates" element={<ProtectedRoute><EquipmentTemplates /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  
  return (
    <DataProvider isAuthenticated={isAuthenticated}>
      <AppRoutes />
    </DataProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </HashRouter>
    </ThemeProvider>
  );
}
