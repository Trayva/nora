import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useTheme } from "../../contexts/ThemeContext";
import nora_logo_white from "../../assets/nora_white.png";
import nora_logo_dark from "../../assets/nora_dark.png";
import {
  MdDevices,
  MdStorefront,
  MdCheckCircle,
  MdOutlineDelete,
  MdRefresh,
  MdArrowForward,
  MdLocationOn,
  MdRestaurantMenu,
  MdOutlineLightMode,
  MdOutlineDarkMode,
  MdInfoOutline,
} from "react-icons/md";
UUID
const STORAGE_KEY = "nora_device_kiosk_id";

export default function KioskDeviceSetup() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  const [savedId, setSavedId] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [kioskIdInput, setKioskIdInput] = useState("");
  const [kioskDetails, setKioskDetails] = useState(null);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Fetch verified kiosk details if one is saved
  useEffect(() => {
    if (!savedId) {
      setKioskDetails(null);
      return;
    }

    setLoadingCurrent(true);
    api
      .get(`/kiosk/shop/kiosk/${savedId}`)
      .then((res) => {
        setKioskDetails(res.data?.data || null);
      })
      .catch((err) => {
        console.error("Failed to fetch saved kiosk info", err);
        setKioskDetails(null);
      })
      .finally(() => setLoadingCurrent(false));
  }, [savedId]);

  const handleSaveKiosk = async (e) => {
    e?.preventDefault?.();
    const id = kioskIdInput.trim();
    if (!id) {
      toast.error("Please enter a valid Outlet ID or Serial Number");
      return;
    }

    setVerifying(true);
    try {
      const res = await api.get(`/kiosk/shop/kiosk/${encodeURIComponent(id)}`);
      const data = res.data?.data;
      if (!data) {
        throw new Error("Kiosk not found");
      }

      // Store the canonical UUID or verified ID
      const resolvedId = data.id || id;
      localStorage.setItem(STORAGE_KEY, resolvedId);
      setSavedId(resolvedId);
      setKioskDetails(data);
      setKioskIdInput("");
      toast.success(
        `Device locked to ${data.vendor?.businessName || "Outlet"} (Serial #${data.serialNumber || resolvedId.slice(0, 8)})`
      );
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
        "Could not verify Outlet. Check the UUID or Serial Number and ensure the outlet is active."
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleClearKiosk = () => {
    if (window.confirm("Are you sure you want to disconnect this device from its outlet kiosk?")) {
      localStorage.removeItem(STORAGE_KEY);
      setSavedId("");
      setKioskDetails(null);
      toast.info("Device detached. /shop will now show general nearby options.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-main)",
        color: "var(--text-body)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <header
        style={{
          height: 60,
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to="/" style={{ display: "flex", alignItems: "center" }}>
            <img
              src={theme === "dark" ? nora_logo_white : nora_logo_dark}
              alt="Nora"
              style={{ height: 26, width: "auto" }}
            />
          </Link>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MdDevices size={17} style={{ color: "var(--accent)" }} />
            <span
              style={{
                fontSize: "0.85rem",
                fontWeight: 800,
                color: "var(--text-heading)",
              }}
            >
              Outlet Device Setup
            </span>
          </div>
        </div>

        <button
          onClick={toggle}
          className="kiosk_icon_action_btn"
          style={{ width: 34, height: 34 }}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark" ? (
            <MdOutlineLightMode size={17} />
          ) : (
            <MdOutlineDarkMode size={17} />
          )}
        </button>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          maxWidth: 620,
          width: "100%",
          margin: "36px auto",
          padding: "0 20px",
          boxSizing: "border-box",
        }}
      >
        {/* Intro Card */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 20,
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "rgba(203,108,220,0.12)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MdStorefront size={24} />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "1.2rem",
                  fontWeight: 900,
                  color: "var(--text-heading)",
                  margin: "0 0 6px 0",
                }}
              >
                Dedicated Outlet Station
              </h1>
              <p
                style={{
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Configure this tablet, terminal, or browser to operate exclusively
                for a single Nora outlet outlet. Once saved, visiting <code>/shop</code> on
                this device will immediately display only that outlet's menu for customer ordering.
              </p>
            </div>
          </div>
        </div>

        {/* Current Active Configuration */}
        {savedId && (
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid rgba(203,108,220,0.3)",
              borderRadius: 16,
              padding: 24,
              marginBottom: 20,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 10px",
                    borderRadius: 999,
                    background: "rgba(34,197,94,0.1)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "#16a34a",
                  }}
                >
                  <MdCheckCircle size={13} /> Active Terminal Assignment
                </span>
              </div>
              <button
                onClick={handleClearKiosk}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--danger, #ef4444)",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 8px",
                  borderRadius: 6,
                }}
                title="Disconnect this device"
              >
                <MdOutlineDelete size={15} />
                <span>Disconnect</span>
              </button>
            </div>

            {loadingCurrent ? (
              <div
                style={{
                  padding: "20px 0",
                  textAlign: "center",
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                }}
              >
                Verifying outlet details…
              </div>
            ) : kioskDetails ? (
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  {kioskDetails.vendor?.brandLogo ? (
                    <img
                      src={kioskDetails.vendor.brandLogo}
                      alt=""
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        objectFit: "cover",
                        border: "1px solid var(--border)",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: "var(--bg-hover)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.4rem",
                      }}
                    >
                      🍽️
                    </div>
                  )}
                  <div>
                    <div
                      style={{
                        fontSize: "1.05rem",
                        fontWeight: 900,
                        color: "var(--text-heading)",
                      }}
                    >
                      {kioskDetails.vendor?.businessName || "Kiosk Outlet"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.76rem",
                        color: "var(--text-muted)",
                        fontFamily: "monospace",
                      }}
                    >
                      Outlet #{kioskDetails.serialNumber || savedId.slice(0, 8)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    marginBottom: 18,
                    background: "var(--bg-hover)",
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "0.64rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Location
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "var(--text-body)",
                        marginTop: 2,
                      }}
                    >
                      <MdLocationOn size={12} style={{ verticalAlign: "middle", marginRight: 2 }} />
                      {kioskDetails.location?.address || "Physical Location"}
                      {kioskDetails.location?.city ? `, ${kioskDetails.location.city}` : ""}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "0.64rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Menu Available
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "var(--text-body)",
                        marginTop: 2,
                      }}
                    >
                      <MdRestaurantMenu size={12} style={{ verticalAlign: "middle", marginRight: 2 }} />
                      {kioskDetails.menu?.length || 0} Items (
                      {kioskDetails.currency || kioskDetails.location?.state?.currency || "NGN"})
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/shop")}
                  className="app_btn app_btn_confirm"
                  style={{
                    width: "100%",
                    height: 44,
                    fontSize: "0.88rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <span>Launch POS Ordering Terminal</span>
                  <MdArrowForward size={17} />
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: "0.82rem", color: "var(--danger, #ef4444)", margin: "0 0 10px 0" }}>
                  Unable to load details for Outlet ID <code>{savedId}</code>. The outlet may be offline or deleted.
                </p>
                <button
                  onClick={handleClearKiosk}
                  className="app_btn"
                  style={{ padding: "6px 14px", fontSize: "0.78rem" }}
                >
                  Clear Saved Assignment
                </button>
              </div>
            )}
          </div>
        )}

        {/* Input Form Card */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: 24,
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          }}
        >
          <h2
            style={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color: "var(--text-heading)",
              margin: "0 0 6px 0",
            }}
          >
            {savedId ? "Reassign or Change Outlet" : "Assign Outlet (UUID or Serial Number)"}
          </h2>
          <p
            style={{
              fontSize: "0.76rem",
              color: "var(--text-muted)",
              margin: "0 0 16px 0",
            }}
          >
            Enter either the Outlet's 36-character UUID or its assigned Serial Number (e.g. KSK-001).
          </p>

          <form onSubmit={handleSaveKiosk}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  color: "var(--text-body)",
                  marginBottom: 6,
                }}
              >
                Kiosk UUID or Serial Number
              </label>
              <input
                type="text"
                className="modal-input"
                placeholder="e.g. 71fc8086-7083-4780-af3e-a741ab157747 or KSK-001"
                value={kioskIdInput}
                onChange={(e) => setKioskIdInput(e.target.value)}
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.82rem",
                  letterSpacing: "0.02em",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                disabled={verifying || !kioskIdInput.trim()}
                className="app_btn app_btn_confirm"
                style={{
                  flex: 1,
                  height: 42,
                  fontSize: "0.84rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: verifying || !kioskIdInput.trim() ? 0.6 : 1,
                }}
              >
                {verifying ? (
                  <>
                    <MdRefresh size={16} className="spin" />
                    <span>Verifying Outlet…</span>
                  </>
                ) : (
                  <>
                    <MdCheckCircle size={16} />
                    <span>Verify & Save Outlet</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Setup note */}
          <div
            style={{
              marginTop: 20,
              padding: "10px 14px",
              borderRadius: 10,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              lineHeight: 1.4,
            }}
          >
            <MdInfoOutline size={15} style={{ flexShrink: 0, marginTop: 1, color: "var(--accent)" }} />
            <div>
              <strong>Note:</strong> Configuration is stored in this browser's local storage. To reset or assign to another kiosk later, visit this same URL (<code>/shop/setup</code>) at any time.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

