import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import "../app/Business/Business.css";
import {
  MdWifi,
  MdWifiOff,
  MdLock,
  MdLockOpen,
  MdLocationOn,
  MdEdit,
  MdAdd,
  MdSignalCellularAlt,
  MdPerson,
  MdVerified,
  MdVideocam,
  MdClose,
  MdOutlineKitchen,
  MdCloud,
} from "react-icons/md";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import LocationForm from "./LocationForm";
import VendorMenuSection from "./VendorMenuSection";

export { MenuDetailDrawer } from "./MenuDetailDrawer";

function ToggleRow({ icon, label, value, loading, onToggle }) {
  return (
    <div className="kiosk_toggle_row">
      <div className="kiosk_toggle_left">
        <span className="profile_phone_date_icon">{icon}</span>
        <span className="kiosk_toggle_label">{label}</span>
      </div>
      <button
        className={`kiosk_toggle_switch ${value ? "kiosk_toggle_on" : ""}`}
        onClick={onToggle}
        disabled={loading}
      >
        <span className="kiosk_toggle_knob" />
      </button>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="kiosk_meta_row">
      <span className="kiosk_meta_key">{label}</span>
      <span className="kiosk_meta_val">
        {value || <span className="kiosk_meta_muted">—</span>}
      </span>
    </div>
  );
}

