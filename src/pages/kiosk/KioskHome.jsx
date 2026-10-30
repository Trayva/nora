import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import ContractDrawer from "./ContractDrawer";
import KioskDrawer from "./KioskDrawer";
import api from "../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import useCurrencyDisplay from "../../hooks/useCurrencyDisplay";
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
  MdOutlineKitchen,
  MdCloud,
  MdStorefront,
  MdNavigateBefore,
  MdNavigateNext,
  MdPerson,
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

import {
  CardSkeleton,
  TableSkeleton,
} from "../../components/SkeletonTemplates";

export default function KioskHome() {
  const { user } = useAuth();
  const isBrand = Boolean(
    user?.Vendor ||
    user?.vendorId ||
    user?.roles?.includes("BRAND") ||
    user?.roles?.includes("VENDOR") ||
    user?.role === "BRAND" ||
    user?.role === "VENDOR"
  );

  const { format: fmt } = useCurrencyDisplay();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedKioskId = searchParams.get("kioskId");
  const [kiosks, setKiosks] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [kiosksOpen, setKiosksOpen] = useState(true);
  const [contractsOpen, setContractsOpen] = useState(true);
  const [deactivatedOpen, setDeactivatedOpen] = useState(false);

  // Franchisees state for Brand view
  const [activeScope, setActiveScope] = useState("my_outlets"); // "my_outlets" | "franchisees"
  const [franchiseeKiosks, setFranchiseeKiosks] = useState([]);
  const [franchiseePage, setFranchiseePage] = useState(1);
  const [franchiseePages, setFranchiseePages] = useState(1);
  const [franchiseeTotal, setFranchiseeTotal] = useState(0);
  const [franchiseeLoading, setFranchiseeLoading] = useState(false);
  const [isFranchiseeDrawer, setIsFranchiseeDrawer] = useState(false);

  const fetchFranchiseeKiosks = async (page = 1) => {
    setFranchiseeLoading(true);
    try {
      const res = await api.get("/kiosk/franchisees", {
        params: { page, limit: 12 },
      });
      const data = res.data?.data || {};
      setFranchiseeKiosks(data.items || []);
      setFranchiseeTotal(data.total || 0);
      setFranchiseePages(data.pages || 1);
      setFranchiseePage(data.page || page);
    } catch (err) {
      console.error("Failed to load franchisee kiosks:", err);
    } finally {
      setFranchiseeLoading(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [kiosksRes, contractsRes] = await Promise.all([
          api.get("/kiosk/vendor"),
          api.get("/contract/application"),
        ]);
        setKiosks(kiosksRes.data?.data?.items || []);
        setContracts(contractsRes.data?.data?.items || []);
      } catch {
        toast.error("Failed to load Kiosk data");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();

    if (isBrand) {
      fetchFranchiseeKiosks(1);
    }
  }, [isBrand]);

  const handleKioskUpdate = (updatedKiosk) => {
    setKiosks((prev) =>
      prev.map((k) =>
        k.id === updatedKiosk.id ? { ...k, ...updatedKiosk } : k
      )
    );
    setFranchiseeKiosks((prev) =>
      prev.map((k) =>
        k.id === updatedKiosk.id ? { ...k, ...updatedKiosk } : k
      )
    );
  };

  const activeKiosks = kiosks.filter((k) => k.status !== "INACTIVE");
  const deactivatedKiosks = kiosks.filter((k) => k.status === "INACTIVE");

  return (
    <div className="page_wrapper">
      {/* Page header */}
      <div className="kiosk_page_header">
        <div>
          {isBrand ? null : <><h2 className="page_title_big m-0">Outlets</h2>
            <p className="welcome_message" style={{ marginBottom: 0 }}>
              Purchase and manage your franchise
            </p></>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            className="kiosk_franchise_add_btn"
            onClick={() => navigate(isBrand ? "/app/create-outlet" : "/app/purchase-kiosk?tab=franchise")}
            title={isBrand ? "Create Brand Outlet" : "Buy Franchise"}
            aria-label={isBrand ? "Create Brand Outlet" : "Buy Franchise"}
          >
            <MdAdd size={22} />
          </button>
          {/* <button
            className="kiosk_buy_btn"
            onClick={() => navigate("/app/purchase-kiosk?tab=hardware")}
            title="Purchase Hardware Kiosk"
            aria-label="Purchase Hardware Kiosk"
          >
            <span className="kiosk_buy_icon">
              <MdOutlineKitchen size={16} />
            </span>
          </button> */}
        </div>
      </div>

      {/* ── Brand Scope Switcher (My Outlets vs Franchisees) ── */}
      {isBrand && (
        <div className="kiosk_home_scope_switcher">
          <button
            type="button"
            className={`kiosk_scope_btn ${activeScope === "my_outlets" ? "active" : ""}`}
            onClick={() => {
              setActiveScope("my_outlets");
              setIsFranchiseeDrawer(false);
            }}
          >
            <LuStore size={16} />
            <span>My Outlets</span>
            {/* <span className="kiosk_scope_badge">{activeKiosks.length}</span> */}
          </button>
          <button
            type="button"
            className={`kiosk_scope_btn ${activeScope === "franchisees" ? "active" : ""}`}
            onClick={() => {
              setActiveScope("franchisees");
              if (franchiseeKiosks.length === 0) {
                fetchFranchiseeKiosks(1);
              }
            }}
          >
            <MdStorefront size={17} />
            <span>Franchisees Outlets</span>
            {/* <span className="kiosk_scope_badge">{franchiseeTotal}</span> */}
          </button>
        </div>
      )}

      {activeScope === "franchisees" ? (
        franchiseeLoading && franchiseeKiosks.length === 0 ? (
          <div style={{ marginTop: "24px" }}>
            <div
              className="skeleton_shimmer skeleton_text"
              style={{ width: "150px", height: "18px", marginBottom: "20px" }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "20px",
                marginBottom: "40px",
              }}
            >
              {Array(4)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="kiosk_item_card"
                    style={{ height: "200px" }}
                  >
                    <div
                      className="skeleton_shimmer skeleton_rect"
                      style={{ height: "100%", borderRadius: "12px" }}
                    />
                  </div>
                ))}
            </div>
          </div>
        ) : franchiseeKiosks.length === 0 ? (
          <div
            className="kiosk_empty_state"
            style={{ padding: "48px 0", marginBottom: 32 }}
          >
            <MdStorefront size={36} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p className="kiosk_empty_title">No Franchisee Outlets Yet</p>
            <p className="kiosk_empty_sub">
              When partners purchase your franchise brand, their active kitchens will appear here for oversight.
            </p>
          </div>
        ) : (
          <>
            <div className="kiosk_summary_row">
              <div className="kiosk_summary_chip">
                <MdStorefront size={14} />
                {franchiseeTotal} Franchisee Outlet{franchiseeTotal !== 1 ? "s" : ""}
              </div>
              <div className="kiosk_summary_chip">
                <MdCircle size={7} style={{ color: "#22c55e" }} />
                {franchiseeKiosks.filter((k) => k.isOnline).length} Online
              </div>
              <div className="kiosk_summary_chip">
                <MdLockOpen size={13} />
                {franchiseeKiosks.filter((k) => !k.isLocked).length} Unlocked
              </div>
            </div>

            <div className="kiosk_grid" style={{ marginBottom: 36 }}>
              {franchiseeKiosks.map((kiosk) => {
                const outletTypeLabel =
                  kiosk.kitchenType === "CLOUD" || kiosk.outletType === "CLOUD_KITCHEN" || kiosk.outletType === "CLOUD"
                    ? "Cloud Kitchen"
                    : kiosk.kitchenType === "STORE_FRONT" || kiosk.outletType === "STORE_FRONT"
                      ? "Store Front"
                      : "Physical Kiosk";

                return (
                  <div
                    key={kiosk.id}
                    className="kiosk_item_card"
                    style={{ cursor: "pointer" }}
                    onClick={() => {
                      setIsFranchiseeDrawer(true);
                      const params = new URLSearchParams(searchParams);
                      params.set("kioskId", kiosk.id);
                      setSearchParams(params);
                    }}
                  >
                    <div className="kiosk_item_top">
                      <div className="kiosk_item_icon">
                        <MdStorefront size={18} />
                      </div>
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <span
                          style={{
                            fontSize: "0.6rem",
                            fontWeight: 800,
                            padding: "2px 7px",
                            borderRadius: 20,
                            background:
                              outletTypeLabel === "Cloud Kitchen"
                                ? "rgba(99,102,241,0.12)"
                                : "rgba(34,197,94,0.1)",
                            color:
                              outletTypeLabel === "Cloud Kitchen"
                                ? "#6366f1"
                                : "#16a34a",
                            border: `1px solid ${outletTypeLabel === "Cloud Kitchen"
                              ? "rgba(99,102,241,0.3)"
                              : "rgba(34,197,94,0.3)"
                              }`,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {outletTypeLabel === "Cloud Kitchen" ? (
                            <>
                              <MdCloud size={10} /> Cloud
                            </>
                          ) : (
                            <>
                              <MdOutlineKitchen size={10} /> Kiosk
                            </>
                          )}
                        </span>
                        <StatusBadge
                          status={kiosk.status}
                          colors={kioskStatusColors}
                        />
                      </div>
                    </div>

                    <div className="kiosk_item_serial">{kiosk.serialNumber}</div>

                    <div className="kiosk_item_indicators">
                      <span
                        className={`kiosk_indicator ${kiosk.isOnline ? "kiosk_ind_on" : "kiosk_ind_off"
                          }`}
                      >
                        {kiosk.isOnline ? <MdWifi size={12} /> : <MdWifiOff size={12} />}
                        {kiosk.isOnline ? "Online" : "Offline"}
                      </span>
                      <span
                        className={`kiosk_indicator ${kiosk.isLocked ? "kiosk_ind_locked" : "kiosk_ind_unlocked"
                          }`}
                      >
                        {kiosk.isLocked ? <MdLock size={11} /> : <MdLockOpen size={11} />}
                        {kiosk.isLocked ? "Locked" : "Unlocked"}
                      </span>
                    </div>

                    <div className="kiosk_item_meta">
                      <div className="kiosk_meta_row">
                        <span className="kiosk_meta_key">Franchisee</span>
                        <span className="kiosk_meta_val" style={{ fontWeight: 700 }}>
                          {kiosk.owner?.fullName || "Licensed Partner"}
                        </span>
                      </div>
                      <div className="kiosk_meta_row">
                        <span className="kiosk_meta_key">Location</span>
                        <span className="kiosk_meta_val">
                          {kiosk.location?.name || kiosk.location?.address ? (
                            <span className="kiosk_location_val">
                              <MdLocationOn size={12} />
                              {kiosk.location.name || kiosk.location.address}
                            </span>
                          ) : (
                            <span className="kiosk_meta_muted">Not assigned</span>
                          )}
                        </span>
                      </div>
                      <div className="kiosk_meta_row">
                        <span className="kiosk_meta_key">Operating</span>
                        <span className="kiosk_meta_val">
                          {kiosk.operatingHours || "08:00 - 22:00"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {franchiseePages > 1 && (
              <div className="kiosk_pagination_row">
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  Page {franchiseePage} of {franchiseePages} ({franchiseeTotal} total outlets)
                </span>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="kiosk_page_btn"
                    disabled={franchiseePage <= 1 || franchiseeLoading}
                    onClick={() => fetchFranchiseeKiosks(franchiseePage - 1)}
                  >
                    <MdNavigateBefore size={16} /> Previous
                  </button>
                  <button
                    type="button"
                    className="kiosk_page_btn"
                    disabled={franchiseePage >= franchiseePages || franchiseeLoading}
                    onClick={() => fetchFranchiseeKiosks(franchiseePage + 1)}
                  >
                    Next <MdNavigateNext size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )
      ) : loading ? (
        <div style={{ marginTop: "24px" }}>
          <div
            className="skeleton_shimmer skeleton_text"
            style={{ width: "120px", height: "18px", marginBottom: "20px" }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
              marginBottom: "40px",
            }}
          >
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="kiosk_item_card"
                  style={{ height: "200px" }}
                >
                  <div
                    className="skeleton_shimmer skeleton_rect"
                    style={{ height: "100%", borderRadius: "12px" }}
                  />
                </div>
              ))}
          </div>
          <div
            className="skeleton_shimmer skeleton_text"
            style={{ width: "150px", height: "18px", marginBottom: "20px" }}
          />
          <TableSkeleton rows={4} cols={3} />
        </div>
      ) : (
        <>
          {/* ── Kiosks ── */}
          <div
            className="kiosk_section_label_row kiosk_section_label_row_clickable"
            onClick={() => setKiosksOpen((v) => !v)}
          >
            <span className="kiosk_section_label">My Outlets</span>
            <span className="kiosk_section_count">{activeKiosks.length}</span>
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
                <p className="kiosk_empty_title">No Outlets yet</p>
                <p className="kiosk_empty_sub">
                  Your purchased Outlets will appear here.
                </p>
              </div>
            ) : (
              <>
                <div className="kiosk_summary_row">
                  <div className="kiosk_summary_chip">
                    <LuStore size={13} />
                    {activeKiosks.length} Kitchen
                    {activeKiosks.length !== 1 ? "s" : ""}
                  </div>
                  <div className="kiosk_summary_chip">
                    <MdCircle size={7} style={{ color: "#22c55e" }} />
                    {activeKiosks.filter((k) => k.isOnline).length} Online
                  </div>
                  <div className="kiosk_summary_chip">
                    <MdLockOpen size={13} />
                    {activeKiosks.filter((k) => !k.isLocked).length} Unlocked
                  </div>
                </div>

                <div className="kiosk_grid" style={{ marginBottom: 36 }}>
                  {activeKiosks.map((kiosk) => (
                    <div
                      key={kiosk.id}
                      className="kiosk_item_card"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setIsFranchiseeDrawer(false);
                        const params = new URLSearchParams(searchParams);
                        params.set("kioskId", kiosk.id);
                        setSearchParams(params);
                      }}
                    >
                      <div className="kiosk_item_top">
                        <div className="kiosk_item_icon">
                          <LuStore size={17} />
                        </div>
                        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                          {kiosk.kitchenType && (
                            <span style={{
                              fontSize: "0.6rem",
                              fontWeight: 800,
                              padding: "2px 7px",
                              borderRadius: 20,
                              background: kiosk.kitchenType === "CLOUD" ? "rgba(99,102,241,0.12)" : "rgba(34,197,94,0.1)",
                              color: kiosk.kitchenType === "CLOUD" ? "#6366f1" : "#16a34a",
                              border: `1px solid ${kiosk.kitchenType === "CLOUD" ? "rgba(99,102,241,0.3)" : "rgba(34,197,94,0.3)"}`,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                            }}>
                              {kiosk.kitchenType === "CLOUD"
                                ? <><MdCloud size={10} /> Cloud</>
                                : <><MdOutlineKitchen size={10} /> Kiosk</>}
                            </span>
                          )}
                          <StatusBadge
                            status={kiosk.status}
                            colors={kioskStatusColors}
                          />
                        </div>
                      </div>

                      <div className="kiosk_item_serial">
                        {kiosk.serialNumber}
                      </div>

                      <div className="kiosk_item_indicators">
                        <span
                          className={`kiosk_indicator ${kiosk.isOnline ? "kiosk_ind_on" : "kiosk_ind_off"
                            }`}
                        >
                          {kiosk.isOnline ? (
                            <MdWifi size={12} />
                          ) : (
                            <MdWifiOff size={12} />
                          )}
                          {kiosk.isOnline ? "Online" : "Offline"}
                        </span>
                        <span
                          className={`kiosk_indicator ${kiosk.isLocked
                            ? "kiosk_ind_locked"
                            : "kiosk_ind_unlocked"
                            }`}
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

          {/* ── Deactivated Kiosks ── */}
          {deactivatedKiosks.length > 0 && (
            <>
              <div
                className="kiosk_section_label_row kiosk_section_label_row_clickable"
                style={{ marginTop: 12 }}
                onClick={() => setDeactivatedOpen((v) => !v)}
              >
                <span
                  className="kiosk_section_label"
                  style={{ color: "var(--text-muted)" }}
                >
                  Deactivated Outlets
                </span>
                <span className="kiosk_section_count">
                  {deactivatedKiosks.length}
                </span>
                <span className="kiosk_section_chevron">
                  {deactivatedOpen ? (
                    <MdExpandLess size={18} />
                  ) : (
                    <MdExpandMore size={18} />
                  )}
                </span>
              </div>

              {deactivatedOpen && (
                <div
                  className="kiosk_grid"
                  style={{ marginBottom: 36, opacity: 0.6 }}
                >
                  {deactivatedKiosks.map((kiosk) => (
                    <div
                      key={kiosk.id}
                      className="kiosk_item_card"
                      style={{ cursor: "pointer", grayscale: 1 }}
                      onClick={() => {
                        setIsFranchiseeDrawer(false);
                        const params = new URLSearchParams(searchParams);
                        params.set("kioskId", kiosk.id);
                        setSearchParams(params);
                      }}
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
                        <span className="kiosk_indicator kiosk_ind_off">
                          <MdWifiOff size={12} /> Offline
                        </span>
                        <span className="kiosk_indicator kiosk_ind_locked">
                          <MdLock size={11} /> Locked
                        </span>
                      </div>

                      <div className="kiosk_item_meta">
                        <div className="kiosk_meta_row">
                          <span className="kiosk_meta_key">Status</span>
                          <span
                            className="kiosk_meta_val"
                            style={{ color: "#ef4444" }}
                          >
                            Deactivated
                          </span>
                        </div>
                        <div className="kiosk_meta_row">
                          <span className="kiosk_meta_key">Location</span>
                          <span className="kiosk_meta_val">
                            {kiosk.location?.name || "Not assigned"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Contract Applications ── */}
          {/* <div
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
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="contract_row_right">
                        {invoice && is && (
                          <div className="contract_row_invoice">
                            <span className="contract_row_amount">
                              {fmt(invoice.total, invoice.currency || "NGN")}
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
            ))} */}
        </>
      )}

      {/* Contract drawer */}
      {/* <ContractDrawer
        contract={selectedContract}
        onClose={() => setSelectedContract(null)}
      /> */}

      {/* Kiosk detail drawer */}
      <KioskDrawer
        kioskId={selectedKioskId}
        onClose={() => {
          const params = new URLSearchParams(searchParams);
          params.delete("kioskId");
          setSearchParams(params);
          setIsFranchiseeDrawer(false);
        }}
        onUpdate={handleKioskUpdate}
        isBrandView={Boolean(
          activeScope === "franchisees" &&
          (isFranchiseeDrawer || !kiosks.some((k) => k.id === selectedKioskId))
        )}
      />
    </div>
  );
}
