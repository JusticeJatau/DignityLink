import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { RegisterBeneficiaryPage } from './pages/RegisterBeneficiaryPage';
import { BeneficiariesPage } from './pages/BeneficiariesPage';
import { MessageLibraryPage } from './pages/MessageLibraryPage';
import { PhoneSimulatorPage } from './pages/PhoneSimulatorPage';
import { LogsPage } from './pages/LogsPage';
import { RoadmapPage } from './pages/RoadmapPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="register" element={<RegisterBeneficiaryPage />} />
            <Route path="beneficiaries" element={<BeneficiariesPage />} />
            <Route path="library" element={<MessageLibraryPage />} />
            <Route path="simulator" element={<PhoneSimulatorPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
