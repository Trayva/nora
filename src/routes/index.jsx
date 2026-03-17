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

// // Admin Pages
// import AdminSalesFormula from "../pages/admin/AdminSalesFormula";
// import AdminConceptRental from "../pages/admin/AdminConceptRental";
// import AdminContractSettings from "../pages/admin/AdminContractSettings";
// import AdminApplications from "../pages/admin/AdminApplications";

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
//     {
//       path: "/",
//       element: <Landing />,
//     },

//     // Guest only routes (login, register)
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

//     // Public auth routes (accessible logged in or not)
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

//     // Admin routes (protected, own layout — no app sidebar)
//     {
//       path: "/app/admin",
//       element: (
//         <ProtectedRoute>
//           <AdminLayout />
//         </ProtectedRoute>
//       ),
//       children: [
//         {
//           index: true,
//           element: <Navigate to="/app/admin/sales-formula" replace />,
//         },
//         { path: "sales-formula", element: <AdminSalesFormula /> },
//         { path: "concept-rental", element: <AdminConceptRental /> },
//         { path: "contract-settings", element: <AdminContractSettings /> },
//         { path: "applications", element: <AdminApplications /> },
//       ],
//     },

//     // 404
//     {
//       path: "*",
//       element: <NotFound />,
//     },
//   ]);

//   return routes;
// }


import { useRoutes, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Layouts
import AppIndex from "../layouts/AppIndex";
import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../pages/admin/AdminLayout";

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


// Admin Pages

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

    // Admin route (protected, own layout — full dashboard, no sub-routes)
    {
      path: "/app/admin",
      element: (
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      ),
    },

    // 404
    {
      path: "*",
      element: <NotFound />,
    },
  ]);

  return routes;
}