/* ── Live Stream Modal ─────────────────────────────────────── */
function LiveStreamModal({ onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        /* browser may deny */
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(3px)",
        }}
      />
      <div
        ref={containerRef}
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(520px, 92vw)",
          background: "var(--bg-card)",
          borderRadius: isFullscreen ? 0 : 18,
          overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
          ...(isFullscreen
            ? {
              width: "100vw",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
            }
            : {}),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MdVideocam size={16} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: 800,
                color: "var(--text-heading)",
              }}
            >
              Live Stream
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Kitchen camera feed
            </div>
          </div>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              marginRight: 4,
              fontSize: "0.9rem",
            }}
          >
            {isFullscreen ? "⤡" : "⤢"}
          </button>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
            }}
          >
            <MdClose size={15} />
          </button>
        </div>

        <div
          style={{
            position: "relative",
            background: "#0a0a0a",
            ...(isFullscreen ? { flex: 1 } : { aspectRatio: "16/9" }),
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(239,68,68,0.1)",
              border: "2px solid rgba(239,68,68,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MdVideocam size={28} style={{ color: "rgba(239,68,68,0.6)" }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "0.88rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.7)",
                marginBottom: 4,
              }}
            >
              No Feed Available
            </div>
            <div
              style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)" }}
            >
              Live stream will appear here when the camera is connected
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 8px",
              background: "rgba(0,0,0,0.5)",
              borderRadius: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#ef4444",
                opacity: 0.5,
              }}
            />
            <span
              style={{
                fontSize: "0.65rem",
                color: "rgba(255,255,255,0.5)",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              OFFLINE
            </span>
          </div>
          {!isFullscreen && (
            <button
              onClick={toggleFullscreen}
              style={{
                position: "absolute",
                bottom: 10,
                right: 10,
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                background: "rgba(0,0,0,0.5)",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.65rem",
                fontWeight: 700,
              }}
            >
              ⤢ Fullscreen
            </button>
          )}
        </div>

        <div
          style={{
            padding: "12px 20px",
            fontSize: "0.74rem",
            color: "var(--text-muted)",
            textAlign: "center",
            flexShrink: 0,
          }}
        >
          Camera integration coming soon
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function KioskOverview({ cart, onUpdate, onRefresh }) {
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [togglingLock, setTogglingLock] = useState(false);
  const [editingRadius, setEditingRadius] = useState(false);
  const [radius, setRadius] = useState(cart.serviceRadius || "");
  const [savingRadius, setSavingRadius] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showLiveStream, setShowLiveStream] = useState(false);
  const [editingHours, setEditingHours] = useState(false);
  const [opHours, setOpHours] = useState(cart.operatingHours || "");
  const [opDays, setOpDays] = useState(cart.operatingDays || "");
  const [savingHours, setSavingHours] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const [editingOps, setEditingOps] = useState(false);
  const [expectedOrders, setExpectedOrders] = useState(cart.expectedMonthlyOrders || "");
  const [bills, setBills] = useState([]);
  const [savingOps, setSavingOps] = useState(false);

  useEffect(() => {
    if (cart.operationalBills && Array.isArray(cart.operationalBills) && cart.operationalBills.length > 0) {
      setBills(cart.operationalBills);
    } else {
      setBills([
        { name: "Rent", amount: "" },
        { name: "Electric Bill", amount: "" },
        { name: "Water Bill", amount: "" },
        { name: "Consumables", amount: "" },
        { name: "Salary", amount: "" }
      ]);
    }
    setExpectedOrders(cart.expectedMonthlyOrders || "");
  }, [cart]);

  const handleSaveOperationalCosts = async () => {
    const ordersNum = Number(expectedOrders);
    if (isNaN(ordersNum) || ordersNum < 0) {
      return toast.error("Expected monthly orders must be a valid non-negative number");
    }

    const formattedBills = bills
      .filter(b => b.name.trim() !== "")
      .map(b => ({
        name: b.name.trim(),
        amount: Number(b.amount) || 0
      }));

    setSavingOps(true);
    try {
      const res = await api.patch(`/kiosk/${cart.id}/operational-costs`, {
        expectedMonthlyOrders: ordersNum,
        operationalBills: formattedBills,
      });

      onUpdate(res.data.data);
      toast.success("Operational costs updated successfully");
      setEditingOps(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update operational costs");
    } finally {
      setSavingOps(false);
    }
  };

  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    try {
      const res = await api.patch(`/kiosk/${cart.id}/status/online`);
      onUpdate({
        ...cart,
        isOnline: res.data.data?.isOnline ?? !cart.isOnline,
      });
      toast.success(`Cart is now ${!cart.isOnline ? "online" : "offline"}`);
    } catch {
      toast.error("Failed to toggle online status");
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleToggleLock = async () => {
    setTogglingLock(true);
    try {
      const res = await api.patch(`/kiosk/${cart.id}/status/lock`);
      onUpdate({
        ...cart,
        isLocked: res.data.data?.isLocked ?? !cart.isLocked,
      });
      toast.success(`Cart is now ${!cart.isLocked ? "locked" : "unlocked"}`);
    } catch {
      toast.error("Failed to toggle lock status");
    } finally {
      setTogglingLock(false);
    }
  };

  const handleSaveRadius = async () => {
    if (!radius || isNaN(radius)) return toast.error("Enter a valid radius");
    setSavingRadius(true);
    try {
      await api.patch(`/kiosk/service-radius/${cart.id}`, {
        serviceRadius: Number(radius),
      });
      onUpdate({ ...cart, serviceRadius: Number(radius) });
      toast.success("Service radius updated");
      setEditingRadius(false);
    } catch {
      toast.error("Failed to update radius");
    } finally {
      setSavingRadius(false);
    }
  };

  const handleSaveHours = async () => {
    setSavingHours(true);
    try {
      await api.patch(`/kiosk/${cart.id}/operating-hours`, {
        ...(opHours.trim() && { operatingHours: opHours.trim() }),
        ...(opDays.trim() && { operatingDays: opDays.trim() }),
      });
      onUpdate({
        ...cart,
        operatingHours: opHours.trim() || null,
        operatingDays: opDays.trim() || null,
      });
      toast.success("Operating hours updated");
      setEditingHours(false);
    } catch {
      toast.error("Failed to update operating hours");
    } finally {
      setSavingHours(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      await api.post(`/kiosk/${cart.id}/deactivate`);
      onUpdate({ ...cart, status: "INACTIVE" });
      toast.success("Kiosk deactivated successfully");
      setShowDeactivateModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to deactivate kiosk",
      );
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      await api.post(`/kiosk/${cart.id}/activate`);
      onUpdate({ ...cart, status: "ACTIVE" });
      toast.success("Kiosk reactivated successfully");
      setShowReactivateModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to reactivate kiosk",
      );
    } finally {
      setReactivating(false);
    }
  };

  const handleLocationSaved = (newLocation) => {
    setShowLocationForm(false);
    onUpdate({ ...cart, location: newLocation });
  };

  return (
    <div className="kiosk_tab_content" style={{ paddingBottom: 80 }}>
      {/* ── Kitchen Controls ── */}
      <div className="drawer_section_title">Kitchen Controls</div>
      <div className="kiosk_toggles_block">
        <ToggleRow
          icon={cart.isOnline ? <MdWifi size={15} /> : <MdWifiOff size={15} />}
          label="Online Status"
          value={cart.isOnline}
          loading={togglingOnline}
          onToggle={handleToggleOnline}
        />
        <ToggleRow
          icon={cart.isLocked ? <MdLock size={15} /> : <MdLockOpen size={15} />}
          label="Kitchen Lock"
          value={cart.isLocked}
          loading={togglingLock}
          onToggle={handleToggleLock}
        />
        <div
          className="kiosk_toggle_row"
          style={{ cursor: "pointer" }}
          onClick={() => setShowLiveStream(true)}
        >
          <div className="kiosk_toggle_left">
            <span className="profile_phone_date_icon">
              <MdVideocam size={15} />
            </span>
            <span className="kiosk_toggle_label">Live Stream</span>
          </div>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: 999,
              background: "rgba(107,114,128,0.1)",
              color: "#6b7280",
              border: "1px solid rgba(107,114,128,0.2)",
            }}
          >
            View
          </span>
        </div>
      </div>

      {/* ── Service Radius ── */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        Service Radius
      </div>
      <div className="kiosk_radius_block">
        <div className="kiosk_radius_row">
          <span className="profile_phone_date_icon">
            <MdSignalCellularAlt size={15} />
          </span>
          <span className="kiosk_toggle_label">Radius</span>
          {editingRadius ? (
            <div className="kiosk_radius_edit">
              <input
                className="modal-input"
                style={{
                  width: 90,
                  height: 34,
                  padding: "0 10px",
                  fontSize: "0.82rem",
                }}
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="km"
              />
              <button
                className={`app_btn app_btn_confirm ${savingRadius ? "btn_loading" : ""}`}
                style={{ height: 34, padding: "0 14px", fontSize: "0.78rem" }}
                onClick={handleSaveRadius}
                disabled={savingRadius}
              >
                <span className="btn_text">Save</span>
                {savingRadius && (
                  <span
                    className="btn_loader"
                    style={{ width: 14, height: 14 }}
                  />
                )}
              </button>
              <button
                className="app_btn app_btn_cancel"
                style={{ height: 34, padding: "0 14px", fontSize: "0.78rem" }}
                onClick={() => {
                  setEditingRadius(false);
                  setRadius(cart.serviceRadius || "");
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="kiosk_radius_display">
              <span className="kiosk_meta_val">
                {cart.serviceRadius ? (
                  `${cart.serviceRadius} km`
                ) : (
                  <span className="kiosk_meta_muted">Not set</span>
                )}
              </span>
              <button
                className="kiosk_icon_action_btn"
                onClick={() => setEditingRadius(true)}
              >
                <MdEdit size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Operating Hours ── */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        <span>Operating Hours</span>
        <button
          className="kiosk_icon_action_btn"
          style={{ marginLeft: "auto" }}
          onClick={() => setEditingHours((v) => !v)}
          title="Edit operating hours"
        >
          <MdEdit size={14} />
        </button>
      </div>
      {editingHours ? (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="modal-label">Operating Hours</label>
            <select
              className="modal-input"
              value={opHours}
              onChange={(e) => setOpHours(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="">Select hours…</option>
              {[
                "06:00 – 18:00",
                "06:00 – 20:00",
                "06:00 – 22:00",
                "07:00 – 18:00",
                "07:00 – 20:00",
                "07:00 – 22:00",
                "08:00 – 17:00",
                "08:00 – 18:00",
                "08:00 – 20:00",
                "08:00 – 22:00",
                "09:00 – 17:00",
                "09:00 – 18:00",
                "09:00 – 20:00",
                "09:00 – 21:00",
                "09:00 – 22:00",
                "10:00 – 18:00",
                "10:00 – 20:00",
                "10:00 – 22:00",
                "11:00 – 21:00",
                "11:00 – 22:00",
                "12:00 – 22:00",
                "12:00 – 23:00",
                "18:00 – 02:00",
                "24 Hours",
              ].map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="modal-label">Operating Days</label>
            <select
              className="modal-input"
              value={opDays}
              onChange={(e) => setOpDays(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="">Select days…</option>
              {[
                "Monday – Friday",
                "Monday – Saturday",
                "Monday – Sunday",
                "Tuesday – Saturday",
                "Tuesday – Sunday",
                "Wednesday – Sunday",
                "Thursday – Sunday",
                "Friday – Sunday",
                "Saturday – Sunday",
                "Weekdays Only",
                "Weekends Only",
                "Everyday",
              ].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              className="app_btn app_btn_cancel"
              style={{ flex: 1, height: 38 }}
              onClick={() => {
                setEditingHours(false);
                setOpHours(cart.operatingHours || "");
                setOpDays(cart.operatingDays || "");
              }}
            >
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm${savingHours ? " btn_loading" : ""}`}
              style={{ flex: 2, height: 38, position: "relative" }}
              onClick={handleSaveHours}
              disabled={savingHours}
            >
              <span className="btn_text">Save</span>
              {savingHours && (
                <span
                  className="btn_loader"
                  style={{ width: 14, height: 14 }}
                />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="kiosk_item_meta" style={{ marginBottom: 0 }}>
          <div className="kiosk_meta_row">
            <span className="kiosk_meta_key">Hours</span>
            <span className="kiosk_meta_val">
              {cart.operatingHours || (
                <span className="kiosk_meta_muted">Not set</span>
              )}
            </span>
          </div>
          <div className="kiosk_meta_row">
            <span className="kiosk_meta_key">Days</span>
            <span className="kiosk_meta_val">
              {cart.operatingDays || (
                <span className="kiosk_meta_muted">Not set</span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* ── Operational Costs ── */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        <span>Operational Costs</span>
        <button
          className="kiosk_icon_action_btn"
          style={{ marginLeft: "auto" }}
          onClick={() => setEditingOps((v) => !v)}
          title="Edit operational costs"
        >
          <MdEdit size={14} />
        </button>
      </div>
      {editingOps ? (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label className="modal-label">Expected Monthly Orders</label>
            <input
              type="number"
              className="modal-input"
              value={expectedOrders}
              onChange={(e) => setExpectedOrders(e.target.value)}
              placeholder="e.g. 1000"
              style={{ marginBottom: 0 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label className="modal-label" style={{ marginBottom: 0 }}>Monthly Bills</label>
            {bills.map((bill, index) => (
              <div key={index} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="text"
                  className="modal-input"
                  value={bill.name}
                  onChange={(e) => {
                    const updated = [...bills];
                    updated[index].name = e.target.value;
                    setBills(updated);
                  }}
                  placeholder="Bill Name (e.g. Rent)"
                  style={{ flex: 2, marginBottom: 0 }}
                />
                <input
                  type="number"
                  className="modal-input"
                  value={bill.amount}
                  onChange={(e) => {
                    const updated = [...bills];
                    updated[index].amount = e.target.value;
                    setBills(updated);
                  }}
                  placeholder="₦ Amount"
                  style={{ flex: 1, marginBottom: 0 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setBills(bills.filter((_, i) => i !== index));
                  }}
                  style={{
                    height: 38,
                    width: 38,
                    borderRadius: 6,
                    border: "1px solid rgba(239,68,68,0.2)",
                    background: "rgba(239,68,68,0.08)",
                    color: "#ef4444",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Remove Bill"
                >
                  &times;
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setBills([...bills, { name: "", amount: "" }])}
              className="app_btn"
              style={{
                height: 32,
                fontSize: "0.72rem",
                padding: "0 10px",
                alignSelf: "flex-start",
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                color: "var(--accent)"
              }}
            >
              + Add Bill
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              className="app_btn app_btn_cancel"
              style={{ flex: 1, height: 38 }}
              onClick={() => {
                setEditingOps(false);
                if (cart.operationalBills && Array.isArray(cart.operationalBills)) {
                  setBills(cart.operationalBills);
                } else {
                  setBills([
                    { name: "Rent", amount: "" },
                    { name: "Electric Bill", amount: "" },
                    { name: "Water Bill", amount: "" }
                  ]);
                }
                setExpectedOrders(cart.expectedMonthlyOrders || "");
              }}
            >
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm${savingOps ? " btn_loading" : ""}`}
              style={{ flex: 2, height: 38, position: "relative" }}
              onClick={handleSaveOperationalCosts}
              disabled={savingOps}
            >
              <span className="btn_text">Save</span>
              {savingOps && (
                <span
                  className="btn_loader"
                  style={{ width: 14, height: 14 }}
                />
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="kiosk_item_meta" style={{ marginBottom: 0 }}>
          <div className="kiosk_meta_row">
            <span className="kiosk_meta_key">Monthly Expected Orders</span>
            <span className="kiosk_meta_val">
              {cart.expectedMonthlyOrders || 0}
            </span>
          </div>
          {cart.operationalBills && Array.isArray(cart.operationalBills) && cart.operationalBills.length > 0 ? (
            cart.operationalBills.map((b, idx) => (
              <div key={idx} className="kiosk_meta_row" style={{ paddingLeft: 12 }}>
                <span className="kiosk_meta_key" style={{ fontWeight: 500, color: "var(--text-muted)" }}>↳ {b.name}</span>
                <span className="kiosk_meta_val" style={{ fontWeight: 500 }}>
                  {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(b.amount || 0)}
                </span>
              </div>
            ))
          ) : (
            <div className="kiosk_meta_row" style={{ paddingLeft: 12 }}>
              <span className="kiosk_meta_key" style={{ fontStyle: "italic", color: "var(--text-muted)" }}>No bills listed</span>
            </div>
          )}
          <div className="kiosk_meta_row" style={{ borderTop: "1px dashed var(--border)", paddingTop: 8, marginTop: 4 }}>
            <span className="kiosk_meta_key" style={{ fontWeight: 800, color: "var(--text-heading)" }}>Operational Cost / Order</span>
            <span className="kiosk_meta_val" style={{ fontWeight: 800, color: "var(--accent)" }}>
              {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(cart.operationalCost || 0)}
            </span>
          </div>
        </div>
      )}

      {/* ── Kitchen Info ── */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        Kitchen Info
      </div>
      <div className="kiosk_item_meta" style={{ marginBottom: 0 }}>
        <InfoRow label="Serial Number" value={cart.serialNumber} />
        <InfoRow label="Status" value={cart.status} />
        <InfoRow label="Owner" value={cart.owner?.fullName || "N/A"} />
        <div className="kiosk_meta_row">
          <span className="kiosk_meta_key">Kitchen Type</span>
          <span className="kiosk_meta_val">
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 9px",
              borderRadius: 20,
              fontSize: "0.72rem",
              fontWeight: 800,
              background: cart.kitchenType === "CLOUD" ? "rgba(99,102,241,0.1)" : "rgba(34,197,94,0.1)",
              color: cart.kitchenType === "CLOUD" ? "#6366f1" : "#16a34a",
              border: `1px solid ${cart.kitchenType === "CLOUD" ? "rgba(99,102,241,0.3)" : "rgba(34,197,94,0.3)"}`,
              letterSpacing: "0.04em",
            }}>
              {cart.kitchenType === "CLOUD"
                ? <><MdCloud size={12} /> Cloud Kitchen</>
                : <><MdOutlineKitchen size={12} /> Physical Kiosk</>}
            </span>
          </span>
        </div>
      </div>

      {/* ── Location ── */}
      <div className="drawer_section_title" style={{ marginTop: 20 }}>
        <span>Location</span>
        <button
          className="kiosk_icon_action_btn"
          style={{ marginLeft: "auto" }}
          title={cart.location ? "Change location" : "Add location"}
          onClick={() => setShowLocationForm((v) => !v)}
        >
          {cart.location ? <MdEdit size={14} /> : <MdAdd size={15} />}
        </button>
      </div>

      {showLocationForm ? (
        <LocationForm
          kioskId={cart.id}
          onSaved={handleLocationSaved}
          onCancel={() => setShowLocationForm(false)}
        />
      ) : cart.location ? (
        <div className="kiosk_location_card">
          <div className="kiosk_location_icon_wrap">
            <MdLocationOn size={18} />
          </div>
          <div className="kiosk_location_info">
            <div className="kiosk_location_name">{cart.location.name}</div>
            {cart.location.address && (
              <div className="kiosk_location_address">
                {cart.location.address}
              </div>
            )}
            {(cart.location.lga || cart.location.city) && (
              <div className="kiosk_location_address">
                {[cart.location.lga, cart.location.city]
                  .filter(Boolean)
                  .join(", ")}
              </div>
            )}
            {cart.location.country && (
              <div className="kiosk_location_address">
                {cart.location.country}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="kiosk_empty_inline">
          <MdLocationOn size={18} style={{ opacity: 0.3 }} />
          <span>No location assigned</span>
        </div>
      )}

      {/* ── Brand & Menu ── */}
      <VendorMenuSection
        cart={cart}
        onUpdate={onUpdate}
        onRefresh={onRefresh}
      />

      {/* ── Operators ── */}
      <div className="drawer_section_title" style={{ marginTop: 24 }}>
        Operators
        <span className="kiosk_section_count" style={{ marginLeft: 8 }}>
          {cart.operators?.length || 0}
        </span>
      </div>

      {cart.operators?.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cart.operators.map((op) => {
            const name =
              op.user?.fullName ||
              op.user?.email ||
              `Operator #${op.id.slice(0, 6).toUpperCase()}`;
            return (
              <div
                key={op.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
              >
                <div
                  className="kiosk_operator_avatar"
                  style={{ flexShrink: 0 }}
                >
                  {name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 6 }}
                  >
                    <span className="kiosk_operator_name">{name}</span>
                    {op.isApproved && (
                      <MdVerified
                        size={14}
                        style={{ color: "#16a34a", flexShrink: 0 }}
                      />
                    )}
                  </div>
                  <div className="kiosk_operator_meta">
                    {op.user?.email && <span>{op.user.email}</span>}
                    {op.state?.name && (
                      <span style={{ marginLeft: op.user?.email ? 6 : 0 }}>
                        {op.user?.email ? "· " : ""}
                        {op.state.name}
                      </span>
                    )}
                    {op.certification && (
                      <span style={{ marginLeft: 6 }}>
                        · {op.certification}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 999,
                    flexShrink: 0,
                    ...(op.isApproved
                      ? {
                        background: "rgba(34,197,94,0.1)",
                        color: "#16a34a",
                        border: "1px solid rgba(34,197,94,0.25)",
                      }
                      : {
                        background: "rgba(234,179,8,0.1)",
                        color: "#ca8a04",
                        border: "1px solid rgba(234,179,8,0.25)",
                      }),
                  }}
                >
                  {op.isApproved ? "Active" : "Pending"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="kiosk_empty_inline">
          <MdPerson size={18} style={{ opacity: 0.3 }} />
          <span>No operators assigned</span>
        </div>
      )}

      {/* ── Danger Zone / Recovery Zone ── */}
      {cart.status === "INACTIVE" ? (
        <div
          style={{
            marginTop: 40,
            padding: 20,
            background: "rgba(34,197,94,0.04)",
            borderRadius: 16,
            border: "1px dashed rgba(34,197,94,0.25)",
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#16a34a" }}>Recovery Zone</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
              This kiosk is currently deactivated. Reactivating it will resume all operations.
            </div>
          </div>
          <button
            className="app_btn"
            style={{
              background: "transparent",
              border: "1px solid #16a34a",
              color: "#16a34a",
              width: "100%",
              height: 40,
              fontSize: "0.8rem",
            }}
            onClick={() => setShowReactivateModal(true)}
          >
            Reactivate Kiosk
          </button>
        </div>
      ) : (
        <div
          style={{
            marginTop: 40,
            padding: 20,
            background: "rgba(239,68,68,0.04)",
            borderRadius: 16,
            border: "1px dashed rgba(239,68,68,0.2)",
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#ef4444" }}>Danger Zone</div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
              Deactivating this kiosk will stop its operations. This action requires confirmation.
            </div>
          </div>
          <button
            className="app_btn"
            style={{
              background: "transparent",
              border: "1px solid #ef4444",
              color: "#ef4444",
              width: "100%",
              height: 40,
              fontSize: "0.8rem",
            }}
            onClick={() => setShowDeactivateModal(true)}
          >
            Deactivate Kiosk
          </button>
        </div>
      )}

      {/* ── Modals ── */}
      {showLiveStream && (
        <LiveStreamModal onClose={() => setShowLiveStream(false)} />
      )}

      {showDeactivateModal && (
        <Modal
          isOpen={true}
          onClose={() => !deactivating && setShowDeactivateModal(false)}
          title="Deactivate Kiosk?"
        >
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ fontSize: "0.88rem", color: "var(--text-body)", marginBottom: 20, lineHeight: 1.5 }}>
              Are you sure you want to deactivate <strong style={{ color: "var(--text-heading)" }}>{cart.serialNumber}</strong>?
              This will suspend all active operations for this unit.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="app_btn app_btn_cancel"
                style={{ flex: 1, height: 42 }}
                onClick={() => setShowDeactivateModal(false)}
                disabled={deactivating}
              >
                Cancel
              </button>
              <button
                className={`app_btn${deactivating ? " btn_loading" : ""}`}
                style={{
                  flex: 1,
                  height: 42,
                  background: "#ef4444",
                  color: "white",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onClick={handleDeactivate}
                disabled={deactivating}
              >
                <span className="btn_text">Continue</span>
                {deactivating && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showReactivateModal && (
        <Modal
          isOpen={true}
          onClose={() => !reactivating && setShowReactivateModal(false)}
          title="Reactivate Kiosk?"
        >
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ fontSize: "0.88rem", color: "var(--text-body)", marginBottom: 20, lineHeight: 1.5 }}>
              Reactivate <strong style={{ color: "var(--text-heading)" }}>{cart.serialNumber}</strong>? This will restore all operations for this unit.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="app_btn app_btn_cancel"
                style={{ flex: 1, height: 42 }}
                onClick={() => setShowReactivateModal(false)}
                disabled={reactivating}
              >
                Cancel
              </button>
              <button
                className={`app_btn${reactivating ? " btn_loading" : ""}`}
                style={{
                  flex: 1,
                  height: 42,
                  background: "#16a34a",
                  color: "white",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={handleReactivate}
                disabled={reactivating}
              >
                <span className="btn_text">Continue</span>
                {reactivating && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
