import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import ESignDrawer from "../../components/ESignDrawer";
import BuyFranchiseSection from "./BuyFranchiseSection";
import { MdStorefront, MdOutlineKitchen } from "react-icons/md";
import useCurrencyDisplay from "../../hooks/useCurrencyDisplay";

function PurchaseKiosk() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("selection");
  const scrollRef = useRef({});
  const { user } = useAuth();
  const { format: fmt, isConverted, displayCurrency } = useCurrencyDisplay();

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "franchise");
  const [numberOfKiosks, setNumberOfKiosks] = useState(1);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [activeSignSetting, setActiveSignSetting] = useState(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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

  const handleSignSubmit = async ({ signatureName, terms, isSigned }) => {
    if (!activeSignSetting) return;
    setPurchasing(activeSignSetting.id);
    try {
      await api.post("/contract/application/purchase-kiosk", {
        settingsId: activeSignSetting.id,
        numberOfCarts: numberOfKiosks,
        signatureName,
        terms,
        isSigned,
      });
      toast.success("Kiosk purchase initiated successfully!");
      setActiveSignSetting(null);
      navigate("/app/invoices", { state: { openLatest: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Purchase failed");
    } finally {
      setPurchasing(null);
    }
  };

  const switchTab = (tabName) => {
    setActiveTab(tabName);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tabName);
      return next;
    });
  };

  return (
    <div className="page_wrapper">
      {/* <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 className="page_title_big m-0">Kitchen Acquisition</h2>
          <p className="welcome_message" style={{ margin: 0 }}>
            Buy a brand franchise or acquire a modular hardware kitchen unit
          </p>
        </div>

        <div
          style={{
            display: "flex",
            background: "var(--bg-card)",
            padding: 4,
            borderRadius: 12,
            border: "1px solid var(--border)",
            gap: 4,
          }}
        >
          <button
            type="button"
            onClick={() => switchTab("franchise")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "franchise" ? "var(--accent)" : "transparent",
              color: activeTab === "franchise" ? "#fff" : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <MdStorefront size={16} />
            <span>Buy Brand Franchise</span>
          </button>
          <button
            type="button"
            onClick={() => switchTab("hardware")}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              background: activeTab === "hardware" ? "var(--accent)" : "transparent",
              color: activeTab === "hardware" ? "#fff" : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.15s ease",
            }}
          >
            <MdOutlineKitchen size={16} />
            <span>Hardware Plans</span>
          </button>
        </div>
      </div> */}

      {/* ── FRANCHISE TAB ─────────────────────────────────── */}
      {activeTab === "franchise" ? (
        <BuyFranchiseSection />
      ) : (
        /* ── HARDWARE PLANS TAB ────────────────────────────── */
        <div style={{ marginTop: 24 }}>
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
                      <span className="kiosk_card_currency">
                        {isConverted(setting.currency) ? displayCurrency : setting.currency}
                      </span>
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
                              {fmt(payment.amount * numberOfKiosks, setting.currency)}
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
                      <span className="kiosk_total_amount">{fmt(totalAmount, setting.currency)}</span>
                    </div>
                    {isConverted(setting.currency) && (
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "right", marginTop: 4 }}>
                        Billed in {setting.currency} {totalAmount.toLocaleString()}. Converted amount is an estimate.
                      </div>
                    )}

                    {/* CTA */}
                    <button
                      className={`app_btn app_btn_confirm ${isLoading ? "btn_loading" : ""}`}
                      style={{ width: "100%", height: 42, position: "relative", marginTop: 12 }}
                      onClick={() => setActiveSignSetting(setting)}
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
      )}

      {/* E-Signature Drawer */}
      {activeSignSetting && (
        <ESignDrawer
          isOpen={!!activeSignSetting}
          onClose={() => setActiveSignSetting(null)}
          title="Kiosk Purchase Agreement"
          description="Please review the specifications and sign the agreement to initiate purchase."
          templateText={activeSignSetting.terms}
          variables={{
            buyer_name: user?.fullName || user?.email || "Franchisee Buyer",
            buyer_address: user?.address || "Nigeria",
            purchase_price: (activeSignSetting.payments.reduce(
              (sum, p) => sum + p.amount * numberOfKiosks,
              0,
            )).toLocaleString(),
            currency: activeSignSetting.currency || "NGN",
            number_of_kiosks: numberOfKiosks.toString(),
            kiosk_type: activeSignSetting.kioskSize
              ? `${activeSignSetting.kioskSize.length} × ${activeSignSetting.kioskSize.breadth} ${activeSignSetting.kioskSize.unit}`
              : "Modular QSR Unit",
          }}
          submitting={purchasing === activeSignSetting.id}
          onSubmit={handleSignSubmit}
        />
      )}
    </div>
  );
}

export default PurchaseKiosk;
