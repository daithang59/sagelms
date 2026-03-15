import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import { ToastProvider } from '@/components/Toast';
import { Navigate, Route, Routes } from 'react-router-dom';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// App pages
import AiTutorPage from '@/pages/ai-tutor/AiTutorPage';
import QuizzesPage from '@/pages/assessment/QuizzesPage';
import CoursesPage from '@/pages/courses/CoursesPage';
import CourseDetailPage from '@/pages/courses/CourseDetailPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
        {/* Public routes — Auth layout */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes — Dashboard layout */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:id" element={<CourseDetailPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/ai-tutor" element={<AiTutorPage />} />
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
