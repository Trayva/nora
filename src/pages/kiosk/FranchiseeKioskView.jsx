import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  MdStorefront,
  MdOutlineKitchen,
  MdCloud,
  MdLocationOn,
  MdAttachMoney,
  MdOutlineAssignment,
  MdVideocam,
  MdOutlineAssessment,
  MdGavel,
  MdWarning,
  MdCheckCircle,
  MdCancel,
  MdLock,
  MdLockOpen,
  MdWifi,
  MdWifiOff,
  MdRefresh,
  MdPerson,
  MdEmail,
  MdReceiptLong,
  MdTrendingUp,
  MdFullscreen,
  MdFullscreenExit,
  MdVolumeUp,
  MdVolumeOff,
  MdSend,
  MdInfoOutline,
  MdAccessTime,
  MdOpenInNew,
} from "react-icons/md";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import api from "../../api/axios";
import Tabs from "../../components/Tabs";
import Modal from "../../components/Modal";
import useCurrencyDisplay from "../../hooks/useCurrencyDisplay";
import KioskTasks from "./KioskTasks";
import KioskReports from "./KioskReports";

const BRAND_DRAWER_TABS = [
  { key: "overview", label: "Format & Status", icon: MdStorefront },
  { key: "sales", label: "Sales & Royalty", icon: MdAttachMoney },
  { key: "tasks", label: "SOPs Compliance", icon: MdOutlineAssignment },
  { key: "inspection", label: "Live Inspection", icon: MdVideocam },
  { key: "reports", label: "Reports", icon: MdOutlineAssessment },
  { key: "actions", label: "Franchise Actions", icon: MdGavel },
];

