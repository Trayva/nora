import { Outlet } from "react-router-dom";
import nora_logo_white from "../assets/nora_white.png";
import { MdOutlineRestaurantMenu, MdTrendingUp, MdShoppingCart } from "react-icons/md";
import "./AuthLayout.css";
import "../components/Modal.css";

export default function AuthLayout() {
  return (
    <div className="auth-root">
      {/* ── Left branded panel ───────────────────────────────────── */}
      <div className="auth-left">
        {/* Ambient orbs */}
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
        {/* Subtle grid */}
        <div className="auth-left-grid" />

        {/* Logo */}
        <div className="auth-left-logo">
          <img src={nora_logo_white} alt="Nora" />
        </div>

        {/* Hero copy */}
        <div className="auth-left-body">
          <p className="auth-left-eyebrow">The Control Center</p>
          <h1 className="auth-left-heading">
            Run the whole business<br />
            from <span>one screen.</span>
          </h1>
          <p className="auth-left-sub">
            Sales, stock, expenses, customers, and teams — all in one clean workspace.
          </p>
          <div className="auth-left-stats">
            <div className="auth-stat-pill">
              <span className="auth-stat-dot" />
              <span className="auth-stat-label">Live Operations</span>
            </div>
            <div className="auth-stat-pill">
              <span className="auth-stat-label">2,400+ Kiosks</span>
            </div>
          </div>
        </div>

        {/* Floating cards */}
        {/* <div className="auth-float-card auth-float-a">
          <div className="auth-float-icon auth-float-icon--green">
            <MdTrendingUp />
          </div>
          <div className="auth-float-body">
            <p className="auth-float-title">Revenue Today</p>
            <p className="auth-float-sub">+18.4% vs yesterday</p>
          </div>
        </div>

        <div className="auth-float-card auth-float-b">
          <div className="auth-float-icon auth-float-icon--purple">
            <MdOutlineRestaurantMenu />
          </div>
          <div className="auth-float-body">
            <p className="auth-float-title">Menu Updated</p>
            <p className="auth-float-sub">12 items synced</p>
          </div>
        </div>

        <div className="auth-float-card auth-float-c">
          <div className="auth-float-icon auth-float-icon--orange">
            <MdShoppingCart />
          </div>
          <div className="auth-float-body">
            <p className="auth-float-title">New Order</p>
            <p className="auth-float-sub">Table 7 · AED 124</p>
          </div>
        </div> */}

        {/* Left footer */}
        <div className="auth-left-footer">
          © {new Date().getFullYear()} Nora · All systems normal
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────── */}
      <div className="auth-right">
        <div className="auth-form-shell">
          <Outlet />
        </div>
        <p className="auth-right-footer">
          © {new Date().getFullYear()} Nora. All rights reserved.
        </p>
      </div>
    </div>
  );
}