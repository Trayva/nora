import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";

function PurchaseIcart() {
  const navigate = useNavigate();
  const [numberOfCarts, setNumberOfCarts] = useState(1);

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

  const handlePurchase = async (settingsId) => {
    setPurchasing(settingsId);
    try {
      await api.post("/contract/application/purchase-icart", {
        settingsId,
        numberOfCarts,
      });
      toast.success("iCart purchased successfully!");
      navigate("/app/invoices", { state: { openLatest: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="page_wrapper">
      <h2 className="page_title_big m-0">Purchase iCart</h2>
      <p className="welcome_message">
        Select a contract plan to purchase{" "}
        <strong style={{ color: "var(--text-heading)" }}>
          {numberOfCarts} iCart{numberOfCarts > 1 ? "s" : ""}
        </strong>
      </p>

      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : settings.length === 0 ? (
        <div className="icart_empty">
          <p>No contract settings available at the moment.</p>
        </div>
      ) : (
        <div className="icart_settings_grid">
          {settings.map((setting) => {
            const isLoading = purchasing === setting.id;
            const totalAmount = setting.payments.reduce(
              (sum, p) => sum + p.amount * numberOfCarts,
              0,
            );

            return (
              <div key={setting.id} className="icart_settings_card">
                {/* Header */}
                <div className="icart_card_header">
                  <div>
                    <h3 className="icart_card_title">{setting.type}</h3>
                    <span className="icart_card_location">
                   {setting.country}
                    </span>
                  </div>
                  <span className="icart_card_currency">
                    {setting.currency}
                  </span>
                </div>

                {/* Duration — only for non-purchase types */}
                {setting.type !== "PURCHASE" && (
                  <div className="icart_card_meta">
                    <span className="icart_meta_label">Contract Duration</span>
                    <span className="icart_meta_value">
                      {setting.durationDays} days
                    </span>
                  </div>
                )}

                {/* Kiosk size */}
                {setting.kioskSize && (
                  <div className="icart_card_meta">
                    <span className="icart_meta_label">Kiosk Size</span>
                    <span className="icart_meta_value">
                      {setting.kioskSize.length} × {setting.kioskSize.breadth}{" "}
                      <span
                        style={{
                          fontSize: "0.72rem",
                          color: "var(--text-muted)",
                          fontWeight: 500,
                        }}
                      >
                        {setting.kioskSize.unit}
                      </span>
                    </span>
                  </div>
                )}

                {/* Payments */}
                <div className="icart_payments_list">
                  {setting.payments.map((payment, i) => (
                    <div key={i} className="icart_payment_row">
                      <div className="icart_payment_info">
                        <span className="icart_payment_title">
                          {payment.title}
                        </span>
                        <span className="icart_payment_desc">
                          {payment.description}
                        </span>
                      </div>
                      <div className="icart_payment_right">
                        <span className="icart_payment_amount">
                          {setting.currency}{" "}
                          {(payment.amount * numberOfCarts).toLocaleString()}
                        </span>
                        <div className="icart_payment_badges">
                          {payment.recurring && (
                            <span className="icart_badge icart_badge_recurring">
                              Recurring
                            </span>
                          )}
                          {payment.refundable && (
                            <span className="icart_badge icart_badge_refundable">
                              Refundable
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quantity */}
                <div className="icart_qty_row">
                  <span className="icart_qty_label">Number of iCarts</span>
                  <div className="icart_qty_control">
                    <button
                      className="icart_qty_btn"
                      onClick={() =>
                        setNumberOfCarts((n) => Math.max(1, n - 1))
                      }
                      disabled={numberOfCarts === 1}
                    >
                      -
                    </button>
                    <span className="icart_qty_value">{numberOfCarts}</span>
                    <button
                      className="icart_qty_btn"
                      onClick={() => setNumberOfCarts((n) => n + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="icart_card_total">
                  <span className="icart_total_label">
                    Total for {numberOfCarts} iCart
                    {numberOfCarts > 1 ? "s" : ""}
                  </span>
                  <span className="icart_total_amount">
                    {setting.currency} {totalAmount.toLocaleString()}
                  </span>
                </div>

                {/* CTA */}
                <button
                  className={`app_btn app_btn_confirm ${isLoading ? "btn_loading" : ""}`}
                  style={{
                    width: "100%",
                    height: 42,
                    position: "relative",
                    marginTop: 4,
                  }}
                  onClick={() => handlePurchase(setting.id)}
                  disabled={!!purchasing}
                >
                  <span className="btn_text">Select this Plan</span>
                  {isLoading && (
                    <span
                      className="btn_loader"
                      style={{ width: 18, height: 18 }}
                    />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PurchaseIcart;