export default function FranchiseeKioskView({ cart, onUpdate, onRefresh }) {
  const { format: fmtCurrency } = useCurrencyDisplay();
  const kioskCurrency = cart?.location?.state?.currency || cart?.currency || "NGN";

  const [activeTab, setActiveTab] = useState("overview");

  // Sales & Royalty state
  const [salesLoading, setSalesLoading] = useState(false);
  const [salesList, setSalesList] = useState([]);
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [royaltyPercent, setRoyaltyPercent] = useState(15); // default fallback
  const [salesPreset, setSalesPreset] = useState("30d");

  // Live Inspection state
  const defaultCameras = [
    { id: "cam-prep", name: "Kitchen Prep Station", ip: "192.168.1.101", channel: 101, streamType: "rtsp" },
    { id: "cam-front", name: "Front Order Counter", ip: "192.168.1.102", channel: 102, streamType: "rtsp" },
    { id: "cam-storage", name: "Cold Storage & Stock", ip: "192.168.1.103", channel: 103, streamType: "rtsp" },
  ];
  const cameras = cart?.cameras && cart.cameras.length > 0 ? cart.cameras : defaultCameras;
  const [selectedCam, setSelectedCam] = useState(cameras[0]);
  const [isLiveMuted, setIsLiveMuted] = useState(true);
  const [inspectionTime, setInspectionTime] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [inspectionSubmitting, setInspectionSubmitting] = useState(false);
  const [inspectionChecklist, setInspectionChecklist] = useState({
    hygiene: true,
    uniforms: true,
    tempLog: true,
    brandStandards: true,
  });

  // Action / Governance state
  const [warningReason, setWarningReason] = useState("SOP Non-Compliance");
  const [warningSeverity, setWarningSeverity] = useState("WARNING");
  const [warningNotes, setWarningNotes] = useState("");
  const [submittingWarning, setSubmittingWarning] = useState(false);

  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminateReason, setTerminateReason] = useState("");
  const [terminateNotes, setTerminateNotes] = useState("");
  const [terminating, setTerminating] = useState(false);

  // Fetch sales & royalty data
  useEffect(() => {
    if (!cart?.id) return;
    const fetchSalesAndRoyalty = async () => {
      setSalesLoading(true);
      try {
        const [salesRes, analyticsRes, formulaRes] = await Promise.allSettled([
          api.get(`/kiosk/sale?kioskId=${cart.id}&limit=50`),
          api.get(`/kiosk/sale/analytics?kioskId=${cart.id}`),
          api.get("/kiosk/sales-formula"),
        ]);

        if (salesRes.status === "fulfilled") {
          const items = Array.isArray(salesRes.value.data?.data)
            ? salesRes.value.data.data
            : salesRes.value.data?.data?.items || [];
          setSalesList(items);
        }

        if (analyticsRes.status === "fulfilled") {
          setSalesAnalytics(analyticsRes.value.data?.data || null);
        }

        if (formulaRes.status === "fulfilled") {
          const formulas = formulaRes.value.data?.data || [];
          const matched = formulas.find((f) => f.vendorId === (cart.vendorId || cart.currentVendorId)) ||
            formulas.find((f) => !f.vendorId);
          if (matched && matched.vendorPercent) {
            setRoyaltyPercent(matched.vendorPercent);
          }
        }
      } catch (err) {
        console.error("Failed to load franchisee sales:", err);
      } finally {
        setSalesLoading(false);
      }
    };

    fetchSalesAndRoyalty();
  }, [cart?.id]);

  // Live timer for camera inspection
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setInspectionTime(now.toTimeString().split(" ")[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format details helper
  const outletFormatName =
    cart.kitchenType === "CLOUD" || cart.outletType === "CLOUD_KITCHEN" || cart.outletType === "CLOUD"
      ? "Cloud Kitchen"
      : cart.kitchenType === "STORE_FRONT" || cart.outletType === "STORE_FRONT"
      ? "Store Front"
      : "Physical Kiosk";

  const outletFormatIcon =
    cart.kitchenType === "CLOUD" || cart.outletType === "CLOUD_KITCHEN" || cart.outletType === "CLOUD" ? (
      <MdCloud size={20} color="#6366f1" />
    ) : cart.kitchenType === "STORE_FRONT" || cart.outletType === "STORE_FRONT" ? (
      <MdStorefront size={20} color="#06b6d4" />
    ) : (
      <MdOutlineKitchen size={20} color="#16a34a" />
    );

  // Issue Warning handler
  const handleIssueWarning = async (e) => {
    e?.preventDefault();
    if (!warningNotes.trim()) {
      return toast.error("Please provide warning details or required remediation notes.");
    }
    setSubmittingWarning(true);
    try {
      await api.post(`/kiosk/${cart.id}/issue-warning`, {
        reason: warningReason,
        severity: warningSeverity,
        notes: warningNotes.trim(),
      });
      toast.success("Franchisee warning issued and owner notified.");
      setWarningNotes("");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to issue warning");
    } finally {
      setSubmittingWarning(false);
    }
  };

  // Terminate Franchise handler
  const handleTerminateFranchise = async () => {
    if (!terminateReason.trim()) {
      return toast.error("Please provide a reason for franchise termination.");
    }
    setTerminating(true);
    try {
      const res = await api.post(`/kiosk/${cart.id}/terminate-franchise`, {
        reason: terminateReason.trim(),
        notes: terminateNotes.trim(),
      });
      toast.success("Franchise agreement terminated successfully.");
      setShowTerminateModal(false);
      if (onUpdate) onUpdate(res.data.data);
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to terminate franchise");
    } finally {
      setTerminating(false);
    }
  };

  // Submit Inspection Note
  const handleSubmitInspection = async () => {
    if (!inspectionNotes.trim()) {
      return toast.error("Please add inspection notes before submitting.");
    }
    setInspectionSubmitting(true);
    try {
      const checks = Object.entries(inspectionChecklist)
        .map(([k, v]) => `${k}: ${v ? "PASS" : "FAIL"}`)
        .join(", ");
      await api.post(`/kiosk/${cart.id}/issue-warning`, {
        reason: "Routine Brand Inspection Log",
        severity: "INSPECTION",
        notes: `Inspection checklist [${checks}] - Notes: ${inspectionNotes.trim()}`,
      });
      toast.success("Inspection log recorded successfully.");
      setInspectionNotes("");
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit inspection log");
    } finally {
      setInspectionSubmitting(false);
    }
  };

  // Calculations for Sales & Royalty
  const totalRevenue = salesAnalytics?.totalRevenue || salesList.reduce((acc, s) => acc + (Number(s.total) || 0), 0);
  const totalOrders = salesAnalytics?.totalSales || salesList.length;
  const brandRoyaltyEarned = totalRevenue * (Number(royaltyPercent) / 100);

  // Prepare chart data from salesList
  const chartData = [...salesList]
    .slice(0, 14)
    .reverse()
    .map((s) => ({
      date: new Date(s.createdAt || s.saleDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      revenue: Number(s.total) || 0,
      royalty: (Number(s.total) || 0) * (Number(royaltyPercent) / 100),
    }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Drawer Sub-Tabs */}
      <Tabs
        tabs={BRAND_DRAWER_TABS}
        className="borderless"
        activeTab={activeTab}
        onChange={setActiveTab}
        style={{
          margin: "-20px -24px 20px",
          borderRadius: 0,
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
        }}
      />

      {/* ── TAB 1: FORMAT, STATUS & LOCATION ── */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Operating Status Banner */}
          <div
            style={{
              padding: "16px",
              borderRadius: "14px",
              background:
                cart.status === "ACTIVE"
                  ? "rgba(34,197,94,0.06)"
                  : cart.status === "SUSPENDED"
                  ? "rgba(239,68,68,0.06)"
                  : "rgba(107,114,128,0.06)",
              border:
                cart.status === "ACTIVE"
                  ? "1px solid rgba(34,197,94,0.2)"
                  : cart.status === "SUSPENDED"
                  ? "1px solid rgba(239,68,68,0.2)"
                  : "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)", marginBottom: 4 }}>
                Outlet Operational Status
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    color: cart.status === "ACTIVE" ? "#16a34a" : cart.status === "SUSPENDED" ? "#ef4444" : "#6b7280",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: cart.status === "ACTIVE" ? "#22c55e" : cart.status === "SUSPENDED" ? "#ef4444" : "#9ca3af",
                    }}
                  />
                  {cart.status || "ACTIVE"}
                </span>
                <span style={{ color: "var(--border)" }}>|</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Operating: {cart.operatingHours || "08:00 - 22:00"} ({cart.operatingDays || "Mon - Sun"})
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: cart.isOnline ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                  color: cart.isOnline ? "#16a34a" : "#ef4444",
                  border: `1px solid ${cart.isOnline ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
                }}
              >
                {cart.isOnline ? <MdWifi size={13} /> : <MdWifiOff size={13} />}
                {cart.isOnline ? "Online" : "Offline"}
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: cart.isLocked ? "rgba(234,179,8,0.12)" : "rgba(59,130,246,0.12)",
                  color: cart.isLocked ? "#ca8a04" : "#2563eb",
                  border: `1px solid ${cart.isLocked ? "rgba(234,179,8,0.25)" : "rgba(59,130,246,0.25)"}`,
                }}
              >
                {cart.isLocked ? <MdLock size={12} /> : <MdLockOpen size={12} />}
                {cart.isLocked ? "Locked" : "Unlocked"}
              </span>
            </div>
          </div>

          {/* Format Card */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "var(--bg-active)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {outletFormatIcon}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>Outlet Format</h4>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Architecture & specifications
                  </p>
                </div>
              </div>

              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  padding: "4px 12px",
                  borderRadius: 20,
                  background: "var(--bg-active)",
                  color: "var(--accent)",
                  border: "1px solid rgba(203,108,220,0.3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {outletFormatName}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              <div style={{ background: "var(--bg-hover)", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Kitchen Size / Footprint</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-heading)" }}>
                  {cart.kioskSize
                    ? `${cart.kioskSize.width || 3}m × ${cart.kioskSize.length || 3}m (${(cart.kioskSize.width || 3) * (cart.kioskSize.length || 3)}m²)`
                    : cart.kitchenType === "CLOUD" ? "Cloud Kitchen Bay (25m²)" : "Standard Modular Kiosk (9m²)"}
                </span>
              </div>

              <div style={{ background: "var(--bg-hover)", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Operator Slots</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-heading)" }}>
                  {cart.operators?.length || 0} active / {cart.maxOperatorsAtATime || 2} max
                </span>
              </div>

              <div style={{ background: "var(--bg-hover)", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Brand Royalty Rate</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--accent)" }}>
                  {royaltyPercent}% of Sales
                </span>
              </div>

              <div style={{ background: "var(--bg-hover)", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Serial / Terminal Code</span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-heading)", fontFamily: "monospace" }}>
                  {cart.serialNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(6,182,212,0.1)",
                    color: "#06b6d4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MdLocationOn size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>Assigned Location</h4>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {cart.location?.name || "Premises Address"}
                  </p>
                </div>
              </div>

              {cart.location?.lat && cart.location?.lng && (
                <a
                  href={`https://maps.google.com/?q=${cart.location.lat},${cart.location.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: "0.72rem",
                    color: "var(--accent)",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Maps <MdOpenInNew size={12} />
                </a>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)" }}>Address</span>
                <span style={{ fontWeight: 600, textAlign: "right" }}>
                  {cart.location?.address || cart.location?.name || "Not assigned"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)" }}>State & Region</span>
                <span style={{ fontWeight: 600 }}>
                  {cart.location?.state?.name || cart.location?.state || "N/A"}, {cart.location?.country || "Nigeria"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ color: "var(--text-muted)" }}>Delivery Radius</span>
                <span style={{ fontWeight: 600 }}>
                  {cart.serviceRadius ? `${cart.serviceRadius} km` : "Default (5 km)"}
                </span>
              </div>
            </div>
          </div>

          {/* Franchisee / Owner Details Card */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "var(--bg-active)",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                }}
              >
                {cart.owner?.fullName ? cart.owner.fullName.slice(0, 2).toUpperCase() : <MdPerson size={18} />}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>Franchisee Partner</h4>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Licensed operator of this brand outlet
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)" }}>Partner Name</span>
                <span style={{ fontWeight: 700 }}>{cart.owner?.fullName || "Franchisee"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ color: "var(--text-muted)" }}>Email Address</span>
                <span style={{ fontWeight: 600 }}>{cart.owner?.email || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ color: "var(--text-muted)" }}>Franchise Agreement</span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: "rgba(34,197,94,0.1)",
                    color: "#16a34a",
                  }}
                >
                  {cart.contract?.contractStatus || "ACTIVE LICENSE"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 4 }}>
            <button
              onClick={() => setActiveTab("inspection")}
              style={{
                padding: "10px",
                borderRadius: 10,
                background: "var(--bg-active)",
                border: "1px solid rgba(203,108,220,0.3)",
                color: "var(--accent)",
                fontWeight: 700,
                fontSize: "0.76rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <MdVideocam size={18} />
              <span>Live Inspect</span>
            </button>

            <button
              onClick={() => setActiveTab("sales")}
              style={{
                padding: "10px",
                borderRadius: 10,
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                color: "var(--text-body)",
                fontWeight: 700,
                fontSize: "0.76rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <MdAttachMoney size={18} />
              <span>View Royalty</span>
            </button>

            <button
              onClick={() => setActiveTab("actions")}
              style={{
                padding: "10px",
                borderRadius: 10,
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#ef4444",
                fontWeight: 700,
                fontSize: "0.76rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <MdWarning size={18} />
              <span>Take Action</span>
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: SALES AND THEIR ROYALTY ── */}
      {activeTab === "sales" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Royalty & Revenue Summary Hero */}
          <div
            style={{
              background: "linear-gradient(135deg, rgba(203,108,220,0.12) 0%, rgba(6,182,212,0.08) 100%)",
              border: "1px solid rgba(203,108,220,0.25)",
              borderRadius: "16px",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--accent)" }}>
                  Brand Royalty Share ({royaltyPercent}%)
                </span>
                <h3 style={{ margin: "4px 0 0", fontSize: "1.5rem", fontWeight: 900, color: "var(--text-heading)" }}>
                  {fmtCurrency(brandRoyaltyEarned, kioskCurrency)}
                </h3>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--accent)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(203,108,220,0.3)",
                }}
              >
                <MdAttachMoney size={24} />
              </div>
            </div>

            <p style={{ margin: "0 0 14px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Earned from {totalOrders} orders completed at this franchisee outlet
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, borderTop: "1px solid rgba(203,108,220,0.15)", paddingTop: 12 }}>
              <div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Gross Outlet Sales</span>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-heading)" }}>
                  {fmtCurrency(totalRevenue, kioskCurrency)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Avg Order Value</span>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-heading)" }}>
                  {fmtCurrency(totalOrders > 0 ? totalRevenue / totalOrders : 0, kioskCurrency)}
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          {chartData.length > 0 && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.88rem", fontWeight: 800 }}>Revenue & Royalty Trend</h4>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)" }}>Daily sales performance</p>
                </div>
                <div style={{ display: "flex", gap: 6, fontSize: "0.7rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} /> Royalty
                  </span>
                </div>
              </div>

              <div style={{ height: 180, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="royaltyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#cb6cdc" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#cb6cdc" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} />
                    <Tooltip
                      formatter={(val, name) => [
                        fmtCurrency(val, kioskCurrency),
                        name === "royalty" ? "Brand Royalty" : "Gross Revenue",
                      ]}
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: "0.75rem",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="royalty"
                      stroke="#cb6cdc"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#royaltyGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Recent Orders & Sales Transactions */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontSize: "0.88rem", fontWeight: 800 }}>Recent Transactions</h4>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{salesList.length} total logged</span>
            </div>

            {salesLoading ? (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)" }}>
                Loading sales data...
              </div>
            ) : salesList.length === 0 ? (
              <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                <MdReceiptLong size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: "0.8rem" }}>No sales transactions recorded yet for this outlet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
                {salesList.slice(0, 15).map((sale) => {
                  const saleAmt = Number(sale.total) || 0;
                  const cut = saleAmt * (Number(royaltyPercent) / 100);
                  return (
                    <div
                      key={sale.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: 700 }}>
                            #{sale.orderNumber || sale.id.slice(0, 6).toUpperCase()}
                          </span>
                          <span
                            style={{
                              fontSize: "0.62rem",
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: "rgba(34,197,94,0.1)",
                              color: "#16a34a",
                            }}
                          >
                            {sale.paymentMethod || "PAID"}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                          {new Date(sale.createdAt || sale.saleDate).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-heading)", display: "block" }}>
                          {fmtCurrency(saleAmt, kioskCurrency)}
                        </span>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent)" }}>
                          Royalty: +{fmtCurrency(cut, kioskCurrency)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: SOPS COMPLIANCE ── */}
      {activeTab === "tasks" && (
        <div>
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.2)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <MdCheckCircle size={22} color="#6366f1" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-heading)" }}>
                Brand Standard Operating Procedures (SOPs)
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Monitor hygiene, safety, opening/closing checklists and operator compliance records.
              </div>
            </div>
          </div>

          <KioskTasks cart={cart} />
        </div>
      )}

      {/* ── TAB 4: LIVE VIDEO INSPECTION ── */}
      {activeTab === "inspection" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Camera switcher */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {cameras.map((cam) => {
              const isSelected = selectedCam?.id === cam.id;
              return (
                <button
                  key={cam.id}
                  onClick={() => setSelectedCam(cam)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    border: isSelected ? "1px solid var(--accent)" : "1px solid var(--border)",
                    background: isSelected ? "var(--bg-active)" : "var(--bg-card)",
                    color: isSelected ? "var(--accent)" : "var(--text-body)",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: isSelected ? "#ef4444" : "var(--text-muted)",
                    }}
                  />
                  {cam.name}
                </button>
              );
            })}
          </div>

          {/* Live Video Monitor Frame */}
          <div
            style={{
              position: "relative",
              aspectRatio: "16 / 9",
              background: "#080b11",
              borderRadius: "14px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "14px",
            }}
          >
            {/* Top overlay */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: "0.68rem",
                    fontWeight: 900,
                    padding: "3px 8px",
                    borderRadius: 4,
                    background: "#ef4444",
                    color: "#fff",
                    letterSpacing: "0.05em",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#fff",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                  LIVE INSPECTION
                </span>

                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>
                  {selectedCam?.name}
                </span>
              </div>

              <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#22c55e", fontWeight: 700 }}>
                {inspectionTime || "00:00:00"}
              </div>
            </div>

            {/* Center: Stream Visual Preview */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <MdVideocam size={26} />
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>
                Streaming from {selectedCam?.ip || "RTSP Video Feed"} · CH {selectedCam?.channel || 101}
              </span>
              <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.4)" }}>
                Sub-stream 1080p · 25 FPS · Encrypted Brand Session
              </span>
            </div>

            {/* Bottom Overlay Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 2 }}>
              <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.6)" }}>
                Outlet: {cart.serialNumber} · {outletFormatName}
              </span>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setIsLiveMuted((v) => !v)}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "none",
                    borderRadius: 6,
                    color: "#fff",
                    padding: "4px 8px",
                    cursor: "pointer",
                  }}
                  title={isLiveMuted ? "Unmute" : "Mute"}
                >
                  {isLiveMuted ? <MdVolumeOff size={14} /> : <MdVolumeUp size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Conduct Remote Inspection Logger */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "16px",
            }}
          >
            <h4 style={{ margin: "0 0 4px", fontSize: "0.88rem", fontWeight: 800 }}>
              Record Inspection Audit
            </h4>
            <p style={{ margin: "0 0 12px", fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Submit inspection observations directly to the franchisee's compliance log.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 12 }}>
              {[
                { key: "hygiene", label: "Station Cleanliness" },
                { key: "uniforms", label: "Uniforms & Hairnets" },
                { key: "tempLog", label: "Cold Storage Temp" },
                { key: "brandStandards", label: "Brand Packaging" },
              ].map((item) => (
                <label
                  key={item.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "0.75rem",
                    padding: "8px 10px",
                    background: "var(--bg-hover)",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={inspectionChecklist[item.key]}
                    onChange={(e) =>
                      setInspectionChecklist((prev) => ({
                        ...prev,
                        [item.key]: e.target.checked,
                      }))
                    }
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>

            <textarea
              rows={3}
              placeholder="Enter inspector findings, remarks or corrective feedback..."
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-hover)",
                color: "var(--text-heading)",
                fontSize: "0.78rem",
                resize: "vertical",
                boxSizing: "border-box",
                marginBottom: 10,
              }}
            />

            <button
              onClick={handleSubmitInspection}
              disabled={inspectionSubmitting || !inspectionNotes.trim()}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                background: "var(--accent)",
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: "0.78rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                opacity: inspectionSubmitting || !inspectionNotes.trim() ? 0.6 : 1,
              }}
            >
              <MdSend size={14} />
              {inspectionSubmitting ? "Submitting Log..." : "Log Inspection Audit"}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 5: REPORTS ── */}
      {activeTab === "reports" && (
        <div>
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <MdOutlineAssessment size={22} color="var(--accent)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-heading)" }}>
                Maintenance & Incident Reports
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Audit reports filed by operators, brand supervisors, or technical technicians.
              </div>
            </div>
          </div>

          <KioskReports cart={cart} canUpdateStatus={true} />
        </div>
      )}

      {/* ── TAB 6: GOVERNANCE & TERMINATION ACTIONS ── */}
      {activeTab === "actions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Issue Formal Warning */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(234,179,8,0.1)",
                  color: "#ca8a04",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MdWarning size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>Issue Formal Notice or Warning</h4>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Sends official brand infraction warning to franchisee
                </p>
              </div>
            </div>

            <form onSubmit={handleIssueWarning} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                  Severity Level
                </label>
                <select
                  value={warningSeverity}
                  onChange={(e) => setWarningSeverity(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg-hover)",
                    color: "var(--text-heading)",
                    fontSize: "0.78rem",
                  }}
                >
                  <option value="WARNING">Formal Warning (1st Notice)</option>
                  <option value="SERIOUS_WARNING">Serious Notice (Repeated Infraction)</option>
                  <option value="FINAL_WARNING">Final Warning (Prior to Contract Termination)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                  Infraction Category
                </label>
                <select
                  value={warningReason}
                  onChange={(e) => setWarningReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg-hover)",
                    color: "var(--text-heading)",
                    fontSize: "0.78rem",
                  }}
                >
                  <option value="SOP Non-Compliance">SOP & Operational Checklist Non-Compliance</option>
                  <option value="Food Safety & Hygiene">Food Safety & Hygiene Standard Failure</option>
                  <option value="Unauthorized Menu Items">Selling Unauthorized Items / Altering Recipes</option>
                  <option value="Quality & Packaging Standards">Substandard Quality / Missing Branded Packaging</option>
                  <option value="Operating Hours Violation">Failure to Meet Agreed Operating Hours</option>
                  <option value="Royalty & Payment Delay">Unsettled Invoices / Royalty Default</option>
                  <option value="Other">Other Breach of Franchise Agreement</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>
                  Details & Required Corrective Steps
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Detail the infraction, deadline for remediation, and specific instructions..."
                  value={warningNotes}
                  onChange={(e) => setWarningNotes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg-hover)",
                    color: "var(--text-heading)",
                    fontSize: "0.78rem",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submittingWarning}
                style={{
                  padding: "10px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #ca8a04 0%, #eab308 100%)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  opacity: submittingWarning ? 0.6 : 1,
                }}
              >
                <MdSend size={15} />
                {submittingWarning ? "Dispatching Notice..." : "Issue Formal Warning"}
              </button>
            </form>
          </div>

          {/* Danger Zone: Terminate Franchise */}
          <div
            style={{
              background: "rgba(239,68,68,0.04)",
              border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: "14px",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(239,68,68,0.12)",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MdCancel size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#ef4444" }}>
                  Terminate Franchise Agreement
                </h4>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Revoke brand license and suspend kiosk operations
                </p>
              </div>
            </div>

            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0 0 14px", lineHeight: 1.5 }}>
              Termination immediately marks this outlet as SUSPENDED, locks the terminal, cancels the active contract, and notifies the franchisee partner.
            </p>

            <button
              onClick={() => setShowTerminateModal(true)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                background: "#ef4444",
                color: "#fff",
                border: "none",
                fontWeight: 800,
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <MdCancel size={16} />
              Initiate Franchise Termination
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Termination */}
      <Modal
        isOpen={showTerminateModal}
        onClose={() => setShowTerminateModal(false)}
        title="Confirm Franchise Termination"
      >
        <div style={{ padding: "8px 0" }}>
          <div
            style={{
              padding: "12px",
              borderRadius: 8,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#ef4444",
              fontSize: "0.78rem",
              marginBottom: 14,
            }}
          >
            <strong>Warning:</strong> You are about to permanently terminate the franchise agreement for outlet <strong>{cart.serialNumber}</strong> operated by <strong>{cart.owner?.fullName || "Partner"}</strong>.
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: 4 }}>
              Termination Grounds / Cause
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Repeated failure to comply with food safety standards"
              value={terminateReason}
              onChange={(e) => setTerminateReason(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-hover)",
                color: "var(--text-heading)",
                fontSize: "0.78rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, display: "block", marginBottom: 4 }}>
              Formal Termination Record / Notes
            </label>
            <textarea
              rows={3}
              placeholder="Enter audit references, legal clauses, or inventory return conditions..."
              value={terminateNotes}
              onChange={(e) => setTerminateNotes(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-hover)",
                color: "var(--text-heading)",
                fontSize: "0.78rem",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              onClick={() => setShowTerminateModal(false)}
              disabled={terminating}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--text-body)",
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleTerminateFranchise}
              disabled={terminating || !terminateReason.trim()}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#ef4444",
                color: "#fff",
                fontSize: "0.78rem",
                fontWeight: 800,
                cursor: "pointer",
                opacity: terminating || !terminateReason.trim() ? 0.6 : 1,
              }}
            >
              {terminating ? "Terminating..." : "Confirm & Terminate"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
