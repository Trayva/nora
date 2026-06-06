import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import useNotifications from "../../hooks/useNotifications";
import moment from "moment";
import {
  MdOutlineNotifications,
  MdCheckCircleOutline,
  MdDeleteSweep,
  MdOutlineDoneAll,
  MdOutlineCircle,
  MdArrowBack,
} from "react-icons/md";
import "./Notifications.css";

/* ── Category filters ── */
const FILTERS = [
  { id: "all",     label: "All" },
  { id: "unread",  label: "Unread" },
];

/* ── Notification item ── */
function NotifItem({ notif, onRead }) {
  return (
    <div
      className={`notif-item ${!notif.isRead ? "notif-item--unread" : ""}`}
      onClick={() => !notif.isRead && onRead(notif.id)}
    >
      {/* Unread dot */}
      <div className="notif-item-dot-col">
        {!notif.isRead && <span className="notif-unread-dot" />}
      </div>

      {/* Icon */}
      <div className={`notif-item-icon ${!notif.isRead ? "notif-item-icon--accent" : ""}`}>
        <MdOutlineNotifications size={18} />
      </div>

      {/* Content */}
      <div className="notif-item-content">
        <p className="notif-item-title">{notif.title}</p>
        {notif.message && <p className="notif-item-message">{notif.message}</p>}
        <span className="notif-item-time">{moment(notif.createdAt).fromNow()}</span>
      </div>

      {/* Read indicator */}
      {!notif.isRead && (
        <button
          className="notif-item-read-btn"
          onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
          title="Mark as read"
        >
          <MdCheckCircleOutline size={16} />
        </button>
      )}
    </div>
  );
}

/* ── Empty state ── */
function EmptyState() {
  return (
    <div className="notif-empty">
      <div className="notif-empty-icon">
        <MdOutlineDoneAll size={28} />
      </div>
      <p className="notif-empty-title">All caught up</p>
      <p className="notif-empty-sub">No notifications match this filter.</p>
    </div>
  );
}

/* ── Main component ── */
export default function NotificationsPage() {
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const { theme } = useTheme();

  const {
    notifications,
    unreadCount,
    total,
    loading,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ defaultLimit: 20 });

  useEffect(() => {
    fetchNotifications(1, true);
  }, [fetchNotifications]);

  const displayed = filter === "unread"
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  return (
    <div className="notif-page">
      {/* ── Header ── */}
      <div className="notif-page-header">
        <div className="notif-header-left">
          <div className="notif-title-row">
            <button className="notif-back-btn" onClick={() => navigate(-1)} title="Go back">
              <MdArrowBack size={20} />
            </button>
            <h1 className="notif-page-title">Notifications</h1>
          </div>
          <p className="notif-page-meta">
            {total} total · <span className={unreadCount > 0 ? "notif-meta-unread" : ""}>{unreadCount} unread</span>
          </p>
        </div>
        <div className="notif-header-actions">
          {unreadCount > 0 && (
            <button id="notif-mark-all" className="notif-action-btn" onClick={markAllAsRead}>
              <MdOutlineDoneAll size={14} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="notif-filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            id={`notif-filter-${f.id}`}
            className={`notif-filter-btn ${filter === f.id ? "notif-filter-btn--active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {f.id === "unread" && unreadCount > 0 && (
              <span className="notif-filter-count">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="notif-list-wrap">
        {loading && notifications.length === 0 ? (
          <div className="notif-skeleton-list">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="notif-skeleton-item">
                <div className="skeleton_shimmer skeleton_circle" style={{ width: 36, height: 36, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton_shimmer skeleton_text" style={{ width: "55%", height: 13, marginBottom: 6 }} />
                  <div className="skeleton_shimmer skeleton_text" style={{ width: "80%", height: 11, marginBottom: 6 }} />
                  <div className="skeleton_shimmer skeleton_text" style={{ width: "25%", height: 10 }} />
                </div>
              </div>
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="notif-list">
              {displayed.map((n) => (
                <NotifItem key={n.id} notif={n} onRead={markAsRead} />
              ))}
            </div>

            {/* Load more */}
            {notifications.length < total && (
              <div className="notif-load-more-row">
                <button
                  id="notif-load-more"
                  className="notif-load-more-btn"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
