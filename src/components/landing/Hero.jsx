import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  MdArrowForward,
  MdOutlineStore,
  MdOutlineTrendingUp,
  MdOutlineVerified,
  MdOutlineStorefront,
  MdOutlineCheckCircle,
} from "react-icons/md";

const ROTATING_WORDS = ["Franchise.", "Growth.", "Revenue.", "Impact."];

function Hero() {
  const navigate = useNavigate();
  const [wordIdx, setWordIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIdx((prev) => (prev + 1) % ROTATING_WORDS.length);
        setFade(true);
      }, 300);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-section">
      {/* Grid background */}
      <div className="hero-grid-bg" />

      {/* Ambient orbs */}
      <div className="hero-orb hero-orb-1" />
      <div className="hero-orb hero-orb-2" />
      <div className="hero-orb hero-orb-3" />

      {/* Center glow */}
      <div className="hero-center-glow" />

      {/* ── Floating notification cards ── */}
      <div className="hero-float-card hero-float-left">
        <div className="hero-float-dot" />
        <div className="hero-float-body">
          <p className="hero-float-title">New Brand Joined</p>
          <p className="hero-float-sub">Mama Cass Kitchen · Lagos</p>
        </div>
        <MdOutlineStorefront size={20} className="hero-float-icon-end" />
      </div>

      <div className="hero-float-card hero-float-right">
        <div className="hero-float-icon-box">
          <MdOutlineCheckCircle size={18} className="hero-float-icon-green" />
        </div>
        <div className="hero-float-body">
          <p className="hero-float-title">Outlet Deployed</p>
          <p className="hero-float-sub">₦2.4M revenue · Month 1</p>
          <span className="hero-float-badge">Live</span>
        </div>
      </div>

      <div className="hero-float-card hero-float-bottom-c">
        <MdOutlineTrendingUp size={18} className="hero-float-icon-indigo" />
        <div className="hero-float-body">
          <p className="hero-float-title">Cost Optimised</p>
          <p className="hero-float-sub">AI reduced food cost by 18%</p>
        </div>
      </div>

      {/* ── Main centered content ── */}
      <div className="hero-centered">
        <div className="hero-badge">
          <MdOutlineVerified size={14} />
          <span>AI-Powered Food Franchise Platform</span>
        </div>

        <h1 className="hero-heading-centered">
          Scale Food Brands.
          <br />
          Empower New{" "}
          <span
            className={`hero-rotating-word ${fade ? "hero-word-in" : "hero-word-out"}`}
          >
            {ROTATING_WORDS[wordIdx]}
          </span>
        </h1>

        <div className="hero-gradient-rule" />

        <p className="hero-sub-centered">
          Nora AI is the platform where food brands expand through structured
          franchising — enabling individuals to own and operate QSR outlets
          using standardized infrastructure and digital control.
        </p>

        <div className="hero-ctas hero-ctas-centered">
          <button
            id="hero-cta-brand"
            className="hero-btn-primary"
            onClick={() => navigate("/auth/register?role=VENDOR")}
          >
            Partner as a Brand
            <MdArrowForward size={18} />
          </button>
          <button
            id="hero-cta-owner"
            className="hero-btn-secondary"
            onClick={() => navigate("/auth/register?role=CUSTOMER")}
          >
            <MdOutlineStore size={18} />
            Own a Franchise
          </button>
        </div>

        <div className="hero-stats hero-stats-centered">
          <div className="hero-stat-pill">
            <span className="hero-stat-value">50+</span>
            <span className="hero-stat-label">Food Brands</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-pill">
            <span className="hero-stat-value">200+</span>
            <span className="hero-stat-label">Active Outlets</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat-pill">
            <MdOutlineTrendingUp size={16} style={{ color: "var(--accent)" }} />
            <span className="hero-stat-label">Real-time Costing</span>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="hero-scroll-cue">
        <div className="hero-scroll-dot" />
      </div>
    </div>
  );
}

export default Hero;
