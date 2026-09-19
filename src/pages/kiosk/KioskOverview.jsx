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
  MdContentCopy,
  MdRefresh,
  MdVolumeUp,
  MdVolumeOff,
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
function LiveStreamModal({ cart, onClose }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const defaultCameras = [
    // { id: "cam-1", name: "Main Camera", ip: "192.168.1.100", port: 554, username: "admin", password: "#code1409", channel: 101, streamType: "both" }
    // { id: "cam-1", name: "Main Camera", ip: "105.117.8.158", port: 554, username: "aabnpi", password: "#Code1409", channel: 101, streamType: "both" }
  ];

  const cameras = cart?.cameras || defaultCameras;
  const [selectedCam, setSelectedCam] = useState(cameras[0] || null);
  const [integrationMode, setIntegrationMode] = useState("rtsp"); // "rtsp" | "hikvision"
  const [connectionStatus, setConnectionStatus] = useState("connecting"); // "connecting" | "connected" | "error"
  const [isMuted, setIsMuted] = useState(true);
  const [timeStr, setTimeStr] = useState("");

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

  // Simulate camera loading on camera switch
  useEffect(() => {
    if (!selectedCam) return;
    setConnectionStatus("connecting");
    const timer = setTimeout(() => {
      setConnectionStatus("connected");
    }, 800);
    return () => clearTimeout(timer);
  }, [selectedCam, integrationMode]);

  // Real-time ticking timestamp
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTimeStr(now.toISOString().replace("T", " ").substring(0, 19));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const rtspUrl = selectedCam
    // ? `rtsp://${selectedCam.username}:${selectedCam.password}@${selectedCam.ip}:${selectedCam.port}/Streaming/Channels/${selectedCam.channel}`
    ? `rtsp://${encodeURIComponent(selectedCam.username)}:${encodeURIComponent(selectedCam.password)}@${selectedCam.ip}:${selectedCam.port}/Streaming/Channels/${selectedCam.channel}`
    : "";

  const handleCopyRtsp = () => {
    navigator.clipboard.writeText(rtspUrl);
    toast.success("RTSP URL copied to clipboard!");
  };

  const getGo2RtcUrl = () => {
    try {
      const url = new URL(import.meta.env.VITE_API_BASE_URL);
      url.port = "1984";
      url.pathname = "/stream.html";
      return url.toString();
    } catch {
      return "http://localhost:1984/stream.html";
    }
  };

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
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)",
        }}
      />
      <div
        ref={containerRef}
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(880px, 95vw)",
          background: "var(--modal-bg)",
          border: "1px solid var(--modal-border)",
          borderRadius: isFullscreen ? 0 : 20,
          overflow: "hidden",
          boxShadow: "var(--modal-shadow)",
          backdropFilter: "blur(20px)",
          display: "flex",
          flexDirection: "column",
          maxHeight: isFullscreen ? "100vh" : "90vh",
          transition: "all 0.3s ease",
          ...(isFullscreen ? { width: "100vw", height: "100vh" } : {}),
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 24px",
            borderBottom: "1px solid var(--border)",
            background: "rgba(0, 0, 0, 0.03)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MdVideocam size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-heading)" }}>
              Kitchen Live Feed
            </div>
            <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>Unit: {cart?.serialNumber || "Kitchen Feed"}</span>
              <span>•</span>
              <span style={{ color: "#16a34a", fontWeight: 700 }}>
                {cameras.length} Camera{cameras.length > 1 ? "s" : ""} Available
              </span>
            </div>
          </div>

          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              transition: "all 0.2s",
            }}
          >
            {isFullscreen ? "⤡" : "⤢"}
          </button>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              transition: "all 0.2s",
            }}
          >
            <MdClose size={16} />
          </button>
        </div>

        {/* Outer Split Layout */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", flexDirection: "column" }}>
          {/* Main Display Frame */}
          <div
            style={{
              position: "relative",
              background: "#080808",
              aspectRatio: isFullscreen ? "auto" : "16/9",
              flex: isFullscreen ? 1 : "0 0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* Grid scanline overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 6px)",
                pointerEvents: "none",
                zIndex: 2,
              }}
            />

            {/* Real Live Feed using go2rtc WebRTC/MSE player */}
            {connectionStatus === "connected" && selectedCam && (
              <div style={{ position: "absolute", inset: 0, background: "#000" }}>
                <iframe
                  src={`${getGo2RtcUrl()}?src=${encodeURIComponent(rtspUrl)}&mode=webrtc,mse`}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: "none",
                    background: "#000",
                  }}
                  allowFullScreen
                  scrolling="no"
                />
              </div>
            )}

            {/* Loading Overlay */}
            {connectionStatus === "connecting" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, zIndex: 5 }}>
                <span className="btn_loader" style={{ width: 28, height: 28, borderColor: "var(--accent)" }} />
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.05em" }}>
                  NEGOTIATING {integrationMode.toUpperCase()} HANDSHAKE...
                </span>
              </div>
            )}

            {/* Live Indicator overlay */}
            {connectionStatus === "connected" && (
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 8px",
                  background: "rgba(0,0,0,0.6)",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.15)",
                  zIndex: 3,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#ef4444",
                    display: "inline-block",
                  }}
                  className="pulse-node"
                />
                <span style={{ fontSize: "0.62rem", color: "#fff", fontWeight: 800, letterSpacing: "0.05em" }}>
                  LIVE
                </span>
              </div>
            )}

            {/* Time / Stats Overlay */}
            {connectionStatus === "connected" && selectedCam && (
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 4,
                  padding: "6px 10px",
                  background: "rgba(0,0,0,0.6)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: "0.62rem",
                  fontFamily: "monospace",
                  color: "rgba(255,255,255,0.8)",
                  zIndex: 3,
                }}
              >
                <div>{timeStr || "2026-07-07 10:00:00"}</div>
                <div style={{ color: "#10b981", fontSize: "0.58rem" }}>
                  1080P @ 25FPS · H.264
                </div>
              </div>
            )}

            {/* Player Controls Bar */}
            {connectionStatus === "connected" && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  insetInline: 0,
                  background: "linear-gradient(0deg, rgba(0,0,0,0.85), transparent)",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  zIndex: 3,
                }}
              >
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "rgba(255,255,255,0.7)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {isMuted ? <MdVolumeOff size={16} /> : <MdVolumeUp size={16} />}
                  </button>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", alignSelf: "center" }}>
                    Camera: {selectedCam?.name} ({selectedCam?.ip})
                  </span>
                </div>

                <button
                  onClick={() => {
                    setConnectionStatus("connecting");
                    setTimeout(() => setConnectionStatus("connected"), 600);
                  }}
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    borderRadius: 6,
                    color: "#fff",
                    padding: "4px 10px",
                    fontSize: "0.65rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <MdRefresh size={12} /> Reconnect
                </button>
              </div>
            )}
          </div>

          {/* Bottom Settings & Camera switcher */}
          <div
            style={{
              padding: 20,
              background: "var(--modal-bg)",
              borderTop: "1px solid var(--border)",
              flex: 1,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {/* Top row: Camera list switcher */}
            <div>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)", marginBottom: 8 }}>
                Select Camera
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {cameras.map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => setSelectedCam(cam)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: selectedCam?.id === cam.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                      background: selectedCam?.id === cam.id ? "var(--bg-active)" : "var(--bg-hover)",
                      color: selectedCam?.id === cam.id ? "var(--accent)" : "var(--text-body)",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: selectedCam?.id === cam.id ? "#ef4444" : "var(--text-muted)",
                        display: "inline-block",
                      }}
                    />
                    {cam.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Grid: Left side Integration switcher, Right side mode details */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              {/* Integration column */}
              <div>
                <div style={{ fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)", marginBottom: 8 }}>
                  Integration Mode
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    { mode: "rtsp", title: "RTSP Stream Template", desc: "Native network stream URL template" },
                    { mode: "hikvision", title: "Hikvision Web SDK", desc: "Interactive PTZ browser interface" },
                  ].map((item) => (
                    <button
                      key={item.mode}
                      onClick={() => setIntegrationMode(item.mode)}
                      style={{
                        padding: 10,
                        borderRadius: 10,
                        border: integrationMode === item.mode ? "1px solid var(--accent)" : "1px solid var(--border)",
                        background: integrationMode === item.mode ? "var(--bg-active)" : "var(--bg-card)",
                        color: "var(--text-body)",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ fontSize: "0.78rem", fontWeight: 800, color: integrationMode === item.mode ? "var(--accent)" : "var(--text-heading)", marginBottom: 2 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode specifications column */}
              <div style={{ background: "rgba(0,0,0,0.015)", padding: 14, borderRadius: 12, border: "1px solid var(--border)" }}>
                {integrationMode === "rtsp" ? (
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-heading)", marginBottom: 6 }}>
                      RTSP Link Generator
                    </div>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", lineHeight: 1.4, margin: "0 0 10px 0" }}>
                      Direct stream address containing device credentials. Open this stream in VLC or pass it to an NVR transcoder service.
                    </p>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        background: "var(--bg-hover)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: "8px 12px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontFamily: "monospace",
                          color: "var(--text-body)",
                          wordBreak: "break-all",
                          flex: 1,
                        }}
                      >
                        {rtspUrl}
                      </span>
                      <button
                        onClick={handleCopyRtsp}
                        title="Copy RTSP URL"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          padding: 4,
                        }}
                      >
                        <MdContentCopy size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-heading)" }}>
                        Hikvision Web SDK / PTZ Controls
                      </span>
                      <span style={{ fontSize: "0.65rem", padding: "2px 6px", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 4, color: "#10b981", fontWeight: 800 }}>
                        Active
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
                      {/* PTZ Pad simulation */}
                      <div>
                        <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
                          PTZ Direction Pad
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 30px)", gap: 4, justifyContent: "center", padding: 6, background: "var(--bg-hover)", borderRadius: 10, width: "fit-content" }}>
                          <div />
                          <button onClick={() => toast.info("PTZ: Pan Up")} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>▲</button>
                          <div />
                          <button onClick={() => toast.info("PTZ: Pan Left")} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>◀</button>
                          <div style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800 }}>PTZ</div>
                          <button onClick={() => toast.info("PTZ: Pan Right")} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>▶</button>
                          <div />
                          <button onClick={() => toast.info("PTZ: Pan Down")} style={{ width: 30, height: 30, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>▼</button>
                          <div />
                        </div>
                      </div>

                      {/* PTZ Zoom/Focus controls */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div>
                          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>
                            PTZ Zoom
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => toast.info("PTZ: Zoom In")} style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: "0.7rem", cursor: "pointer", fontWeight: 700 }}>Zoom +</button>
                            <button onClick={() => toast.info("PTZ: Zoom Out")} style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: "0.7rem", cursor: "pointer", fontWeight: 700 }}>Zoom -</button>
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: 4 }}>
                            PTZ Focus
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => toast.info("PTZ: Focus In")} style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: "0.7rem", cursor: "pointer", fontWeight: 700 }}>Focus +</button>
                            <button onClick={() => toast.info("PTZ: Focus Out")} style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-card)", fontSize: "0.7rem", cursor: "pointer", fontWeight: 700 }}>Focus -</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
        <LiveStreamModal cart={cart} onClose={() => setShowLiveStream(false)} />
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
