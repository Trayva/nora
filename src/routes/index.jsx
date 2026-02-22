import { useRoutes, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Layouts
import AppIndex from "../layouts/AppIndex";
import AuthLayout from "../layouts/AuthLayout";

// Auth Pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import VerifyOtp from "../pages/auth/VerifyOtp";
import ForgotPassword from "../pages/auth/ForgotPassword";

// App Pages
import Dashboard from "../pages/app/Dashboard";
import Profile from "../pages/app/Profile";
import Settings from "../pages/app/Settings";

// Other Pages
import Landing from "../pages/website/Landing";
import NotFound from "../pages/NotFound";

// Protected Route - must be logged in
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page_wrapper">
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      </div>
    );
  }


  if (!user) return <Navigate to="/auth/login" replace />;
  return children;
}

// Guest Route - redirect to app if already logged in
function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page_wrapper">
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      </div>
    );
  }


  if (user) return <Navigate to="/app" replace />;
  return children;
}

export default function Routes() {
  const routes = useRoutes([
    // Landing page (public)
    {
      path: "/",
      element: <Landing />,
    },

    // Guest only routes (login, register)
    {
      path: "/auth",
      element: (
        <GuestRoute>
          <AuthLayout />
        </GuestRoute>
      ),
      children: [
        { index: true, element: <Navigate to="/auth/login" replace /> },
        { path: "login", element: <Login /> },
        { path: "register", element: <Register /> },
        { path: "verify-otp", element: <VerifyOtp /> },
      ],
    },

    // Public auth routes (accessible logged in or not)
    {
      path: "/auth",
      element: <AuthLayout />,
      children: [{ path: "forgot-password", element: <ForgotPassword /> }],
    },

    // App routes (protected)
    {
      path: "/app",
      element: (
        <ProtectedRoute>
          <AppIndex />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Dashboard /> },
        { path: "dashboard", element: <Dashboard /> },
        { path: "profile", element: <Profile /> },
        { path: "settings", element: <Settings /> },
      ],
    },

    // 404
    {
      path: "*",
      element: <NotFound />,
    },
  ]);

  return routes;
}
