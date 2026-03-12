import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import Modal from "../../components/Modal";
import ContractDrawer from "./ContractDrawer";
import api from "../../api/axios";
import "./Icart.css";
import {
  MdCircle,
  MdLock,
  MdLockOpen,
  MdWifi,
  MdWifiOff,
  MdAdd,
  MdReceiptLong,
  MdChevronRight,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import { LuShoppingCart } from "react-icons/lu";

const purchaseSchema = Yup.object().shape({
  noOfCarts: Yup.number()
    .typeError("Please enter a valid number")
    .min(1, "Minimum 1 iCart required")
    .integer("Must be a whole number")
    .required("Number of iCarts is required"),
});

const icartStatusColors = {
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

const contractStatusColors = {
  SUBMITTED: {
    bg: "rgba(234,179,8,0.1)",
    color: "#ca8a04",
    border: "rgba(234,179,8,0.25)",
  },
  APPROVED: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  REJECTED: {
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

const invStatusColors = {
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
};

function StatusBadge({ status, colors }) {
  const s = colors[status] || Object.values(colors)[0];
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
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [icartsOpen, setIcartsOpen] = useState(true);
  const [contractsOpen, setContractsOpen] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [icartsRes, contractsRes] = await Promise.all([
          api.get("/icart/vendor"),
          api.get("/contract/application"),
        ]);
        setIcarts(icartsRes.data.data.items || []);
        setContracts(contractsRes.data.data.items || []);
      } catch {
        toast.error("Failed to load iCart data");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleSubmit = (values, { setSubmitting }) => {
    localStorage.setItem("icart_purchase_count", values.noOfCarts);
    setSubmitting(false);
    setOpen(false);
    navigate("/app/purchase-icart");
  };

  return (
    <div className="page_wrapper">
      {/* Page header */}
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
      ) : (
        <>
          {/* ── iCarts ── */}
          <div
            className="icart_section_label_row icart_section_label_row_clickable"
            onClick={() => setIcartsOpen((v) => !v)}
          >
            <span className="icart_section_label">My iCarts</span>
            <span className="icart_section_count">{icarts.length}</span>
            <span className="icart_section_chevron">
              {icartsOpen ? (
                <MdExpandLess size={18} />
              ) : (
                <MdExpandMore size={18} />
              )}
            </span>
          </div>

          {icartsOpen &&
            (icarts.length === 0 ? (
              <div
                className="icart_empty_state"
                style={{ padding: "32px 0", marginBottom: 32 }}
              >
                <LuShoppingCart size={32} style={{ opacity: 0.3 }} />
                <p className="icart_empty_title">No iCarts yet</p>
                <p className="icart_empty_sub">
                  Your purchased iCarts will appear here.
                </p>
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

                <div className="icart_grid" style={{ marginBottom: 36 }}>
                  {icarts.map((cart) => (
                    <div key={cart.id} className="icart_item_card">
                      <div className="icart_item_top">
                        <div className="icart_item_icon">
                          <LuShoppingCart size={17} />
                        </div>
                        <StatusBadge
                          status={cart.status}
                          colors={icartStatusColors}
                        />
                      </div>
                      <div className="icart_item_serial">
                        {cart.serialNumber}
                      </div>
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
                      <div className="icart_item_meta">
                        <div className="icart_meta_row">
                          <span className="icart_meta_key">Contract</span>
                          <span className="icart_meta_val">
                            {cart.contract?.contractStatus || (
                              <span className="icart_meta_muted">
                                Not started
                              </span>
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
                      </div>
                      {cart.contractDetails?.invoices?.length > 0 && (
                        <div className="icart_item_invoices">
                          <MdReceiptLong size={13} />
                          {cart.contractDetails.invoices.length} invoice
                          {cart.contractDetails.invoices.length !== 1
                            ? "s"
                            : ""}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ))}

          {/* ── Contract Applications ── */}
          <div
            className="icart_section_label_row icart_section_label_row_clickable"
            onClick={() => setContractsOpen((v) => !v)}
          >
            <span className="icart_section_label">Contract Applications</span>
            <span className="icart_section_count">{contracts.length}</span>
            <span className="icart_section_chevron">
              {contractsOpen ? (
                <MdExpandLess size={18} />
              ) : (
                <MdExpandMore size={18} />
              )}
            </span>
          </div>

          {contractsOpen &&
            (contracts.length === 0 ? (
              <div className="icart_empty_state" style={{ padding: "32px 0" }}>
                <MdReceiptLong size={28} style={{ opacity: 0.3 }} />
                <p className="icart_empty_sub" style={{ margin: 0 }}>
                  No contract applications yet.
                </p>
              </div>
            ) : (
              <div className="contract_list">
                {contracts.map((contract) => {
                  const invoice = contract.invoiceDetails?.[0];
                  const cs =
                    contractStatusColors[contract.status] ||
                    contractStatusColors.SUBMITTED;
                  const is = invoice
                    ? invStatusColors[invoice.status] || invStatusColors.PENDING
                    : null;

                  return (
                    <div
                      key={contract.id}
                      className="contract_row"
                      onClick={() => setSelectedContract(contract)}
                    >
                      <div className="contract_row_left">
                        <div className="contract_row_icon">
                          <MdReceiptLong size={16} />
                        </div>
                        <div className="contract_row_info">
                          <div className="contract_row_top">
                            <span className="contract_row_id">
                              #{contract.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span
                              className="icart_status_badge"
                              style={{
                                background: cs.bg,
                                color: cs.color,
                                border: `1px solid ${cs.border}`,
                              }}
                            >
                              <MdCircle size={5} />
                              {contract.status}
                            </span>
                          </div>
                          <div className="contract_row_meta">
                            <span>{contract.type}</span>
                            <span className="contract_row_dot">·</span>
                            <span>
                              {contract.numberOfCarts} iCart
                              {contract.numberOfCarts !== 1 ? "s" : ""}
                            </span>
                            <span className="contract_row_dot">·</span>
                            <span>
                              {new Date(contract.createdAt).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="contract_row_right">
                        {invoice && is && (
                          <div className="contract_row_invoice">
                            <span className="contract_row_amount">
                              {Number(invoice.total).toLocaleString()}
                            </span>
                            <span
                              className="icart_status_badge"
                              style={{
                                background: is.bg,
                                color: is.color,
                                border: `1px solid ${is.border}`,
                                fontSize: "0.62rem",
                              }}
                            >
                              {invoice.status}
                            </span>
                          </div>
                        )}
                        <MdChevronRight
                          size={18}
                          style={{ color: "var(--text-muted)", flexShrink: 0 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
        </>
      )}

      <ContractDrawer
        contract={selectedContract}
        onClose={() => setSelectedContract(null)}
      />
    </div>
  );
}
