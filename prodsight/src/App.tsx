import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/Auth/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { useAuth } from './hooks/useAuth';

// Import actual page components
import { Tasks } from './pages/Tasks/Tasks';
import { Budget } from './pages/Budget/Budget';
import { Script } from './pages/Script/Script';
import { Assets } from './pages/Assets/Assets';
import { VFX } from './pages/VFX/VFX';
import { Reports } from './pages/Reports/Reports';

// Placeholder for settings page
const Settings = () => <div className="p-6">Settings Page - Coming Soon</div>;

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="budget" element={<Budget />} />
        <Route path="script" element={<Script />} />
        <Route path="assets" element={<Assets />} />
        <Route path="vfx" element={<VFX />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
