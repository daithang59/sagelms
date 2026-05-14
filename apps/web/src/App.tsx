import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import { ToastProvider } from '@/components/Toast';
import { ConfirmDialogProvider } from '@/components/ui';
import { Navigate, Route, Routes } from 'react-router-dom';

// Auth pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// App pages
import AiTutorPage from '@/pages/ai-tutor/AiTutorPage';
import ChallengesPage from '@/pages/challenges/ChallengePage';
import ChallengeDetailPage from '@/pages/challenges/ChallengeDetailPage';
import QuestionDetailPage from '@/pages/challenges/QuestionDetailPage';
import QuestionTakingPage from '@/pages/challenges/QuestionTakingPage';
import QuestionResultPage from '@/pages/challenges/QuestionResultPage';
import QuestionReviewPage from '@/pages/challenges/QuestionReviewPage';
import InstructorApplicationsPage from '@/pages/admin/InstructorApplicationsPage';
import CoursesPage from '@/pages/courses/CoursesPage';
import CourseDetailPage from '@/pages/courses/CourseDetailPage';
import LessonDetailPage from '@/pages/courses/LessonDetailPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';

function App() {
  return (
    <ToastProvider>
      <ConfirmDialogProvider>
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
          <Route path="/courses/:courseId/lessons/:id" element={<LessonDetailPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/challenges/:id" element={<ChallengeDetailPage />} />
          <Route
            path="/challenges/:id/questions"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR']}>
                <QuestionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenges/:id/questions/:questionId"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR']}>
                <QuestionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenges/:id/question-sets/new"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR']}>
                <QuestionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenges/:id/question-sets/:questionSetId"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR']}>
                <QuestionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/challenges/:id/question-sets/:questionSetId/questions/:questionId"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR']}>
                <QuestionDetailPage />
              </ProtectedRoute>
            }
          />
          <Route path="/challenges/:id/take" element={<QuestionTakingPage />} />
          <Route path="/challenges/:id/result/:attemptId" element={<QuestionResultPage />} />
          <Route
            path="/challenges/:id/submissions/:attemptId/review"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'INSTRUCTOR']}>
                <QuestionReviewPage />
              </ProtectedRoute>
            }
          />
          <Route path="/quizzes" element={<Navigate to="/challenges" replace />} />
          <Route path="/ai-tutor" element={<AiTutorPage />} />
          <Route
            path="/admin/instructors"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <InstructorApplicationsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
        </AuthProvider>
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}

export default App;
