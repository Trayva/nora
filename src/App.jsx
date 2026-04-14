import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Routes from "./routes";
import AuthProvider from "./contexts/AuthContext";
import NotificationBell from "./components/Notifications/NotificationBell";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="desktop-notification" style={{ position: "fixed", top: 20, right: 20, zIndex: 9999 }}>
          <NotificationBell />
        </div>
        <Routes />
        <ToastContainer position="top-right" autoClose={2000} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
