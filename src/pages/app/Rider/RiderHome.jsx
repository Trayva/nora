import { useState, useEffect, useRef } from "react";
import "./Rider.css";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import { useAuth } from "../../../contexts/AuthContext";
import {
  MdCircle,
  MdDeliveryDining,
  MdPerson,
  MdLocationOn,
  MdCalendarToday,
  MdAttachMoney,
  MdCheck,
  MdAccessTime,
  MdDirectionsBike,
  MdHistory,
  MdLocalShipping,
  MdExpandMore,
  MdUpload,
} from "react-icons/md";

const VEHICLE_OPTIONS = [
  { value: "BICYCLE", label: "Bicycle / Bicycle Courier" },
  { value: "MOTORCYCLE", label: "Motorcycle / Dispatch Rider" },
  { value: "CAR", label: "Car / Vehicle Delivery" },
];

const statusColors = {
  PENDING: { bg: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "rgba(234,179,8,0.25)" },
  DISPATCHED: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  DELIVERED: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.25)" },
};

function StatusBadge({ status }) {
  const s = statusColors[status] || { bg: "rgba(107,114,128,0.1)", color: "#6b7280", border: "rgba(107,114,128,0.25)" };
  return (
    <span className="rider-status-badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <MdCircle size={5} />
      {status}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FileInput({ label, accept = "image/*", onChange, currentUrl, hint }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(currentUrl || null);
  const [name, setName] = useState(null);
  const handle = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type.startsWith("image/")) setPreview(URL.createObjectURL(f));
    setName(f.name);
    onChange(f);
  };
  return (
    <div className="form-field" style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
      <label className="modal-label">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
          background: "var(--bg-active)",
          border: "1px dashed var(--border)",
          borderRadius: 10,
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.borderColor = "var(--border)")
        }
      >
        {preview ? (
          <img
            src={preview}
            alt=""
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              objectFit: "cover",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "var(--bg-hover)",
              border: "1px solid rgba(99,102,241,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MdUpload size={14} style={{ color: "var(--accent)" }} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: name || preview ? "var(--text-body)" : "var(--text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name || (preview ? "Uploaded · change" : "Click to upload")}
          </div>
          {hint && (
            <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>
              {hint}
            </div>
          )}
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={handle}
      />
    </div>
  );
}

