import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import ExamRoom from './pages/public/ExamRoom';
import AdminLogin from './pages/admin/Login';
import AdminSignup from './pages/admin/Signup';
import Dashboard from './pages/admin/Dashboard';
import ExamEditor from './pages/admin/ExamEditor';
import MarksPage from './pages/admin/MarksPage';
import UsersPage from './pages/admin/UsersPage';
import AdminGuard from './components/admin/AdminGuard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ───────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/exam/:examId" element={<ExamRoom />} />

        {/* ── Admin ────────────────────────────────── */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />

        <Route path="/admin" element={<AdminGuard />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="exam/new" element={<ExamEditor />} />
          <Route path="exam/edit/:examId" element={<ExamEditor />} />
          <Route path="marks" element={<MarksPage />} />
          <Route path="marks/:examId" element={<MarksPage />} />
          <Route path="users" element={<UsersPage />} />
        </Route>

        {/* ── Fallback ─────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
