import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MdOutlineNotifications, MdOutlineNotificationsActive } from "react-icons/md";
import useNotifications from "../../hooks/useNotifications";
import "./NotificationBell.css";
import { useTheme } from "../../contexts/ThemeContext";

export default function NotificationBell({ className = "desktop-header-icon-btn" }) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const {
    unreadCount,
    fetchNotifications,
  } = useNotifications({ defaultLimit: 1 });

  useEffect(() => {
    fetchNotifications(1);
    // Poll every 60 seconds to keep unread badge updated
    const interval = setInterval(() => fetchNotifications(1, true), 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const Icon = unreadCount > 0 ? MdOutlineNotificationsActive : MdOutlineNotifications;

  return (
    <div className={`notification-bell-container ${theme === "dark" ? "dark-theme" : ""}`}>
      <button
        className={className}
        onClick={() => navigate("/app/notifications")}
        title="Notifications"
        style={{ position: "relative" }}
      >
        <Icon size={18} />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
