import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  MdOutlineKitchen,
  MdOutlineBarChart,
  MdOutlinePerson,
  MdOutlineStorefront,
  MdOutlineSettings,
  MdClose,
  MdArrowForward,
  MdArrowBack,
  MdCheckCircle,
  MdOutlineLightbulb,
} from "react-icons/md";
import "../Landing.css";

/* ── Tour steps definition ─────────────────────────────────── */
const BASE_STEPS = [
  {
    id: "welcome",
    targetId: null, // centred modal, no highlight
    title: "Welcome to NORA 👋",
    content:
      "This quick tour will guide you through the key features of your dashboard. It only takes about a minute!",
    icon: MdOutlineLightbulb,
    position: "center",
  },
  {
    id: "kiosk-nav",
    targetId: "mobile-tab-kiosk",
    desktopTargetId: "sidebar-nav-kiosk-home",
    title: "Your Kiosks",
    content:
      "Browse and manage your iCart kiosks here. You can view online status, assign operators, and track performance.",
    icon: MdOutlineKitchen,
    position: "top",
  },
  {
    id: "finance-nav",
    targetId: "mobile-tab-finance",
    desktopTargetId: "sidebar-nav-finance",
    title: "Finance & Wallet",
    content:
      "Track your earnings, view transaction history, and manage payouts — all from one place.",
    icon: MdOutlineBarChart,
    position: "top",
  },
  {
    id: "theme-toggle",
    targetId: "mobile-theme-toggle",
    desktopTargetId: "header-theme-toggle",
    title: "Dark / Light Mode",
    content:
      "Toggle between dark and light mode at any time using this button.",
    icon: MdOutlineLightbulb,
    position: "bottom",
  },
  {
    id: "profile-nav",
    targetId: "mobile-tab-profile",
    desktopTargetId: "sidebar-nav-profile",
    title: "Your Profile",
    content:
      "Update your personal details, manage security settings, and control your account preferences.",
    icon: MdOutlinePerson,
    position: "top",
  },
  {
    id: "done",
    targetId: null,
    title: "You're all set! 🎉",
    content:
      "That's a quick overview of NORA. If you ever need help, tap the AI assistant button (bottom-right) anytime.",
    icon: MdCheckCircle,
    position: "center",
  },
];

const VENDOR_STEPS = [
  {
    id: "business-nav",
    targetId: "mobile-tab-business",
    desktopTargetId: "sidebar-nav-business",
    title: "My Business",
    content:
      "Create and manage your food concepts, menus, pricing, and branding — your complete business hub.",
    icon: MdOutlineStorefront,
    position: "top",
    insertAfter: "finance-nav",
  },
];

const OPERATOR_STEPS = [
  {
    id: "operator-nav",
    targetId: "mobile-tab-operator",
    desktopTargetId: "sidebar-nav-operator",
    title: "Operator Dashboard",
    content:
      "Manage your kiosk assignments, review job offers from kiosk owners, and track your active contracts.",
    icon: MdOutlineKitchen,
    position: "top",
    insertAfter: "finance-nav",
  },
];

function buildSteps(role) {
  let steps = [...BASE_STEPS];
  const roleExtras =
    role === "VENDOR"
      ? VENDOR_STEPS
      : role === "OPERATOR"
      ? OPERATOR_STEPS
      : [];

  roleExtras.forEach((extra) => {
    const idx = steps.findIndex((s) => s.id === extra.insertAfter);
    if (idx !== -1) {
      steps.splice(idx + 1, 0, extra);
    } else {
      steps.splice(steps.length - 1, 0, extra);
    }
  });

  return steps;
}

/* ── Tooltip positioning ───────────────────────────────────── */
function getTooltipStyle(targetEl, position) {
  // On mobile, CSS handles positioning via media query (bottom sheet)
  if (window.innerWidth <= 600) return {};

  if (!targetEl) return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };

  const rect = targetEl.getBoundingClientRect();
  const tooltipW = Math.min(320, window.innerWidth - 24);
  const tooltipH = 210; // conservative estimate
  const gap = 14;
  const vpW = window.innerWidth;
  const vpH = window.innerHeight;

  let style = { width: tooltipW };

  if (position === "top") {
    let top = rect.top - tooltipH - gap;
    let left = rect.left + rect.width / 2 - tooltipW / 2;
    if (top < 8) top = rect.bottom + gap;
    if (top + tooltipH > vpH - 8) top = vpH / 2 - tooltipH / 2;
    left = Math.max(8, Math.min(left, vpW - tooltipW - 8));
    style = { ...style, top, left };
  } else if (position === "bottom") {
    let top = rect.bottom + gap;
    let left = rect.left + rect.width / 2 - tooltipW / 2;
    if (top + tooltipH > vpH - 8) top = rect.top - tooltipH - gap;
    if (top < 8) top = vpH / 2 - tooltipH / 2;
    left = Math.max(8, Math.min(left, vpW - tooltipW - 8));
    style = { ...style, top, left };
  } else if (position === "left") {
    let left = rect.left - tooltipW - gap;
    let top = rect.top + rect.height / 2 - tooltipH / 2;
    if (left < 8) left = rect.right + gap;
    if (left + tooltipW > vpW - 8) left = vpW / 2 - tooltipW / 2;
    top = Math.max(8, Math.min(top, vpH - tooltipH - 8));
    style = { ...style, top, left };
  } else if (position === "right") {
    let left = rect.right + gap;
    let top = rect.top + rect.height / 2 - tooltipH / 2;
    if (left + tooltipW > vpW - 8) left = rect.left - tooltipW - gap;
    if (left < 8) left = vpW / 2 - tooltipW / 2;
    top = Math.max(8, Math.min(top, vpH - tooltipH - 8));
    style = { ...style, top, left };
  } else {
    // center
    style = { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  }

  return style;
}

