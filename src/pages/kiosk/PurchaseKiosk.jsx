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

                {/* Duration — only for non-purchase types */}
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

                {/* Max menus & operators */}
                {/* <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "6px 0" }}>
                  {setting.maxMenus != null && (
                    <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px" }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
                        Max Menus
                      </div>
                      <div style={{ fontSize: "1rem", fontWeight: 900, color: "var(--accent)" }}>
                        {setting.maxMenus}
                      </div>
                    </div>
                  )}
                  {setting.maxOperatorsAtATime != null && (
                    <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 10, padding: "8px 12px" }}>
                      <div style={{ fontSize: "0.62rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>
                        Max Operators
                      </div>
                      <div style={{ fontSize: "1rem", fontWeight: 900, color: "var(--accent)" }}>
                        {setting.maxOperatorsAtATime}
                      </div>
                    </div>
                  )}
                </div> */}

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

                {/* CTA */}
                <button
                  className={`app_btn app_btn_confirm ${isLoading ? "btn_loading" : ""}`}
                  style={{ width: "100%", height: 42, position: "relative", marginTop: 4 }}
                  onClick={() => handlePurchase(setting.id)}
                  disabled={!!purchasing}
                >
                  <span className="btn_text">Select this Plan</span>
                  {isLoading && <span className="btn_loader" style={{ width: 18, height: 18 }} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PurchaseKiosk;