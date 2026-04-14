import { useState, useRef, useEffect } from "react";
import { MdOutlineNotifications, MdOutlineNotificationsActive } from "react-icons/md";
import useNotifications from "../../hooks/useNotifications";
import "./NotificationBell.css";
import moment from "moment";
import { useTheme } from "../../contexts/ThemeContext";

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { theme } = useTheme();
  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ defaultLimit: 10 });

  useEffect(() => {
    fetchNotifications(1);
    // Optionally set an interval to fetch periodically
    // const interval = setInterval(() => fetchNotifications(1, true), 30000);
    // return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className={`notification-bell-container ${theme === "dark" ? "dark-theme" : ""}`} ref={dropdownRef}>
      <button style={{ backgroundColor: "var(--bg-main)" }} className="notification-bell-btn" onClick={toggleDropdown} title="Notifications">
        {unreadCount > 0 ? (
          <>
            <MdOutlineNotificationsActive className="bell-icon active" />
            <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          </>
        ) : (
          <MdOutlineNotifications className="bell-icon" />
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-body">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No notifications yet.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.isRead ? "unread" : ""}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notif-content">
                    <p className="notif-title">{notif.title}</p>
                    <p className="notif-message">{notif.message}</p>
                    <span className="notif-time">{moment(notif.createdAt).fromNow()}</span>
                  </div>
                  {!notif.isRead && <span className="unread-dot"></span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