/* ── Main component ────────────────────────────────────────── */
const TOUR_KEY = "nora-tour-done-v1";

export default function WalkInTutorial({ userRole, show, onClose }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [highlightedEl, setHighlightedEl] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const rafRef = useRef(null);

  const steps = buildSteps(userRole);
  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;
  const isFirst = stepIdx === 0;

  /* ── resolve target element ──────────────────────────────── */
  const resolveTarget = useCallback((s) => {
    const isMobile = window.innerWidth < 900;
    const id = isMobile ? s.targetId : (s.desktopTargetId || s.targetId);
    return id ? document.getElementById(id) : null;
  }, []);

  /* ── position tooltip & highlight target ─────────────────── */
  useEffect(() => {
    if (!show) return;
    const target = resolveTarget(step);
    setHighlightedEl(target);
    const style = getTooltipStyle(target, step.position);
    setTooltipStyle(style);
    setAnimKey((k) => k + 1);

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [stepIdx, show, step, resolveTarget]);

  /* ── add/remove highlight class ──────────────────────────── */
  useEffect(() => {
    if (highlightedEl) {
      highlightedEl.classList.add("tour-highlight-active");
      return () => highlightedEl.classList.remove("tour-highlight-active");
    }
  }, [highlightedEl]);

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      setStepIdx((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) setStepIdx((i) => i - 1);
  };

  const handleClose = () => {
    localStorage.setItem(TOUR_KEY, "1");
    onClose();
  };

  if (!show) return null;

  const Icon = step.icon;
  const isCenter = step.position === "center" || !step.targetId;

  return createPortal(
    <>
      {/* Dim backdrop */}
      <div
        className="tour-overlay-backdrop"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Tooltip bubble */}
      <div
        key={animKey}
        className="tour-tooltip-bubble"
        style={tooltipStyle}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
      >
        {/* Close button */}
        <button
          className="tour-btn-skip"
          style={{ position: "absolute", top: 10, right: 10, padding: "4px" }}
          onClick={handleClose}
          aria-label="Close tour"
        >
          <MdClose size={16} />
        </button>

        {/* Step icon */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(203,108,220,0.15), rgba(99,102,241,0.15))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
        >
          <Icon size={18} style={{ color: "var(--accent)" }} />
        </div>

        <p className="tour-title">{step.title}</p>
        <p className="tour-content">{step.content}</p>

        <div className="tour-footer">
          <span className="tour-progress">
            {stepIdx + 1} / {steps.length}
          </span>
          <div className="tour-btn-row">
            {!isFirst && (
              <button className="tour-btn-secondary" onClick={handleBack}>
                <MdArrowBack size={13} style={{ marginRight: 4 }} />
                Back
              </button>
            )}
            <button className="tour-btn-primary" onClick={handleNext}>
              {isLast ? (
                <>
                  <MdCheckCircle size={13} style={{ marginRight: 4 }} /> Finish
                </>
              ) : (
                <>
                  Next <MdArrowForward size={13} style={{ marginLeft: 4 }} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 5,
            marginTop: 14,
          }}
        >
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStepIdx(i)}
              aria-label={`Step ${i + 1}`}
              style={{
                width: i === stepIdx ? 18 : 6,
                height: 6,
                borderRadius: 3,
                border: "none",
                padding: 0,
                background:
                  i === stepIdx
                    ? "var(--accent)"
                    : "var(--border)",
                cursor: "pointer",
                transition: "width 0.25s ease, background 0.2s",
              }}
            />
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── Helper: should we auto-show the tour? ─────────────────── */
export function shouldShowTour() {
  return !localStorage.getItem(TOUR_KEY);
}

/* ── Helper: force-reset the tour (for "replay" button) ────── */
export function resetTour() {
  localStorage.removeItem(TOUR_KEY);
}
