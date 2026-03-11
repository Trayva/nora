import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import Modal from "../../components/Modal";
import api from "../../api/axios";
import './Icart.css'
import {
  MdCircle,
  MdLock,
  MdLockOpen,
  MdWifi,
  MdWifiOff,
  MdAdd,
  MdReceiptLong,
} from "react-icons/md";
import { LuShoppingCart } from "react-icons/lu";

const purchaseSchema = Yup.object().shape({
  noOfCarts: Yup.number()
    .typeError("Please enter a valid number")
    .min(1, "Minimum 1 iCart required")
    .integer("Must be a whole number")
    .required("Number of iCarts is required"),
});

const statusColors = {
  PURCHASED: {
    bg: "rgba(203,108,220,0.1)",
    color: "var(--accent)",
    border: "rgba(203,108,220,0.2)",
  },
  ACTIVE: {
    bg: "rgba(34,197,94,0.1)",
    color: "#22c55e",
    border: "rgba(34,197,94,0.25)",
  },
  INACTIVE: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.25)",
  },
  SUSPENDED: {
    bg: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "rgba(239,68,68,0.25)",
  },
};

function IcartStatusBadge({ status }) {
  const s = statusColors[status] || statusColors.INACTIVE;
  return (
    <span
      className="icart_status_badge"
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      <MdCircle size={6} />
      {status}
    </span>
  );
}

export default function IcartHome() {
  const navigate = useNavigate();
  const [icarts, setIcarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchIcarts = async () => {
      try {
        const res = await api.get("/icart/vendor");
        setIcarts(res.data.data.items || []);
      } catch {
        toast.error("Failed to load iCarts");
      } finally {
        setLoading(false);
      }
    };
    fetchIcarts();
  }, []);

  const handleSubmit = (values, { setSubmitting }) => {
    localStorage.setItem("icart_purchase_count", values.noOfCarts);
    setSubmitting(false);
    setOpen(false);
    navigate("/app/purchase-icart");
  };

  return (
    <div className="page_wrapper">
      <div className="icart_page_header">
        <div>
          <h2 className="page_title_big m-0">iCart</h2>
          <p className="welcome_message" style={{ marginBottom: 0 }}>
            Purchase and manage your iCarts
          </p>
        </div>
        <button
          className="app_btn app_btn_confirm"
          style={{ height: 40, display: "flex", alignItems: "center", gap: 6 }}
         onClick={() => navigate("/app/purchase-icart")}
        >
          <MdAdd size={17} />
          Purchase iCart
        </button>
      </div>

      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : icarts.length === 0 ? (
        <div className="icart_empty_state">
          <LuShoppingCart size={36} />
          <p className="icart_empty_title">No iCarts yet</p>
          <p className="icart_empty_sub">
            Purchase your first iCart to get started.
          </p>
          <button
            className="app_btn app_btn_confirm"
            style={{
              height: 40,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
           onClick={() => navigate("/app/purchase-icart")}
          >
            <MdAdd size={16} />
            Purchase iCart
          </button>
        </div>
      ) : (
        <>
          <div className="icart_summary_row">
            <div className="icart_summary_chip">
              <LuShoppingCart size={13} />
              {icarts.length} iCart{icarts.length !== 1 ? "s" : ""}
            </div>
            <div className="icart_summary_chip">
              <MdCircle size={7} style={{ color: "#22c55e" }} />
              {icarts.filter((c) => c.isOnline).length} Online
            </div>
            <div className="icart_summary_chip">
              <MdLockOpen size={13} />
              {icarts.filter((c) => !c.isLocked).length} Unlocked
            </div>
          </div>

          <div className="icart_grid">
            {icarts.map((cart) => (
              <div key={cart.id} className="icart_item_card">
                {/* Top row */}
                <div className="icart_item_top">
                  <div className="icart_item_icon">
                    <LuShoppingCart size={17} />
                  </div>
                  <IcartStatusBadge status={cart.status} />
                </div>

                {/* Serial number */}
                <div className="icart_item_serial">{cart.serialNumber}</div>

                {/* Online / locked indicators */}
                <div className="icart_item_indicators">
                  <span
                    className={`icart_indicator ${cart.isOnline ? "icart_ind_on" : "icart_ind_off"}`}
                  >
                    {cart.isOnline ? (
                      <MdWifi size={12} />
                    ) : (
                      <MdWifiOff size={12} />
                    )}
                    {cart.isOnline ? "Online" : "Offline"}
                  </span>
                  <span
                    className={`icart_indicator ${cart.isLocked ? "icart_ind_locked" : "icart_ind_unlocked"}`}
                  >
                    {cart.isLocked ? (
                      <MdLock size={11} />
                    ) : (
                      <MdLockOpen size={11} />
                    )}
                    {cart.isLocked ? "Locked" : "Unlocked"}
                  </span>
                </div>

                {/* Meta block */}
                <div className="icart_item_meta">
                  <div className="icart_meta_row">
                    <span className="icart_meta_key">Contract</span>
                    <span className="icart_meta_val">
                      {cart.contract?.contractStatus || (
                        <span className="icart_meta_muted">Not started</span>
                      )}
                    </span>
                  </div>
                  <div className="icart_meta_row">
                    <span className="icart_meta_key">Concepts</span>
                    <span className="icart_meta_val">
                      {cart.concepts?.length > 0 ? (
                        cart.concepts.length
                      ) : (
                        <span className="icart_meta_muted">None</span>
                      )}
                    </span>
                  </div>
                  {cart.contract?.nextInvoiceAt && (
                    <div className="icart_meta_row">
                      <span className="icart_meta_key">Next Invoice</span>
                      <span className="icart_meta_val">
                        {new Date(
                          cart.contract.nextInvoiceAt,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Invoices footer */}
                {cart.contractDetails?.invoices?.length > 0 && (
                  <div className="icart_item_invoices">
                    <MdReceiptLong size={13} />
                    {cart.contractDetails.invoices.length} invoice
                    {cart.contractDetails.invoices.length !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

     
    </div>
  );
}
