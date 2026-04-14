import { useEffect, useState } from "react";
import useNotifications from "../../hooks/useNotifications";
import { toast } from "react-toastify";

export default function NotificationSettingsForm() {
  const { settings, fetchSettings, updateSettings, settingsLoading } = useNotifications();
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleToggle = async (key, value) => {
    setUpdating(true);
    try {
      await updateSettings({ [key]: value });
      toast.success("Preferences saved successfully", { toastId: "notif-settings-save" });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (settingsLoading && !settings) {
    return <div className="p-3 text-muted">Loading notification preferences...</div>;
  }

  return (
    <section className="mt-5">
      <h3 className="page_title_big m-0">Notification Preferences</h3>
      <p className="welcome_message">
        Choose how we notify you about account activity.
      </p>

      <div className="d-flex flex-column gap-3 mt-3 settings-section">
        <div className="d-flex align-items-center justify-content-between p-3 border rounded shadow-sm">
          <div>
            <h5 className="m-0 mb-1 fw-bold account_info_label">Push Notifications</h5>
            <small className="account_info_item">Receive alerts on your device for immediate updates.</small>
          </div>
          <div className="form-check form-switch fs-4 m-0 d-flex align-items-center">
            <input
              className="form-check-input m-0 cursor-pointer"
              type="checkbox"
              role="switch"
              checked={settings?.pushEnabled ?? true}
              onChange={(e) => handleToggle("pushEnabled", e.target.checked)}
              disabled={updating}
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between p-3 border rounded shadow-sm">
          <div>
            <h5 className="m-0 mb-1 fw-bold account_info_label">Email Notifications</h5>
            <small className="account_info_item">Receive a summary of important alerts via email.</small>
          </div>
          <div className="form-check form-switch fs-4 m-0 d-flex align-items-center">
            <input
              className="form-check-input m-0 cursor-pointer"
              type="checkbox"
              role="switch"
              checked={settings?.emailEnabled ?? true}
              onChange={(e) => handleToggle("emailEnabled", e.target.checked)}
              disabled={updating}
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between p-3 border rounded shadow-sm">
          <div>
            <h5 className="m-0 mb-1 fw-bold d-flex align-items-center gap-2 account_info_label">
              SMS Notifications <span className="badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>Premium</span>
            </h5>
            <small className="account_info_item">Receive text messages for urgent activity.</small>
          </div>
          <div className="form-check form-switch fs-4 m-0 d-flex align-items-center">
            <input
              className="form-check-input m-0 cursor-pointer"
              type="checkbox"
              role="switch"
              checked={settings?.smsEnabled ?? false}
              onChange={(e) => handleToggle("smsEnabled", e.target.checked)}
              disabled={updating}
              style={{ cursor: "pointer" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
