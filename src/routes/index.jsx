// import { useRoutes, Navigate } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";

// // Layouts
// import AppIndex from "../layouts/AppIndex";
// import AuthLayout from "../layouts/AuthLayout";
// import AdminLayout from "../pages/admin/AdminLayout";

// // Auth Pages
// import Login from "../pages/auth/Login";
// import Register from "../pages/auth/Register";
// import VerifyOtp from "../pages/auth/VerifyOtp";
// import ForgotPassword from "../pages/auth/ForgotPassword";

// // App Pages
// import Dashboard from "../pages/app/Dashboard";
// import Profile from "../pages/app/Profile";
// import Settings from "../pages/app/Settings";
// import Wallet from "../pages/app/Finance/Wallet";

// // Other Pages
// import Landing from "../pages/website/Landing";
// import NotFound from "../pages/NotFound";
// import IcartHome from "../pages/icart/IcartHome";
// import PurchaseIcart from "../pages/icart/PurchaseIcart";
// import Invoices from "../pages/incoices/Invoices";
// import Business from "../pages/app/Business";
// import ConceptPage from "../pages/app/Business/ConceptPage";
// import OperatorHome from "../pages/app/Operator/OperatorHome";
// import OperatorCartPage from "../pages/app/Operator/OperatorCart";
// import SupplierHome from "../pages/app/Supplier/SupplierHome";
// import ShopPage from "../pages/website/ShopPage";
// import ShopCheckoutPage from "../pages/website/ShopCheckoutPage";
// import ShopOrderPage from "../pages/website/ShopOrderPage";

// // Shop Pages (public)
// // import ShopPage from "../pages/shop/ShopPage";
// // import ShopCheckoutPage from "../pages/shop/ShopCheckoutPage";

// // Protected Route - must be logged in
// function ProtectedRoute({ children }) {
//   const { user, loading } = useAuth();
//   if (loading) {
//     return (
//       <div className="page_wrapper">
//         <div className="page_loader">
//           <div className="page_loader_spinner" />
//         </div>
//       </div>
//     );
//   }
//   if (!user) return <Navigate to="/auth/login" replace />;
//   return children;
// }

// // Guest Route - redirect to app if already logged in
// function GuestRoute({ children }) {
//   const { user, loading } = useAuth();
//   if (loading) {
//     return (
//       <div className="page_wrapper">
//         <div className="page_loader">
//           <div className="page_loader_spinner" />
//         </div>
//       </div>
//     );
//   }
//   if (user) return <Navigate to="/app" replace />;
//   return children;
// }

// export default function Routes() {
//   const routes = useRoutes([
//     // Landing page (public)
//     { path: "/", element: <Landing /> },

//     // ── Shop (public, no auth required) ──────────────────────
//     { path: "/shop", element: <ShopPage /> },
//     { path: "/shop/order", element: <ShopOrderPage /> },
//     { path: "/shop/checkout", element: <ShopCheckoutPage /> },

//     // Guest only routes
//     {
//       path: "/auth",
//       element: (
//         <GuestRoute>
//           <AuthLayout />
//         </GuestRoute>
//       ),
//       children: [
//         { index: true, element: <Navigate to="/auth/login" replace /> },
//         { path: "login", element: <Login /> },
//         { path: "register", element: <Register /> },
//         { path: "verify-otp", element: <VerifyOtp /> },
//       ],
//     },

//     // Public auth routes
//     {
//       path: "/auth",
//       element: <AuthLayout />,
//       children: [{ path: "forgot-password", element: <ForgotPassword /> }],
//     },

//     // App routes (protected)
//     {
//       path: "/app",
//       element: (
//         <ProtectedRoute>
//           <AppIndex />
//         </ProtectedRoute>
//       ),
//       children: [
//         { index: true, element: <Dashboard /> },
//         { path: "dashboard", element: <Dashboard /> },
//         { path: "profile", element: <Profile /> },
//         { path: "settings", element: <Settings /> },
//         { path: "finance", element: <Wallet /> },
//         { path: "icart-home", element: <IcartHome /> },
//         { path: "purchase-icart", element: <PurchaseIcart /> },
//         { path: "invoices", element: <Invoices /> },
//         { path: "business", element: <Business /> },
//         { path: "supplier", element: <SupplierHome /> },
//         { path: "business/concept/:id", element: <ConceptPage /> },
//         { path: "operator", element: <OperatorHome /> },
//         { path: "operator/cart/:cartId", element: <OperatorCartPage /> },
//       ],
//     },

//     // Admin route (protected, own layout)
//     {
//       path: "/app/admin",
//       element: (
//         <ProtectedRoute>
//           <AdminLayout />
//         </ProtectedRoute>
//       ),
//     },

//     // 404
//     { path: "*", element: <NotFound /> },
//   ]);

//   return routes;
// }
import { useRoutes, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Layouts
import AppIndex from "../layouts/AppIndex";
import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../pages/admin/AdminLayout";
import LandingLayout from "../layouts/LandingLayout";

// Auth Pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import VerifyOtp from "../pages/auth/VerifyOtp";
import ForgotPassword from "../pages/auth/ForgotPassword";

// App Pages
import Dashboard from "../pages/app/Dashboard";
import Profile from "../pages/app/Profile";
import Settings from "../pages/app/Settings";
import Wallet from "../pages/app/Finance/Wallet";

// Other Pages
import Landing from "../pages/website/Landing";
import NotFound from "../pages/NotFound";
import IcartHome from "../pages/icart/IcartHome";
import PurchaseIcart from "../pages/icart/PurchaseIcart";
import Invoices from "../pages/incoices/Invoices";
import Business from "../pages/app/Business";
import ConceptPage from "../pages/app/Business/ConceptPage";
import OperatorHome from "../pages/app/Operator/OperatorHome";
import OperatorCartPage from "../pages/app/Operator/OperatorCart";
import SupplierHome from "../pages/app/Supplier/SupplierHome";
import ShopPage from "../pages/website/ShopPage";
import ShopCheckoutPage from "../pages/website/ShopCheckoutPage";
import ShopOrderPage from "../pages/website/ShopOrderPage";
import { getDefaultRoute } from "../utils/AuthHelpers";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="page_wrapper">
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      </div>
    );
  if (!user) return <Navigate to="/auth/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="page_wrapper">
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      </div>
    );
  if (user) return <Navigate to={getDefaultRoute(user)} replace />;
  return children;
}

function RoleRedirect() {
  const { user } = useAuth();
  return <Navigate to={getDefaultRoute(user)} replace />;
}

export default function Routes() {
  const routes = useRoutes([
    // ── Landing (with Header) ────────────────────────────────
    {
      element: <LandingLayout />,
      children: [{ path: "/", element: <Landing /> }],
    },

    // ── Shop (standalone — own header, no landing Header) ────
    { path: "/shop", element: <ShopPage /> },
    { path: "/shop/checkout", element: <ShopCheckoutPage /> },
    { path: "/shop/order", element: <ShopOrderPage /> },

    // Guest only routes
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

    // Public auth routes
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
        { index: true, element: <RoleRedirect /> },
        { path: "dashboard", element: <Dashboard /> },
        { path: "profile", element: <Profile /> },
        { path: "settings", element: <Settings /> },
        { path: "finance", element: <Wallet /> },
        { path: "icart-home", element: <IcartHome /> },
        { path: "purchase-icart", element: <PurchaseIcart /> },
        { path: "invoices", element: <Invoices /> },
        { path: "business", element: <Business /> },
        { path: "supplier", element: <SupplierHome /> },
        { path: "business/concept/:id", element: <ConceptPage /> },
        { path: "operator", element: <OperatorHome /> },
        { path: "operator/cart/:cartId", element: <OperatorCartPage /> },
      ],
    },

    // Admin route
    {
      path: "/app/admin",
      element: (
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      ),
    },

    // 404
    { path: "*", element: <NotFound /> },
  ]);

  return routes;
}
