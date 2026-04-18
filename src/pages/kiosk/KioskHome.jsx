import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ContractDrawer from "./ContractDrawer";
import KioskDrawer from "./KioskDrawer";
import api from "../../api/axios";
import "./Kiosk.css";
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
  MdLocationOn,
} from "react-icons/md";
import { LuStore } from "react-icons/lu"; // Changed icon to LuStore for Kiosk

const kioskStatusColors = {
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
      className="kiosk_status_badge"
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

import { CardSkeleton, TableSkeleton } from "../../components/SkeletonTemplates";

export default function KioskHome() {
  const navigate = useNavigate();
  const [kiosks, setKiosks] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedKioskId, setSelectedKioskId] = useState(null);
  const [kiosksOpen, setKiosksOpen] = useState(true);
  const [contractsOpen, setContractsOpen] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [kiosksRes, contractsRes] = await Promise.all([
          api.get("/kiosk/vendor"),
          api.get("/contract/application"),
        ]);
        setKiosks(kiosksRes.data.data.items || []);
        setContracts(contractsRes.data.data.items || []);
      } catch {
        toast.error("Failed to load Kiosk data");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // When a kiosk is updated from inside the drawer, sync it back to the list
  const handleKioskUpdate = (updatedKiosk) => {
    setKiosks((prev) =>
      prev.map((k) => (k.id === updatedKiosk.id ? { ...k, ...updatedKiosk } : k)),
    );
  };

  return (
    <div className="page_wrapper">
      {/* Page header */}
      <div className="kiosk_page_header">
        <div>
          <h2 className="page_title_big m-0">Kiosk</h2>
          <p className="welcome_message" style={{ marginBottom: 0 }}>
            Purchase and manage your Kiosks
          </p>
        </div>
        <button
          className="app_btn app_btn_confirm shift-right"
          style={{ height: 40, display: "flex", alignItems: "center", gap: 6 }}
          onClick={() => navigate("/app/purchase-kiosk")}
        >
          <MdAdd size={17} />
          Purchase Kiosk
        </button>
      </div>

      {loading ? (
        <div style={{ marginTop: "24px" }}>
          <div className="skeleton_shimmer skeleton_text" style={{ width: "120px", height: "18px", marginBottom: "20px" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", marginBottom: "40px" }}>
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="kiosk_item_card" style={{ height: "200px" }}>
                <div className="skeleton_shimmer skeleton_rect" style={{ height: "100%", borderRadius: "12px" }} />
              </div>
            ))}
          </div>
          <div className="skeleton_shimmer skeleton_text" style={{ width: "150px", height: "18px", marginBottom: "20px" }} />
          <TableSkeleton rows={4} cols={3} />
        </div>
      ) : (
        <>
          {/* ── Kiosks ── */}
          <div
            className="kiosk_section_label_row kiosk_section_label_row_clickable"
            onClick={() => setKiosksOpen((v) => !v)}
          >
            <span className="kiosk_section_label">My Kiosks</span>
            <span className="kiosk_section_count">{kiosks.length}</span>
            <span className="kiosk_section_chevron">
              {kiosksOpen ? (
                <MdExpandLess size={18} />
              ) : (
                <MdExpandMore size={18} />
              )}
            </span>
          </div>

          {kiosksOpen &&
            (kiosks.length === 0 ? (
              <div
                className="kiosk_empty_state"
                style={{ padding: "32px 0", marginBottom: 32 }}
              >
                <LuStore size={32} style={{ opacity: 0.3 }} />
                <p className="kiosk_empty_title">No Kiosks yet</p>
                <p className="kiosk_empty_sub">
                  Your purchased Kiosks will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="kiosk_summary_row">
                  <div className="kiosk_summary_chip">
                    <LuStore size={13} />
                    {kiosks.length} Kiosk{kiosks.length !== 1 ? "s" : ""}
                  </div>
                  <div className="kiosk_summary_chip">
                    <MdCircle size={7} style={{ color: "#22c55e" }} />
                    {kiosks.filter((k) => k.isOnline).length} Online
                  </div>
                  <div className="kiosk_summary_chip">
                    <MdLockOpen size={13} />
                    {kiosks.filter((k) => !k.isLocked).length} Unlocked
                  </div>
                </div>

                <div className="kiosk_grid" style={{ marginBottom: 36 }}>
                  {kiosks.map((kiosk) => (
                    <div
                      key={kiosk.id}
                      className="kiosk_item_card"
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedKioskId(kiosk.id)}
                    >
                      <div className="kiosk_item_top">
                        <div className="kiosk_item_icon">
                          <LuStore size={17} />
                        </div>
                        <StatusBadge
                          status={kiosk.status}
                          colors={kioskStatusColors}
                        />
                      </div>

                      <div className="kiosk_item_serial">
                        {kiosk.serialNumber}
                      </div>

                      <div className="kiosk_item_indicators">
                        <span
                          className={`kiosk_indicator ${kiosk.isOnline ? "kiosk_ind_on" : "kiosk_ind_off"}`}
                        >
                          {kiosk.isOnline ? (
                            <MdWifi size={12} />
                          ) : (
                            <MdWifiOff size={12} />
                          )}
                          {kiosk.isOnline ? "Online" : "Offline"}
                        </span>
                        <span
                          className={`kiosk_indicator ${kiosk.isLocked ? "kiosk_ind_locked" : "kiosk_ind_unlocked"}`}
                        >
                          {kiosk.isLocked ? (
                            <MdLock size={11} />
                          ) : (
                            <MdLockOpen size={11} />
                          )}
                          {kiosk.isLocked ? "Locked" : "Unlocked"}
                        </span>
                      </div>

                      <div className="kiosk_item_meta">
                        {kiosk?.status !== "PURCHASED" ? (
                          <div className="kiosk_meta_row">
                            <span className="kiosk_meta_key">Contract</span>
                            <span className="kiosk_meta_val">
                              {kiosk.contract?.contractStatus || (
                                <span className="kiosk_meta_muted">
                                  Not started
                                </span>
                              )}
                            </span>
                          </div>
                        ) : null}
                        <div className="kiosk_meta_row">
                          <span className="kiosk_meta_key">Brand</span>
                          <span className="kiosk_meta_val">
                            {kiosk.vendor ? (
                              kiosk.vendor.businessName
                            ) : (
                              <span className="kiosk_meta_muted">None</span>
                            )}
                          </span>
                        </div>
                        <div className="kiosk_meta_row">
                          <span className="kiosk_meta_key">Location</span>
                          <span className="kiosk_meta_val">
                            {kiosk.location?.name ? (
                              <span className="kiosk_location_val">
                                <MdLocationOn size={12} />
                                {kiosk.location.name}
                              </span>
                            ) : (
                              <span className="kiosk_meta_muted">
                                Not assigned
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {kiosk.contractDetails?.invoices?.length > 0 && (
                        <div className="kiosk_item_invoices">
                          <MdReceiptLong size={13} />
                          {kiosk.contractDetails.invoices.length} invoice
                          {kiosk.contractDetails.invoices.length !== 1
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
            className="kiosk_section_label_row kiosk_section_label_row_clickable"
            onClick={() => setContractsOpen((v) => !v)}
          >
            <span className="kiosk_section_label">Contract Applications</span>
            <span className="kiosk_section_count">{contracts.length}</span>
            <span className="kiosk_section_chevron">
              {contractsOpen ? (
                <MdExpandLess size={18} />
              ) : (
                <MdExpandMore size={18} />
              )}
            </span>
          </div>

          {contractsOpen &&
            (contracts.length === 0 ? (
              <div className="kiosk_empty_state" style={{ padding: "32px 0" }}>
                <MdReceiptLong size={28} style={{ opacity: 0.3 }} />
                <p className="kiosk_empty_sub" style={{ margin: 0 }}>
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
                              className="kiosk_status_badge"
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
                              {contract.numberOfKiosks} Kiosk
                              {contract.numberOfKiosks !== 1 ? "s" : ""}
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
                              className="kiosk_status_badge"
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

      {/* Contract drawer */}
      <ContractDrawer
        contract={selectedContract}
        onClose={() => setSelectedContract(null)}
      />

      {/* Kiosk detail drawer */}
      <KioskDrawer
        kioskId={selectedKioskId}
        onClose={() => setSelectedKioskId(null)}
        onUpdate={handleKioskUpdate}
      />
    </div>
  );
}
