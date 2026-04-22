import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";

function PurchaseKiosk() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get("selection");
  const scrollRef = useRef({});

  const [numberOfKiosks, setNumberOfKiosks] = useState(1);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState({});
  const [termsModal, setTermsModal] = useState(null); // holds the setting object

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/contract/settings");
        setSettings(res.data.data);
      } catch (err) {
        toast.error("Failed to load contract settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Scroll to selected plan
  useEffect(() => {
    if (!loading && selectedId && scrollRef.current[selectedId]) {
      setTimeout(() => {
        scrollRef.current[selectedId].scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 500);
    }
  }, [loading, selectedId]);

  const handlePurchase = async (settingsId) => {
    setPurchasing(settingsId);
    try {
      await api.post("/contract/application/purchase-kiosk", {
        settingsId,
        numberOfKiosks,
      });
      toast.success("Kiosk purchased successfully!");
      navigate("/app/invoices", { state: { openLatest: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="page_wrapper">
      <h2 className="page_title_big m-0">Purchase Kiosk</h2>
      <p className="welcome_message">
        Select a contract plan to purchase{" "}
        <strong style={{ color: "var(--text-heading)" }}>
          {numberOfKiosks} Kiosk{numberOfKiosks > 1 ? "s" : ""}
        </strong>
      </p>

      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : settings.length === 0 ? (
        <div className="kiosk_empty">
          <p>No contract settings available at the moment.</p>
        </div>
      ) : (
        <div className="kiosk_settings_grid">
          {settings.map((setting) => {
            const isLoading = purchasing === setting.id;
            const isSelected = selectedId === setting.id;
            const accepted = !!termsAccepted[setting.id];
            const totalAmount = setting.payments.reduce(
              (sum, p) => sum + p.amount * numberOfKiosks,
              0,
            );

            return (
              <div
                key={setting.id}
                ref={(el) => (scrollRef.current[setting.id] = el)}
                className={`kiosk_settings_card ${isSelected ? "selection_highlight" : ""}`}
              >
                {/* Header */}
                <div className="kiosk_card_header">
                  <div>
                    <h3 className="kiosk_card_title">{setting.title?.toUpperCase()}</h3>
                    <span className="kiosk_card_location">{setting.country}</span>
                  </div>
                  <span className="kiosk_card_currency">{setting.currency}</span>
                </div>

                {/* Duration — only for LEASE types */}
                {setting.type === "LEASE" && (
                  <div className="kiosk_card_meta">
                    <span className="kiosk_meta_label">Contract Duration</span>
                    <span className="kiosk_meta_value">{setting.durationDays} days</span>
                  </div>
                )}

                {/* Kiosk size */}
                {setting.kioskSize && (
                  <div className="kiosk_card_meta">
                    <span className="kiosk_meta_label">Kiosk Size</span>
                    <span className="kiosk_meta_value">
                      {setting.kioskSize.length} × {setting.kioskSize.breadth}{" "}
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 500 }}>
                        {setting.kioskSize.unit}
                      </span>
                    </span>
                  </div>
                )}

                {/* Payments */}
                <div className="kiosk_payments_list">
                  {setting.payments.map((payment, i) => (
                    <div key={i} className="kiosk_payment_row">
                      <div className="kiosk_payment_info">
                        <span className="kiosk_payment_title">{payment.title}</span>
                        <span className="kiosk_payment_desc">{payment.description}</span>
                      </div>
                      <div className="kiosk_payment_right">
                        <span className="kiosk_payment_amount">
                          {setting.currency} {(payment.amount * numberOfKiosks).toLocaleString()}
                        </span>
                        <div className="kiosk_payment_badges">
                          {payment.recurring && <span className="kiosk_badge kiosk_badge_recurring">Recurring</span>}
                          {payment.refundable && <span className="kiosk_badge kiosk_badge_refundable">Refundable</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quantity */}
                <div className="kiosk_qty_row">
                  <span className="kiosk_qty_label">Number of Kiosks</span>
                  <div className="kiosk_qty_control">
                    <button className="kiosk_qty_btn" onClick={() => setNumberOfKiosks((n) => Math.max(1, n - 1))} disabled={numberOfKiosks === 1}>-</button>
                    <span className="kiosk_qty_value">{numberOfKiosks}</span>
                    <button className="kiosk_qty_btn" onClick={() => setNumberOfKiosks((n) => n + 1)}>+</button>
                  </div>
                </div>

                {/* Total */}
                <div className="kiosk_card_total">
                  <span className="kiosk_total_label">Total for {numberOfKiosks} Kiosk{numberOfKiosks > 1 ? "s" : ""}</span>
                  <span className="kiosk_total_amount">{setting.currency} {totalAmount.toLocaleString()}</span>
                </div>

                {/* Terms acceptance */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 0 6px",
                    borderTop: "1px solid var(--border)",
                    marginTop: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setTermsAccepted((p) => ({
                        ...p,
                        [setting.id]: !p[setting.id],
                      }))
                    }
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      border: `2px solid ${accepted ? "var(--accent)" : "var(--border)"}`,
                      background: accepted ? "var(--accent)" : "transparent",
                      flexShrink: 0,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                  >
                    {accepted && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-body)", lineHeight: 1.4 }}>
                    I have read and accept the{" "}
                    {setting.terms ? (
                      <button
                        type="button"
                        onClick={() => setTermsModal(setting)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          color: "var(--accent)",
                          fontWeight: 700,
                          fontSize: "inherit",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          textDecoration: "underline",
                        }}
                      >
                        Terms &amp; Conditions
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTermsModal(setting)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          color: "var(--accent)",
                          fontWeight: 700,
                          fontSize: "inherit",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          textDecoration: "underline",
                        }}
                      >
                        Terms &amp; Conditions
                      </button>
                    )}
                  </span>
                </div>

                {/* CTA */}
                <button
                  className={`app_btn app_btn_confirm ${isLoading ? "btn_loading" : ""}`}
                  style={{ width: "100%", height: 42, position: "relative", marginTop: 4 }}
                  onClick={() => handlePurchase(setting.id)}
                  disabled={!!purchasing || !accepted}
                >
                  <span className="btn_text">Select this Plan</span>
                  {isLoading && <span className="btn_loader" style={{ width: 18, height: 18 }} />}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Terms Modal */}
      {termsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={() => setTermsModal(null)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(3px)",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "min(520px, 94vw)",
              maxHeight: "80vh",
              background: "var(--bg-card)",
              borderRadius: 18,
              overflow: "hidden",
              boxShadow: "0 16px 48px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "18px 22px 14px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexShrink: 0,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "var(--text-heading)" }}>
                  Terms &amp; Conditions
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                  {termsModal.title || termsModal.type} — {termsModal.country}
                </div>
              </div>
              <button
                onClick={() => setTermsModal(null)}
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
                  fontSize: "1rem",
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div
              style={{
                overflowY: "auto",
                padding: "20px 22px",
                fontSize: "0.85rem",
                lineHeight: 1.7,
                color: "var(--text-body)",
                whiteSpace: "pre-wrap",
                flex: 1,
              }}
            >
              {termsModal.terms || (
                <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                  No specific terms provided for this plan. Standard platform terms apply.
                </span>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "14px 22px 20px",
                borderTop: "1px solid var(--border)",
                flexShrink: 0,
                display: "flex",
                gap: 8,
              }}
            >
              <button
                className="app_btn app_btn_cancel"
                style={{ flex: 1, height: 42 }}
                onClick={() => setTermsModal(null)}
              >
                Close
              </button>
              <button
                className="app_btn app_btn_confirm"
                style={{ flex: 1, height: 42 }}
                onClick={() => {
                  setTermsAccepted((p) => ({ ...p, [termsModal.id]: true }));
                  setTermsModal(null);
                }}
              >
                Accept &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseKiosk;