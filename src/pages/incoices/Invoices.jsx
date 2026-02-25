import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";
import Modal from "../../components/Modal";
import { Col, Row } from "reactstrap";

const statusColors = {
  PENDING: {
    bg: "rgba(234,179,8,0.1)",
    color: "#ca8a04",
    border: "rgba(234,179,8,0.25)",
  },
  PAID: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  OVERDUE: {
    bg: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "rgba(239,68,68,0.25)",
  },
  CANCELLED: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.25)",
  },
};

function StatusBadge({ status }) {
  const s = statusColors[status] || statusColors.PENDING;
  return (
    <span
      className="invoice_status_badge"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {status}
    </span>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount, currency) {
  return `${currency} ${Number(amount).toLocaleString()}`;
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // invoice object
  const [paying, setPaying] = useState(null); // method string
  const [showMethods, setShowMethods] = useState(false);

  const fetchInvoices = async () => {
    try {
      const res = await api.get("/finance/invoice");
      setInvoices(res.data.data);
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePay = async (method) => {
    setPaying(method);
    setShowMethods(false);
    try {
      const res = await api.get(`/finance/invoice/${selected.id}/pay`, {
        params: { method, shouldRedirect: false },
      });
      const paymentLink = res.data?.data?.paymentLink;
      if (method === "online" && paymentLink) {
        window.open(paymentLink, "_blank");
      } else {
        toast.success("Payment successful!");
        await fetchInvoices();
        // update selected with fresh data
        const updated = await api.get("/finance/invoice");
        const fresh = updated.data.data.find((i) => i.id === selected.id);
        if (fresh) setSelected(fresh);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setPaying(null);
    }
  };

  const openInvoice = (invoice) => {
    setSelected(invoice);
    setShowMethods(false);
  };

  const closeModal = () => {
    if (paying) return;
    setSelected(null);
    setShowMethods(false);
  };

  if (loading) {
    return (
      <div className="page_wrapper">
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page_wrapper">
      <h2 className="page_title_big m-0">Invoices</h2>
      <p className="welcome_message">View and pay your outstanding invoices</p>

      {invoices.length === 0 ? (
        <div className="invoices_empty">
          <p>No invoices found.</p>
        </div>
      ) : (
        <Row className="">
          {invoices.map((invoice) => (
            <Col className="mb-3" md={4} key={invoice.id}>
              <div
                className="invoice_card"
                onClick={() => openInvoice(invoice)}
              >
                <div className="invoice_card_row">
                  <div className="invoice_card_left">
                    <div className="invoice_id_row">
                      <span className="invoice_id">
                        #{invoice.id.slice(0, 8).toUpperCase()}
                      </span>
                      <StatusBadge status={invoice.status} />
                    </div>
                    <span className="invoice_date">
                      Due {formatDate(invoice.dueDate)}
                    </span>
                  </div>
                  <div className="invoice_card_right">
                    <span className="invoice_total">
                      {formatAmount(invoice.total, invoice.currency)}
                    </span>
                    <span className="invoice_chevron">›</span>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      )}

      {/* Invoice Detail Modal */}
      {selected && (
        <Modal
          isOpen={!!selected}
          onClose={closeModal}
          title={`Invoice #${selected.id.slice(0, 8).toUpperCase()}`}
          description={`Due ${formatDate(selected.dueDate)}`}
        >
          <div className="modal-body">
            {/* Status */}
            <div className="invoice_modal_status_row">
              <StatusBadge status={selected.status} />
              <span className="invoice_modal_currency">
                {selected.currency}
              </span>
            </div>

            {/* Items */}
            <div className="invoice_items">
              <span className="invoice_section_label">Items</span>
              {selected.items.map((item, i) => (
                <div key={i} className="invoice_item_row">
                  <div className="invoice_item_info">
                    <span className="invoice_item_title">{item.title}</span>
                    <span className="invoice_item_desc">
                      {item.description}
                    </span>
                  </div>
                  <div className="invoice_item_right">
                    <span className="invoice_item_qty">× {item.quantity}</span>
                    <span className="invoice_item_amount">
                      {formatAmount(
                        item.amount * item.quantity,
                        selected.currency,
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Meta */}
            <div className="invoice_meta_grid">
              <div className="invoice_meta_item">
                <span className="icart_meta_label">Created</span>
                <span className="icart_meta_value">
                  {formatDate(selected.createdAt)}
                </span>
              </div>
              <div className="invoice_meta_item">
                <span className="icart_meta_label">Due Date</span>
                <span className="icart_meta_value">
                  {formatDate(selected.dueDate)}
                </span>
              </div>
              {selected.paidAt && (
                <div className="invoice_meta_item">
                  <span className="icart_meta_label">Paid At</span>
                  <span className="icart_meta_value">
                    {formatDate(selected.paidAt)}
                  </span>
                </div>
              )}
              {selected.paymentMethod && (
                <div className="invoice_meta_item">
                  <span className="icart_meta_label">Method</span>
                  <span className="icart_meta_value">
                    {selected.paymentMethod}
                  </span>
                </div>
              )}
            </div>

            {/* Total */}
            <div className="icart_card_total">
              <span className="icart_total_label">Total</span>
              <span className="icart_total_amount">
                {formatAmount(selected.total, selected.currency)}
              </span>
            </div>

            {/* Pay section */}
            {selected.status === "PENDING" && (
              <div
                className="modal-footer"
                style={{ flexDirection: "column", gap: 10 }}
              >
                {showMethods ? (
                  <>
                    <div className="invoice_method_btns">
                      <button
                        className={`app_btn app_btn_confirm ${paying === "wallet" ? "btn_loading" : ""}`}
                        style={{ flex: 1, height: 42, position: "relative" }}
                        onClick={() => handlePay("wallet")}
                        disabled={!!paying}
                      >
                        <span className="btn_text text-white">
                          Pay with Wallet
                        </span>
                        {paying === "wallet" && (
                          <span
                            className="btn_loader"
                            style={{ width: 18, height: 18 }}
                          />
                        )}
                      </button>
                      <button
                        className={`app_btn app_btn_confirm ${paying === "online" ? "btn_loading" : ""}`}
                        style={{ flex: 1, height: 42, position: "relative" }}
                        onClick={() => handlePay("online")}
                        disabled={!!paying}
                      >
                        <span className="btn_text text-white">Pay Online</span>
                        {paying === "online" && (
                          <span
                            className="btn_loader"
                            style={{ width: 18, height: 18 }}
                          />
                        )}
                      </button>
                    </div>
                    <button
                      className="app_btn app_btn_cancel"
                      style={{ width: "100%", height: 42 }}
                      onClick={() => setShowMethods(false)}
                      disabled={!!paying}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="app_btn app_btn_confirm"
                    style={{ width: "100%", height: 42 }}
                    onClick={() => setShowMethods(true)}
                  >
                    Pay Now
                  </button>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
