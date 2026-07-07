import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import {
  MdOutlineNotifications,
  MdOutlineNotificationsActive,
  MdOutlineDoneAll,
  MdCheckCircleOutline,
  MdArrowForward,
  MdClose,
} from "react-icons/md";
import useNotifications from "../../hooks/useNotifications";
import "./NotificationBell.css";
import { useTheme } from "../../contexts/ThemeContext";

export default function NotificationBell({ className = "desktop-header-icon-btn" }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [panelOpen, setPanelOpen] = useState(false);
  const wrapRef = useRef(null);

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ defaultLimit: 6 });

  // Poll for badge update every 60s
  useEffect(() => {
    fetchNotifications(1);
    const interval = setInterval(() => fetchNotifications(1, true), 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Load preview when panel opens
  useEffect(() => {
    if (panelOpen) fetchNotifications(1, true);
  }, [panelOpen, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    if (!panelOpen) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [panelOpen]);

  const Icon = unreadCount > 0 ? MdOutlineNotificationsActive : MdOutlineNotifications;

  const preview = notifications.slice(0, 5);

  return (
    <div
      className={`notification-bell-container ${theme === "dark" ? "dark-theme" : ""}`}
      ref={wrapRef}
    >
      {/* Bell button */}
      <button
        className={className}
        onClick={() => setPanelOpen((v) => !v)}
        title="Notifications"
        style={{ position: "relative" }}
        aria-label="Notifications"
      >
        <Icon size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Popover panel ── */}
      {panelOpen && (
        <div className="notif-popover">
          {/* Header */}
          <div className="notif-popover-header">
            <div>
              <div className="notif-popover-title">Notifications</div>
              {unreadCount > 0 && (
                <div className="notif-popover-meta">{unreadCount} unread</div>
              )}
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {unreadCount > 0 && (
                <button
                  className="notif-popover-read-all"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  <MdOutlineDoneAll size={13} />
                  All read
                </button>
              )}
              <button className="notif-popover-close" onClick={() => setPanelOpen(false)}>
                <MdClose size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="notif-popover-list">
            {loading && preview.length === 0 ? (
              <div style={{ padding: "16px 0" }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "10px 16px", alignItems: "center" }}>
                    <div className="skeleton_shimmer skeleton_circle" style={{ width: 32, height: 32, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton_shimmer skeleton_text" style={{ width: "60%", height: 11, marginBottom: 5 }} />
                      <div className="skeleton_shimmer skeleton_text" style={{ width: "80%", height: 10 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : preview.length === 0 ? (
              <div className="notif-popover-empty">
                <MdOutlineDoneAll size={24} style={{ opacity: 0.3 }} />
                <span>All caught up!</span>
              </div>
            ) : (
              preview.map((n) => (
                <div
                  key={n.id}
                  className={`notif-popover-item ${!n.isRead ? "notif-popover-item--unread" : ""}`}
                  onClick={() => { if (!n.isRead) markAsRead(n.id); }}
                >
                  {/* Unread dot */}
                  <div className="notif-popover-dot-col">
                    {!n.isRead && <span className="notif-popover-unread-dot" />}
                  </div>

                  {/* Icon */}
                  <div className={`notif-popover-icon ${!n.isRead ? "notif-popover-icon--active" : ""}`}>
                    <MdOutlineNotifications size={15} />
                  </div>

                  {/* Content */}
                  <div className="notif-popover-content">
                    <div className="notif-popover-item-title">{n.title}</div>
                    {n.message && (
                      <div className="notif-popover-item-msg">{n.message}</div>
                    )}
                    <div className="notif-popover-item-time">{moment(n.createdAt).fromNow()}</div>
                  </div>

                  {/* Mark read btn */}
                  {!n.isRead && (
                    <button
                      className="notif-popover-mark-btn"
                      onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                      title="Mark as read"
                    >
                      <MdCheckCircleOutline size={13} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="notif-popover-footer">
            <button
              className="notif-popover-view-all"
              onClick={() => { setPanelOpen(false); navigate("/app/notifications"); }}
            >
              View all notifications
              <MdArrowForward size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
