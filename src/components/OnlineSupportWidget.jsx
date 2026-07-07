import { useState, useEffect, useRef } from "react";
import {
  MdHeadsetMic,
  MdClose,
  MdAdd,
  MdChevronRight,
  MdCheckCircle,
  MdCircle,
  MdOutlineHelpOutline,
  MdArrowForward,
  MdSupportAgent,
} from "react-icons/md";
import { LuSparkles } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getMyTickets, createTicket } from "../api/ticketApi";
import { toast } from "react-toastify";
import "./OnlineSupportWidget.css";

const STATUS_COLORS = {
  OPEN: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6" },
  IN_PROGRESS: { bg: "rgba(234,179,8,0.1)", color: "#ca8a04" },
  WAITING_ON_USER: { bg: "rgba(203,108,220,0.1)", color: "var(--accent)" },
  RESOLVED: { bg: "rgba(34,197,94,0.1)", color: "#16a34a" },
  CLOSED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280" },
};

const QUICK_TOPICS = [
  { label: "Kitchen setup help", category: "GENERAL" },
  { label: "Billing & payments", category: "BILLING" },
  { label: "Technical issue", category: "TECHNICAL" },
  { label: "Account problem", category: "ACCOUNT" },
];

export default function OnlineSupportWidget() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("home"); // home | new | tickets
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [form, setForm] = useState({ subject: "", category: "GENERAL", priority: "MEDIUM", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const panelRef = useRef(null);

  // Stop pulse after 10s
  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 10000);
    return () => clearTimeout(t);
  }, []);

  // Load recent tickets when opening
  useEffect(() => {
    if (isOpen && user) {
      setTicketsLoading(true);
      getMyTickets()
        .then((data) => setTickets((data || []).slice(0, 3)))
        .catch(() => {})
        .finally(() => setTicketsLoading(false));
    }
  }, [isOpen, user]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen((v) => !v);
    setView("home");
    setPulse(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject || !form.description) {
      toast.error("Please fill in subject and description");
      return;
    }
    setSubmitting(true);
    try {
      await createTicket(form);
      toast.success("Support ticket submitted! We'll get back to you shortly.");
      setView("home");
      setForm({ subject: "", category: "GENERAL", priority: "MEDIUM", description: "" });
      const data = await getMyTickets();
      setTickets((data || []).slice(0, 3));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const openNewWithTopic = (topic) => {
    setForm((f) => ({ ...f, subject: topic.label, category: topic.category }));
    setView("new");
  };

  const openTicketsPage = () => {
    setIsOpen(false);
    navigate("/app/support");
  };

  if (!user) return null;

  const openTickets = tickets.filter((t) => t.status !== "CLOSED" && t.status !== "RESOLVED");
  const hasUnread = openTickets.length > 0;

  return (
    <div className="support-widget-root" ref={panelRef}>
      {/* FAB */}
      <button
        className={`support-widget-fab${pulse ? " support-widget-fab--pulse" : ""}${isOpen ? " support-widget-fab--open" : ""}`}
        onClick={handleOpen}
        aria-label="Online Support"
        title="Get Help"
      >
        {isOpen ? <MdClose size={20} /> : <MdHeadsetMic size={22} />}
        {!isOpen && hasUnread && (
          <span className="support-widget-fab-badge">{openTickets.length}</span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div className={`support-widget-panel${theme === "dark" ? " support-widget-panel--dark" : ""}`}>
          {/* Header */}
          <div className="support-widget-header">
            <div className="support-widget-header-left">
              <div className="support-widget-avatar">
                <MdSupportAgent size={18} />
              </div>
              <div>
                <div className="support-widget-header-title">Support Team</div>
                <div className="support-widget-header-status">
                  <MdCircle size={7} style={{ color: "#22c55e" }} />
                  Online · Replies in minutes
                </div>
              </div>
            </div>
            <button className="support-widget-close" onClick={() => setIsOpen(false)}>
              <MdClose size={16} />
            </button>
          </div>

          {/* Body */}
          <div className="support-widget-body">
            {view === "home" && (
              <>
                <div className="support-widget-hero">
                  <div className="support-widget-hero-icon"><LuSparkles size={20} /></div>
                  <div>
                    <div className="support-widget-hero-title">
                      Hi {user?.fullName?.split(" ")[0] || "there"},
                    </div>
                    <div className="support-widget-hero-sub">How can we help you today?</div>
                  </div>
                </div>

                <div className="support-widget-section-title">Quick Help</div>
                <div className="support-widget-topics">
                  {QUICK_TOPICS.map((t) => (
                    <button key={t.label} className="support-widget-topic-btn" onClick={() => openNewWithTopic(t)}>
                      <span>{t.label}</span>
                      <MdChevronRight size={15} style={{ flexShrink: 0, color: "var(--text-muted)" }} />
                    </button>
                  ))}
                </div>

                <div className="support-widget-actions">
                  <button className="support-widget-action-btn support-widget-action-btn--primary" onClick={() => setView("new")}>
                    <MdAdd size={16} /> New Ticket
                  </button>
                  <button className="support-widget-action-btn" onClick={() => setView("tickets")}>
                    <MdOutlineHelpOutline size={16} /> My Tickets
                    {openTickets.length > 0 && (
                      <span className="support-widget-count-badge">{openTickets.length}</span>
                    )}
                  </button>
                </div>
              </>
            )}

            {view === "new" && (
              <form onSubmit={handleSubmit} className="support-widget-form">
                <button type="button" className="support-widget-back" onClick={() => setView("home")}>← Back</button>
                <div className="support-widget-form-title">New Ticket</div>

                <div className="support-widget-form-field">
                  <label>Subject *</label>
                  <input type="text" placeholder="Brief summary of the issue" value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} required />
                </div>
                <div className="support-widget-form-row">
                  <div className="support-widget-form-field">
                    <label>Category</label>
                    <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                      <option value="GENERAL">General</option>
                      <option value="TECHNICAL">Technical</option>
                      <option value="BILLING">Billing</option>
                      <option value="ACCOUNT">Account</option>
                      <option value="KIOSK_ISSUE">Kitchen Issue</option>
                    </select>
                  </div>
                  <div className="support-widget-form-field">
                    <label>Priority</label>
                    <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>
                <div className="support-widget-form-field">
                  <label>Description *</label>
                  <textarea rows={4} placeholder="Describe your issue in detail..." value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
                </div>

                <button type="submit" className="support-widget-action-btn support-widget-action-btn--primary" disabled={submitting}>
                  {submitting
                    ? <span className="btn_loader" style={{ width: 13, height: 13 }} />
                    : <><MdCheckCircle size={16} /> Submit Ticket</>
                  }
                </button>
              </form>
            )}

            {view === "tickets" && (
              <>
                <button type="button" className="support-widget-back" onClick={() => setView("home")}>← Back</button>
                <div className="support-widget-form-title">Recent Tickets</div>

                {ticketsLoading ? (
                  <div style={{ padding: "16px 0" }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="skeleton_shimmer skeleton_text" style={{ height: 52, borderRadius: 10, marginBottom: 8 }} />
                    ))}
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="support-widget-empty">
                    <MdOutlineHelpOutline size={32} style={{ opacity: 0.3 }} />
                    <p>No tickets yet</p>
                  </div>
                ) : (
                  <div className="support-widget-ticket-list">
                    {tickets.map((t) => {
                      const sc = STATUS_COLORS[t.status] || STATUS_COLORS.OPEN;
                      return (
                        <div key={t.id} className="support-widget-ticket-row"
                          onClick={() => { setIsOpen(false); navigate(`/app/support/${t.id}`); }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="support-widget-ticket-subject">{t.subject}</div>
                            <div className="support-widget-ticket-meta">
                              <span style={{ background: sc.bg, color: sc.color, padding: "1px 7px", borderRadius: 20, fontSize: "0.62rem", fontWeight: 800 }}>
                                {t.status.replace(/_/g, " ")}
                              </span>
                              <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>#{t.id.slice(0, 6).toUpperCase()}</span>
                            </div>
                          </div>
                          <MdChevronRight size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </div>
                )}

                <button className="support-widget-action-btn" style={{ marginTop: 8 }} onClick={openTicketsPage}>
                  View all tickets <MdArrowForward size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
