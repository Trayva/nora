import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import ESignDrawer from "../../components/ESignDrawer";

function PurchaseKiosk() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get("selection");
  const scrollRef = useRef({});
  const { user } = useAuth();

  const [numberOfKiosks, setNumberOfKiosks] = useState(1);
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [activeSignSetting, setActiveSignSetting] = useState(null);

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

      {/* E-Signature Drawer */}
      {activeSignSetting && (
        <ESignDrawer
          isOpen={!!activeSignSetting}
          onClose={() => setActiveSignSetting(null)}
          title="Kiosk Purchase Agreement"
          description="Please review the specifications and sign the agreement to initiate purchase."
          templateText={activeSignSetting.terms || DEFAULT_SALES_AGREEMENT}
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

const DEFAULT_SALES_AGREEMENT = `
<h2 style="text-align: center; margin-bottom: 20px;">NORA AI LTD.<br/>KIOSK SALE AGREEMENT</h2>
 
<p>This Agreement is entered into on the <strong>{{ date }}</strong>, between NORA AI LTD., hereinafter referred to as “the Seller” on the one part and <strong>{{ buyer_name }}</strong> of {{ buyer_address }}, hereinafter referred to as “the Buyer” (collectively, the "Parties") for the outright sale of {{ number_of_kiosks }} Modular QSR Kiosk Unit(s) (the "Kiosk") on the following terms:</p>

<h3>1. THE KIOSK</h3>
<p>The Seller agrees to sell and the Buyer agrees to purchase the Kiosk unit(s), free from all charges and encumbrances. Kiosk specifications: {{ kiosk_type }}.</p>
{{ specification_table }}
 
<h3>2. PURCHASE PRICE AND PAYMENT</h3>
<p>2.1 The total purchase price for the Kiosk is <strong>{{ currency }} {{ purchase_price }}</strong>, payable at once.</p>
<p>2.2 All payments shall be made by bank transfer only, and it shall be made to the Seller’s designated account.</p>
<p>2.3 Title in the Kiosk shall pass to the Buyer only upon receipt of the full Purchase Price in cleared funds. Risk shall pass to the Buyer upon delivery.</p>

<h3>3. DELIVERY</h3>
<p>3.1 The Buyer shall take the responsibility of delivery of the Kiosk at the specified location. Upon delivery, the Buyer shall inspect and sign a Delivery Note confirming receipt in good condition.</p>
<p>3.2 The Buyer is responsible for obtaining all necessary government permits and approvals for the placement and operation of the Kiosk at their chosen location.</p>

<h3>4. SELLER’S WARRANTIES</h3>
<p>The Seller warrants that the Kiosk shall conform in all material respects to the specifications set out in Clause 1, and that all electrical and gas installations in the Kiosk shall have been tested and in safe working order at delivery.</p>

<h3>5. BUYER’S ACKNOWLEDGEMENTS</h3>
<p>The Buyer acknowledges and agrees that: (a) This is a standalone sale of a physical asset; (b) The Buyer is free to use the Kiosk for any lawful business purpose; (c) The Buyer has inspected the Kiosk specifications and is satisfied with the same.</p>

<h3>6. NORA AI FRANCHISE OPTION</h3>
<p>The Buyer is hereby notified that, having purchased a Nora AI Kiosk, they are eligible to apply for access to the Nora AI franchise platform to list their Kiosk for operation under an established food brand as a Franchise Owner.</p>

<h3>7. ADVERT SIGNAGE RIGHTS</h3>
<p>The Buyer grants the Seller (NORA AI LTD.) and its authorised agents an exclusive, irrevocable, and transferable right to install and display advertisement signage on the designated signage area located on the top section of the Kiosk.</p>

<h3>8. GENERAL</h3>
<p>This Agreement shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.</p>
`;

export default PurchaseKiosk;