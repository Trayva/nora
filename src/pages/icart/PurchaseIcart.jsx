import { useEffect, useState, React } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import ButtonLoader from "../../components/ButtonLoader";

const purchaseSchema = Yup.object().shape({
  noOfCarts: Yup.number()
    .typeError("Please enter a valid number")
    .min(1, "Minimum 1 iCart required")
    .integer("Must be a whole number")
    .required("Number of iCarts is required"),
});


function PurchaseIcart() {
  const navigate = useNavigate();
  const numberOfCarts = parseInt("1");

  const [settings, setSettings] = useState([]);
  const [selectedSettings, setSelectedSettings] = useState(null);
  const [loading, setLoading] = useState(true); // holds settingsId being purchased
  const [loading2, setLoading2] = useState(false);

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

  const handlePurchase = async (numberOfCarts) => {
    try {
      setLoading2(true);
      await api.post("/contract/application/purchase-icart", {
        settingsId: selectedSettings,
        numberOfCarts,
      });
      toast.success("iCart purchased successfully!");
      navigate("/app/finance/invoices?open_recent=true");
    } catch (err) {
      toast.error(err.response?.data?.message || "Purchase failed");
    } finally {
      setLoading2(false);
      setSelectedSettings(null);
    }
  };

  return (
    <div className="page_wrapper">
      <h2 className="page_title_big m-0">Purchase iCart</h2>
      <p className="welcome_message">
        Select a contract plan to purchase{" "}
        <strong style={{ color: "var(--text-heading)" }}>
          iCart
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
            const isLoading = selectedSettings === setting.id;
            const totalAmount = setting.payments.reduce(
              (sum, p) => sum + p.amount * numberOfCarts,
              0
            );

            return (
              <div key={setting.id} className="icart_settings_card">
                {/* Header */}
                <div className="icart_card_header">
                  <div>
                    <h3 className="icart_card_title">{setting.type}</h3>
                    <span className="icart_card_location">
                      {setting.state.name}, {setting.state.country}
                    </span>
                  </div>
                  <span className="icart_card_currency">
                    {setting.state.currency}
                  </span>
                </div>

                {/* Duration */}
                {setting.type !== 'PURCHASE' ? <div className="icart_card_meta">
                  <span className="icart_meta_label">Contract Duration</span>
                  <span className="icart_meta_value">
                    {setting.durationDays} days
                  </span>
                </div> : null}
                <div className="icart_card_meta">
                  <span className="icart_meta_label">Kiosk Size</span>
                  <span className="icart_meta_value">
                    {setting.kioskSize.length}{setting.kioskSize.unit} x {setting.kioskSize.breadth}{setting.kioskSize.unit}
                  </span>
                </div>

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
                          {setting.state.currency}{" "}
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

                {/* Total */}
                <div className="icart_card_total">
                  <span className="icart_total_label">
                    Total for {numberOfCarts} iCart{numberOfCarts > 1 ? "s" : ""}
                  </span>
                  <span className="icart_total_amount">
                    {setting.state.currency} {totalAmount.toLocaleString()}
                  </span>
                </div>

                {/* CTA */}
                <button
                  className={`app_btn app_btn_confirm ${isLoading ? "btn_loading" : ""}`}
                  style={{ width: "100%", height: 42, position: "relative", marginTop: 4 }}
                  onClick={() => setSelectedSettings(setting.id)}
                  disabled={!!selectedSettings}
                >
                  <span className="btn_text text-white">
                    Select this Plan
                  </span>
                  {isLoading && (
                    <span className="btn_loader" style={{ width: 18, height: 18 }} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}


      <Modal
        isOpen={selectedSettings}
        onClose={() => setSelectedSettings(null)}
        title="Purchase iCart"
        description="Select how many iCarts you would like to purchase"
      >
        <Formik
          initialValues={{ noOfCarts: 1 }}
          validationSchema={purchaseSchema}
          onSubmit={({ noOfCarts }) => handlePurchase(noOfCarts)}
        >
          {({ errors, touched, values, handleChange, handleBlur }) => (
            <Form>
              <div className="modal-body">
                <div className="form-field">
                  <label className="modal-label">Number of iCarts</label>
                  <input
                    className={`modal-input ${touched.noOfCarts && errors.noOfCarts ? "modal-input-error" : ""}`}
                    type="number"
                    name="noOfCarts"
                    placeholder="e.g. 2"
                    min="1"
                    value={values.noOfCarts}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading2}
                  />
                  {touched.noOfCarts && errors.noOfCarts && (
                    <span className="login_field_error">{errors.noOfCarts}</span>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="app_btn app_btn_cancel"
                    onClick={() => setSelectedSettings(null)}
                    disabled={loading2}
                  >
                    Cancel
                  </button>
                  <button
                    style={{ position: "relative" }}
                    type="submit"
                    className={`app_btn app_btn_confirm ${loading2 ? "btn_loading2" : ""}`}
                    disabled={loading2}
                  >
                    <span className="btn_text text-white">Purchase</span>
                    {loading2 && <ButtonLoader />}
                  </button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </Modal>
    </div>
  );
}

export default PurchaseIcart;