function OrderCard({ order, activeTab, onActionRefresh }) {
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await api.patch(`/kiosk/shop/order/${order.id}/status/rider`, { status: "ACCEPTED" });
      toast.success("You've been assigned to this delivery! Head over when it's ready.");
      onActionRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept delivery");
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async () => {
    setLoading(true);
    try {
      await api.patch(`/kiosk/shop/order/${order.id}/status/rider`, { status: "DELIVERED" });
      toast.success("Delivery completed successfully! Nice work.");
      onActionRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark as delivered");
    } finally {
      setLoading(false);
    }
  };

  const formattedFee = Number(order.deliveryFee || 0).toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
  const formattedTotal = Number(order.totalAmount || 0).toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

  return (
    <div className="rider-order-card">
      <div className="rider-order-header">
        <span className="rider-order-num">#{order.orderNumber || order.id.slice(0, 8).toUpperCase()}</span>
        <span className="rider-order-time">{formatDate(order.createdAt)}</span>
      </div>

      <div className="rider-order-details">
        <div className="rider-detail-row">
          <span className="rider-detail-label">From Kiosk:</span>
          <span className="rider-detail-val">Kiosk {order.kiosk?.serialNumber || "—"}</span>
        </div>
        {order.kiosk?.location && (
          <div className="rider-detail-row">
            <span className="rider-detail-label">Pickup Address:</span>
            {order.kiosk.location.latitude && order.kiosk.location.longitude ? (
              <a
                className="rider-map-link"
                href={`https://www.google.com/maps/search/?api=1&query=${order.kiosk.location.latitude},${order.kiosk.location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MdLocationOn size={13} />
                <span>{order.kiosk.location.address}{order.kiosk.location.city ? `, ${order.kiosk.location.city}` : ""}</span>
              </a>
            ) : (
              <span className="rider-detail-val">{order.kiosk.location.address}, {order.kiosk.location.city}</span>
            )}
          </div>
        )}
        <div className="rider-detail-row">
          <span className="rider-detail-label">Deliver To:</span>
          {order.deliveryAddress ? (
            order.deliveryLat && order.deliveryLng ? (
              <a
                className="rider-map-link"
                href={`https://www.google.com/maps/dir/?api=1&destination=${order.deliveryLat},${order.deliveryLng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MdLocationOn size={13} />
                <span>{order.deliveryAddress}</span>
              </a>
            ) : (
              <a
                className="rider-map-link"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MdLocationOn size={13} />
                <span>{order.deliveryAddress}</span>
              </a>
            )
          ) : (
            <span className="rider-detail-val">—</span>
          )}
        </div>
        <div className="rider-detail-row">
          <span className="rider-detail-label">Customer Name:</span>
          <span className="rider-detail-val">{order.customerName || "Guest Customer"}</span>
        </div>
        {order.customerPhone && (
          <div className="rider-detail-row">
            <span className="rider-detail-label">Customer Phone:</span>
            <span className="rider-detail-val">{order.customerPhone}</span>
          </div>
        )}
      </div>

      <div className="rider-order-footer">
        <div className="rider-fee-block">
          <span className="rider-fee-label">Your Earning</span>
          <span className="rider-fee-amount">{formattedFee}</span>
        </div>
        <div className="rider-order-actions">
          {activeTab === "available" && (
            <button
              className={`rider-btn rider-btn-accept${loading ? " loading" : ""}`}
              onClick={handleAccept}
              disabled={loading}
            >
              <span>Accept Delivery</span>
              {loading && <span className="rider-loader" />}
            </button>
          )}
          {activeTab === "active" && (
            order.status === "PREPARING" ? (
              <div className="rider-waiting-badge">
                <MdAccessTime size={14} />
                <span>Preparing · Arrive early</span>
              </div>
            ) : (
              <button
                className={`rider-btn rider-btn-deliver${loading ? " loading" : ""}`}
                onClick={handleDeliver}
                disabled={loading}
              >
                <MdCheck size={16} />
                <span>Mark Delivered</span>
                {loading && <span className="rider-loader" />}
              </button>
            )
          )}
          {activeTab === "active" && <StatusBadge status={order.status} />}
          {activeTab === "history" && (
            <StatusBadge status="DELIVERED" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function RiderHome() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [states, setStates] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  // Form states for onboarding
  const [vehicleType, setVehicleType] = useState("MOTORCYCLE");
  const [plateNumber, setPlateNumber] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleDoc, setVehicleDoc] = useState(null);
  const [licenseDoc, setLicenseDoc] = useState(null);
  const [stateId, setStateId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Order pools states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("available"); // available | active | history

  const fetchProfile = async () => {
    try {
      const res = await api.get("/rider/profile/me");
      setProfile(res.data.data);
      return res.data.data;
    } catch {
      setProfile(null);
      return null;
    }
  };

  const fetchStates = async () => {
    try {
      const res = await api.get("/config/state");
      const d = res.data.data;
      setStates(Array.isArray(d) ? d : d?.items || []);
    } catch (err) {
      console.error("Failed to load states config", err);
    }
  };

  const fetchAnalytics = async (riderProfile) => {
    if (!riderProfile || !riderProfile.isApproved) return;
    try {
      const res = await api.get(`/rider/${riderProfile.id}/analytics`);
      setAnalytics(res.data.data);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    }
  };

  const fetchOrders = async (currentTab) => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      let params = {};
      if (currentTab === "available") {
        // available for pickups (both PREPARING and COMPLETED, no rider assigned)
        params = {};
      } else if (currentTab === "active") {
        // assigned to me and in any active stage: PREPARING, COMPLETED, or DISPATCHED
        // The backend supports comma-separated statuses via the in-operator
        params = { riderId: user.id };
      } else {
        // assigned to me and delivered
        params = { riderId: user.id, status: "DELIVERED" };
      }

      const res = await api.get("/kiosk/shop/orders/available", { params });
      setOrders(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load orders");
    } finally {
      setOrdersLoading(false);
    }
  };

  const initData = async () => {
    setLoading(true);
    const p = await fetchProfile();
    await fetchStates();
    if (p) {
      await fetchAnalytics(p);
      if (p.isApproved) {
        await fetchOrders(activeTab);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    if (profile?.isApproved) {
      fetchOrders(activeTab);
    }
  }, [activeTab, profile]);

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!stateId) {
      toast.error("Please select a state to operate in");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("vehicleType", vehicleType);
      fd.append("stateId", stateId);
      if (plateNumber) fd.append("plateNumber", plateNumber);
      if (licenseNumber) fd.append("licenseNumber", licenseNumber);
      if (vehicleDoc) fd.append("vehicleDocument", vehicleDoc);
      if (licenseDoc) fd.append("licenseDocument", licenseDoc);

      await api.post("/rider/profile", fd);
      toast.success(isEditing ? "Rider application updated successfully!" : "Rider application submitted successfully!");
      const p = await fetchProfile();
      if (p) {
        await fetchAnalytics(p);
      }
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    const p = await fetchProfile();
    if (p) {
      await fetchAnalytics(p);
      await fetchOrders(activeTab);
    }
  };

  const startEditing = () => {
    if (profile) {
      setVehicleType(profile.vehicleType || "MOTORCYCLE");
      setPlateNumber(profile.plateNumber || "");
      setLicenseNumber(profile.licenseNumber || "");
      setStateId(profile.state?.id || "");
      setVehicleDoc(null);
      setLicenseDoc(null);
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="rider-wrapper">
        <div className="rider-skeleton-header animate-pulse" />
        <div className="rider-skeleton-grid animate-pulse" style={{ marginTop: 24 }} />
        <div className="rider-skeleton-body animate-pulse" style={{ marginTop: 24 }} />
      </div>
    );
  }

  // State 1: Onboarding (No profile created) or Editing Pending Profile
  if (!profile || isEditing) {
    return (
      <div className="rider-wrapper">
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 18,
            padding: 24,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: "var(--bg-active)",
                border: "1px solid rgba(99,102,241,0.2)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MdDirectionsBike size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  color: "var(--text-heading)",
                }}
              >
                {isEditing ? "Update Rider Application" : "Apply as a Delivery Rider"}
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                {isEditing 
                  ? "Update your operating details and vehicle/license credentials."
                  : "Register your vehicle details to start picking up and delivering orders from local kiosks."}
              </div>
            </div>
          </div>

          <form onSubmit={handleOnboardSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-field">
              <label className="modal-label">Select Operating State *</label>
              <select
                className="modal-input"
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                required
              >
                <option value="">Choose operating state...</option>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.country ? ` — ${s.country}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="modal-label">Vehicle Type *</label>
              <select
                className="modal-input"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                required
              >
                {VEHICLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-field">
                <label className="modal-label">Vehicle Plate Number</label>
                <input
                  className="modal-input"
                  placeholder="e.g. LA-123-ENG"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="modal-label">Driver License Number</label>
                <input
                  className="modal-input"
                  placeholder="e.g. ABC12345XYZ"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FileInput
                label="Vehicle Registration Document"
                accept="image/*,application/pdf"
                currentUrl={isEditing ? profile?.vehicleDocument : null}
                onChange={setVehicleDoc}
                hint="PDF or image"
              />
              <FileInput
                label="Driver License Document"
                accept="image/*,application/pdf"
                currentUrl={isEditing ? profile?.licenseDocument : null}
                onChange={setLicenseDoc}
                hint="PDF or image"
              />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {isEditing && (
                <button
                  type="button"
                  className="app_btn app_btn_cancel"
                  style={{ flex: 1, height: 42 }}
                  onClick={handleCancelEdit}
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                className={`app_btn app_btn_confirm${submitting ? " btn_loading" : ""}`}
                style={{ flex: 1, height: 42, position: "relative" }}
                disabled={submitting}
              >
                <span className="btn_text">{isEditing ? "Update Application" : "Submit Rider Application"}</span>
                {submitting && (
                  <span className="btn_loader" style={{ width: 14, height: 14 }} />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // State 2: Profile is Pending Admin Approval
  if (!profile.isApproved) {
    return (
      <div className="rider-pending-container">
        <div className="rider-pending-card">
          <div className="rider-pending-header">
            <div className="rider-pending-badge">
              <span className="pulse-dot" />
              Under Review
            </div>
            <h2 className="rider-pending-title">Application Submitted</h2>
            <p className="rider-pending-subtitle">
              Your courier application is currently under review by our operations team.
              We will notify you once your account has been verified.
            </p>
          </div>

          {/* Stepper Timeline */}
          <div className="rider-timeline">
            <div className="rider-timeline-step completed">
              <div className="rider-step-node">
                <MdCheck size={18} />
              </div>
              <span className="rider-step-label">Apply</span>
              <span className="rider-step-desc">Form submitted</span>
            </div>
            <div className="rider-timeline-step active">
              <div className="rider-step-node">
                <MdAccessTime size={18} />
              </div>
              <span className="rider-step-label">Review</span>
              <span className="rider-step-desc">Document verification</span>
            </div>
            <div className="rider-timeline-step">
              <div className="rider-step-node">3</div>
              <span className="rider-step-label">Activate</span>
              <span className="rider-step-desc">Start earning</span>
            </div>
          </div>

          {/* Submitted Info Grid */}
          <div className="rider-review-details">
            <div className="rider-review-sec">
              <h4 className="rider-review-sectitle">Application Details</h4>
              <div className="rider-review-info-list">
                <div className="rider-review-info-item">
                  <span className="rider-review-label">Operating State</span>
                  <span className="rider-review-value">{profile.state?.name || "—"}</span>
                </div>
                <div className="rider-review-info-item">
                  <span className="rider-review-label">Vehicle Type</span>
                  <span className="rider-review-value">
                    {profile.vehicleType === "MOTORCYCLE" ? "Motorcycle / Dispatch Rider" :
                     profile.vehicleType === "BICYCLE" ? "Bicycle / Bicycle Courier" :
                     profile.vehicleType === "CAR" ? "Car / Vehicle Delivery" : profile.vehicleType}
                  </span>
                </div>
                {profile.plateNumber && (
                  <div className="rider-review-info-item">
                    <span className="rider-review-label">Plate Number</span>
                    <span className="rider-review-value">{profile.plateNumber}</span>
                  </div>
                )}
                {profile.licenseNumber && (
                  <div className="rider-review-info-item">
                    <span className="rider-review-label">Driver License Number</span>
                    <span className="rider-review-value">{profile.licenseNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rider-review-sec">
              <h4 className="rider-review-sectitle">Uploaded Documents</h4>
              <div className="rider-doc-cards">
                {profile.vehicleDocument ? (
                  <a
                    href={profile.vehicleDocument}
                    target="_blank"
                    rel="noreferrer"
                    className="rider-doc-card"
                  >
                    <div className="rider-doc-icon">
                      <MdLocalShipping size={16} />
                    </div>
                    <div className="rider-doc-meta">
                      <span className="rider-doc-name">Vehicle Reg. Doc</span>
                      <span className="rider-doc-action">View Document →</span>
                    </div>
                  </a>
                ) : (
                  <div className="rider-doc-card" style={{ opacity: 0.5, cursor: "default" }}>
                    <div className="rider-doc-icon" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}>
                      <MdLocalShipping size={16} />
                    </div>
                    <div className="rider-doc-meta">
                      <span className="rider-doc-name" style={{ color: "var(--text-muted)" }}>Vehicle Reg. Doc</span>
                      <span className="rider-doc-action" style={{ color: "var(--text-muted)" }}>Not Provided</span>
                    </div>
                  </div>
                )}

                {profile.licenseDocument ? (
                  <a
                    href={profile.licenseDocument}
                    target="_blank"
                    rel="noreferrer"
                    className="rider-doc-card"
                  >
                    <div className="rider-doc-icon">
                      <MdPerson size={16} />
                    </div>
                    <div className="rider-doc-meta">
                      <span className="rider-doc-name">Driver's License</span>
                      <span className="rider-doc-action">View Document →</span>
                    </div>
                  </a>
                ) : (
                  <div className="rider-doc-card" style={{ opacity: 0.5, cursor: "default" }}>
                    <div className="rider-doc-icon" style={{ background: "rgba(255,255,255,0.05)", color: "var(--text-muted)" }}>
                      <MdPerson size={16} />
                    </div>
                    <div className="rider-doc-meta">
                      <span className="rider-doc-name" style={{ color: "var(--text-muted)" }}>Driver's License</span>
                      <span className="rider-doc-action" style={{ color: "var(--text-muted)" }}>Not Provided</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, width: "100%", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="rider-refresh-btn-glowing"
              onClick={startEditing}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              <MdPerson size={18} />
              <span>Edit Application</span>
            </button>

            <button
              className={`rider-refresh-btn-glowing${checkingStatus ? " refreshing" : ""}`}
              onClick={async () => {
                setCheckingStatus(true);
                await handleRefresh();
                setCheckingStatus(false);
              }}
              disabled={checkingStatus}
            >
              <MdHistory size={18} />
              <span>{checkingStatus ? "Checking status..." : "Check Status"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Approved & Operational Dashboard
  const activeCount = analytics?.stats?.activeCount || 0;
  const totalCompleted = analytics?.stats?.totalCompleted || 0;
  const totalEarnings = analytics?.stats?.totalEarnings || 0;
  const formattedEarnings = totalEarnings.toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

  return (
    <div className="rider-wrapper">
      {/* Dashboard Stats */}
      <div className="rider-stats-grid">
        <div className="rider-stat-card">
          <div className="rider-stat-icon-wrapper earnings">
            <MdAttachMoney size={22} />
          </div>
          <div className="rider-stat-body">
            <span className="rider-stat-label">Total Earnings</span>
            <span className="rider-stat-val">{formattedEarnings}</span>
          </div>
        </div>

        <div className="rider-stat-card">
          <div className="rider-stat-icon-wrapper deliveries">
            <MdCheck size={22} />
          </div>
          <div className="rider-stat-body">
            <span className="rider-stat-label">Completed Deliveries</span>
            <span className="rider-stat-val">{totalCompleted}</span>
          </div>
        </div>

        <div className="rider-stat-card">
          <div className="rider-stat-icon-wrapper active">
            <MdLocalShipping size={22} />
          </div>
          <div className="rider-stat-body">
            <span className="rider-stat-label">Active Deliveries</span>
            <span className="rider-stat-val">{activeCount}</span>
          </div>
        </div>
      </div>

      {/* Orders Segment */}
      <div className="rider-section">
        <div className="rider-section-header">
          <h3 className="rider-section-title">Delivery Job Board</h3>
          <button className="rider-refresh-indicator" onClick={handleRefresh}>Refresh List</button>
        </div>

        {/* Tab Buttons */}
        <div className="rider-tabs">
          <button
            className={`rider-tab ${activeTab === "available" ? "active" : ""}`}
            onClick={() => setActiveTab("available")}
          >
            Available Jobs
          </button>
          <button
            className={`rider-tab ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active Deliveries ({activeCount})
          </button>
          <button
            className={`rider-tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            Delivery History ({totalCompleted})
          </button>
        </div>

        {/* Orders Listing */}
        {ordersLoading ? (
          <div className="rider-orders-loading">
            <div className="rider-spinner" />
            <span>Loading orders board...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="rider-empty-state">
            <MdDeliveryDining size={36} className="rider-empty-icon" />
            <span className="rider-empty-title">
              {activeTab === "available" ? "No Available Deliveries" :
               activeTab === "active" ? "No Active Assignments" :
               "No Completed Deliveries"}
            </span>
            <p className="rider-empty-desc">
              {activeTab === "available" ? "Kiosk orders that are prepared and ready for dispatch will appear here. Refresh to check again." :
               activeTab === "active" ? "Deliveries you accept will appear here. Pick up the packages and mark them delivered." :
               "Once you deliver and complete orders, your courier history will grow here."}
            </p>
          </div>
        ) : (
          <div className="rider-orders-list">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                activeTab={activeTab}
                onActionRefresh={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
