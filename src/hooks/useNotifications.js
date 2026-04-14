import { useState, useCallback, useRef } from "react";
import * as notificationApi from "../api/notifications";
import { toast } from "react-toastify";

export default function useNotifications({ defaultLimit = 10 } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async (pageNum = 1, refresh = false) => {
    if (isFetchingRef.current && !refresh) return;

    setLoading(true);
    isFetchingRef.current = true;
    try {
      const res = await notificationApi.getNotifications(pageNum, defaultLimit);
      if (res.success) {
        if (pageNum === 1 || refresh) {
          setNotifications(res.data.items);
        } else {
          setNotifications(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const newItems = res.data.items.filter(i => !existingIds.has(i.id));
            return [...prev, ...newItems];
          });
        }
        setUnreadCount(res.data.unreadCount || 0);
        setTotal(res.data.total || 0);
        setPage(res.data.page || 1);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [defaultLimit]);

  const loadMore = useCallback(() => {
    if (notifications.length < total && !loading) {
      fetchNotifications(page + 1);
    }
  }, [notifications.length, total, loading, page, fetchNotifications]);

  const markAsRead = async (id) => {
    // Optimistic Update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      const res = await notificationApi.markAsRead(id);
      if (!res.success) {
        throw new Error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark notification as read");
      // Revert optimism if needed (simple refetch for accuracy)
      fetchNotifications(1, true);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      const res = await notificationApi.markAllAsRead();
      if (!res.success) {
        throw new Error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark all as read");
      fetchNotifications(1, true);
    }
  };

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await notificationApi.getNotificationSettings();
      if (res.success) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch notification settings", err);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const updateSettings = async (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    try {
      const res = await notificationApi.updateNotificationSettings(newSettings);
      if (res.success) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update notification settings");
      fetchSettings();
    }
  };

  return {
    notifications,
    unreadCount,
    total,
    loading,
    settings,
    settingsLoading,
    fetchNotifications,
    loadMore,
    markAsRead,
    markAllAsRead,
    fetchSettings,
    updateSettings,
  };
}
