import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { Col, Row } from "reactstrap";
import Sidebar from "./Sidebar";
import { MdMenu } from "react-icons/md";
import "./Sidebar.css";
import { useTheme } from "../contexts/ThemeContext";
import nora_logo_white from "../assets/nora_white.png";
import nora_logo_dark from "../assets/nora_dark.png";
import useModal from "../hooks/useModal";
import { useAuth } from "../contexts/AuthContext";
import Modal from "../components/Modal";
import VerifyOtp from "../pages/auth/VerifyOtp";

export default function AppIndex() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isOpened, closeModal, openModal } = useModal();
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const { theme } = useTheme();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleCollapsed = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <div className="app-container">
      {!user?.emailVerified || !user?.phoneVerified ? <div className="danger verify-alert alert text-black">Your {user.emailVerified ? "phone number" : "email"} is not verified <span onClick={openModal} className="login_forgot_link">verify now</span></div> : null}
      <Modal onClose={closeModal} isOpen={isOpened}>
        <VerifyOtp showSignInButton={false} recipient={user.emailVerified ? user.phone : user.email} type={!user.emailVerified ? "email" : "phone"} />
      </Modal>
      {/* Mobile Header */}
      {isMobile && (
        <header style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }} className="mobile-header">
          <span className="mobile-logo-text">
            <img src={theme === "dark" ? nora_logo_white : nora_logo_dark} alt="nora_logo" className="sidebar_logo" />
          </span>
          <button className="mobile-toggle-btn" onClick={toggleMobile}>
            <MdMenu size={24} />
          </button>

        </header>
      )}

      <div className="d-flex overflow-hidden">
        {/* Sidebar Overlay for Mobile */}
        {isMobile && isMobileOpen && (
          <div className="sidebar-overlay" onClick={toggleMobile} />
        )}

        <aside
          className={`sidebar-wrapper ${isCollapsed ? "collapsed" : ""} ${isMobile ? "mobile" : ""} ${isMobileOpen ? "open" : ""}`}
        >
          <Sidebar
            isCollapsed={isCollapsed}
            toggleCollapsed={toggleCollapsed}
            onCloseMobile={() => setIsMobileOpen(false)}
          />
        </aside>

        <main className="main-content flex-grow-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
