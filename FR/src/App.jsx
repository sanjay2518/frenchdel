import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserDataProvider } from './context/UserDataContext';

// Layouts
import AppLayout from './layouts/AppLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Practice from './pages/Practice';
import PronunciationPractice from './pages/PronunciationPractice';
import FreeSpeakingPractice from './pages/FreeSpeakingPractice';
import WritingPractice from './pages/WritingPractice';
import PracticePrompts from './pages/PracticePrompts';
import PromptDetail from './pages/PromptDetail';
import MySubmissions from './pages/MySubmissions';
import Lessons from './pages/Lessons';
import Progress from './pages/Progress';
import Resources from './pages/Resources';

// Styles
import './styles/index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages with Standard Layout */}
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="contact" element={<Contact />} />
      </Route>

      {/* Auth Pages - Fullscreen Layout */}
      <Route path="/" element={<AppLayout hideFooter variant="fullscreen" />}>
        <Route path="login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="forgot-password" element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } />
      </Route>

      {/* Dashboard Pages with Sidebar Layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <DashboardLayout sidebarType="user" />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="dashboard/submissions" element={<MySubmissions />} />
        <Route path="profile" element={<Profile />} />
        <Route path="lessons" element={<Lessons />} />
        <Route path="progress" element={<Progress />} />
        <Route path="resources" element={<Resources />} />
        <Route path="practice-prompts" element={<PracticePrompts />} />
        <Route path="practice-prompts/:promptId" element={<PromptDetail />} />
      </Route>

      {/* Practice Pages with Standard Layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route path="practice" element={<Practice />} />
      </Route>

      {/* Practice Sessions - Fullscreen Layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout hideFooter variant="fullscreen" />
        </ProtectedRoute>
      }>
        <Route path="practice/speaking" element={<FreeSpeakingPractice />} />
        <Route path="practice/pronunciation" element={<PronunciationPractice />} />
        <Route path="practice/writing" element={<WritingPractice />} />
      </Route>

      {/* Future Admin Routes - Ready for expansion */}
      {/* 
      <Route path="/admin" element={
        <ProtectedRoute>
          <DashboardLayout sidebarType="admin" />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
      */}

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <UserDataProvider>
        <Router>
          <AppRoutes />
        </Router>
      </UserDataProvider>
    </AuthProvider>
  );
}

export default App;
