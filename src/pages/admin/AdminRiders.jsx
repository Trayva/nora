import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdSearch,
  MdChevronRight,
  MdCircle,
  MdCheck,
  MdClose,
  MdOutlineLocationOn,
  MdExpandMore,
  MdExpandLess,
  MdDirectionsBike,
  MdLocalShipping,
  MdOutlineDateRange,
  MdAttachMoney,
  MdPerson,
} from "react-icons/md";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";

const fmt = (n) => Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtChart = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })
    : "";

const VEHICLE_LABELS = {
  BICYCLE: "Bicycle Courier",
  MOTORCYCLE: "Dispatch Rider",
  CAR: "Car Delivery",
};

const statusColors = {
  PENDING: { bg: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "rgba(234,179,8,0.2)" },
  APPROVED: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.2)" },
};

function StatusBadge({ isApproved }) {
  const label = isApproved ? "APPROVED" : "PENDING";
  const s = statusColors[label];
  return (
    <span className="op-status-badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <MdCircle size={5} />
      {label}
    </span>
  );
}

function RecentDeliveryRow({ delivery }) {
  const [expanded, setExpanded] = useState(false);
  const formattedFee = Number(delivery.deliveryFee || 0).toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
  const formattedTotal = Number(delivery.totalAmount || 0).toLocaleString("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

  return (
    <div className="admin_op_sale_row" style={{ display: "flex", flexDirection: "column", gap: 6, borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Order #{delivery.orderNumber || delivery.id.slice(0, 8).toUpperCase()}</span>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 2 }}>
            Kiosk {delivery.kiosk?.serialNumber || "—"} · {fmtDate(delivery.createdAt)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#22c55e" }}>+{formattedFee}</span>
          {expanded ? <MdExpandLess size={16} /> : <MdExpandMore size={16} />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "8px 10px", background: "var(--bg-active)", borderRadius: 8, fontSize: "0.8rem", display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Delivery Address:</span>
            <span>{delivery.deliveryAddress || "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Customer Name:</span>
            <span>{delivery.customerName || "Guest"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Total Order Value:</span>
            <span>{formattedTotal}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>Rider Fee Earned:</span>
            <span style={{ fontWeight: 600, color: "#22c55e" }}>{formattedFee}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function RiderDetail({ rider, onClose, onRefreshList }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/rider/${rider.id}/analytics`);
      setAnalytics(res.data.data);
    } catch {
      toast.error("Failed to load rider analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [rider.id]);

  const handleApprove = async () => {
    setActioning(true);
    try {
      await api.patch(`/rider/${rider.id}/approve`);
      toast.success("Rider profile approved successfully!");
      onRefreshList();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve rider");
    } finally {
      setActioning(false);
    }
  };

  const handleUnapprove = async () => {
    if (!window.confirm("Are you sure you want to deactivate this rider? This will revoke their Rider role.")) return;
    setActioning(true);
    try {
      await api.patch(`/rider/${rider.id}/unapprove`);
      toast.success("Rider profile deactivated successfully!");
      onRefreshList();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to deactivate rider");
    } finally {
      setActioning(false);
    }
  };

  const u = rider.user || {};
  const vehicle = VEHICLE_LABELS[rider.vehicleType] || rider.vehicleType;

  return (
    <Drawer
      isOpen={true}
      onClose={onClose}
      title="Rider Profile Details"
      description={`Manage approvals and view statistics for ${u.fullName || "Rider"}`}
      width={480}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "10px 0" }}>
        {/* Profile Card Info */}
        <div className="admin_op_card" style={{ display: "flex", gap: 16, alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: "var(--bg-active)", display: "flex", alignItems: "center", justifyItems: "center", overflow: "hidden", justifyContent: "center", flexShrink: 0 }}>
            {u.image ? (
              <img src={u.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <MdPerson size={24} style={{ color: "var(--text-muted)" }} />
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>{u.fullName || "—"}</span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{u.email}</span>
            {u.phone && <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{u.phone}</span>}
          </div>
          <StatusBadge isApproved={rider.isApproved} />
        </div>

        {/* Approval Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          {!rider.isApproved ? (
            <button
              className={`app_btn app_btn_confirm${actioning ? " btn_loading" : ""}`}
              style={{ flex: 1, height: 40, position: "relative" }}
              onClick={handleApprove}
              disabled={actioning}
            >
              <MdCheck size={16} />
              <span className="btn_text">Approve Application</span>
              {actioning && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
            </button>
          ) : (
            <button
              className={`app_btn app_btn_cancel${actioning ? " btn_loading" : ""}`}
              style={{ flex: 1, height: 40, position: "relative", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)" }}
              onClick={handleUnapprove}
              disabled={actioning}
            >
              <MdClose size={16} />
              <span className="btn_text">Deactivate Rider</span>
              {actioning && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
            </button>
          )}
        </div>

        {/* Vehicle Information */}
        <div className="admin_op_info_section">
          <h4 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>Vehicle Information</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "var(--bg-active)", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Vehicle Type:</span>
              <span style={{ fontWeight: 600 }}>{vehicle}</span>
            </div>
            {rider.plateNumber && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Plate Number:</span>
                <span style={{ fontWeight: 600 }}>{rider.plateNumber}</span>
              </div>
            )}
            {rider.licenseNumber && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-muted)" }}>License Number:</span>
                <span style={{ fontWeight: 600 }}>{rider.licenseNumber}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Operating State:</span>
              <span style={{ fontWeight: 600 }}>{rider.state?.name || "—"}</span>
            </div>
            {rider.vehicleDocument && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 8 }}>
                <span style={{ color: "var(--text-muted)" }}>Vehicle Reg Doc:</span>
                <a href={rider.vehicleDocument} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
                  View Document →
                </a>
              </div>
            )}
            {rider.licenseDocument && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: rider.vehicleDocument ? 0 : 8 }}>
                <span style={{ color: "var(--text-muted)" }}>Driver License:</span>
                <a href={rider.licenseDocument} target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: "var(--accent)", textDecoration: "none" }}>
                  View Document →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Analytics Loading or Render */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", padding: "20px 0" }}>
            <div className="rider-spinner" />
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Loading analytics...</span>
          </div>
        ) : (
          analytics && (
            <>
              {/* Analytics Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: "var(--bg-active)", padding: 14, borderRadius: 10, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)" }}>TOTAL EARNED</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "#22c55e" }}>
                    ₦{fmt(analytics.stats.totalEarnings)}
                  </span>
                </div>
                <div style={{ background: "var(--bg-active)", padding: 14, borderRadius: 10, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--text-muted)" }}>DELIVERIES</span>
                  <span style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                    {analytics.stats.totalCompleted} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 400 }}>completed</span>
                  </span>
                </div>
              </div>

              {/* Analytics Chart */}
              {analytics.chartData?.length > 0 && (
                <div>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>Earnings Trend (30d)</h4>
                  <div style={{ height: 180, width: "100%", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, padding: "10px 10px 0 0" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.chartData}>
                        <defs>
                          <linearGradient id="riderGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="date" tickFormatter={fmtChart} stroke="var(--text-muted)" style={{ fontSize: 9 }} tickLine={false} />
                        <YAxis stroke="var(--text-muted)" style={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(val) => `₦${fmt(val)}`} />
                        <Tooltip
                          contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}
                          labelStyle={{ fontSize: 10, color: "var(--text-muted)" }}
                          itemStyle={{ fontSize: 11, color: "#22c55e" }}
                          formatter={(val) => [`₦${Number(val).toLocaleString()}`, "Earnings"]}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#riderGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Recent Deliveries list */}
              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: 12 }}>Recent Deliveries</h4>
                {analytics.recentDeliveries?.length === 0 ? (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "center", padding: "12px 0" }}>No deliveries recorded yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {analytics.recentDeliveries.map((delivery) => (
                      <RecentDeliveryRow key={delivery.id} delivery={delivery} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )
        )}
      </div>
    </Drawer>
  );
}

export default function AdminRiders({ open, onClose }) {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stateId, setStateId] = useState("");
  const [states, setStates] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedRider, setSelectedRider] = useState(null);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/rider", {
        params: {
          search,
          stateId,
          page,
          limit: 20,
        },
      });
      setRiders(res.data.data.items || []);
      setTotal(res.data.data.total || 0);
    } catch {
      toast.error("Failed to fetch riders list");
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const res = await api.get("/config/state");
      const d = res.data.data;
      setStates(Array.isArray(d) ? d : d?.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (open) {
      fetchRiders();
      fetchStates();
    }
  }, [open, search, stateId, page]);

  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      title="Courier Delivery Riders"
      description="Manage courier applications, vehicle metadata, and state approvals"
      width={560}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%", padding: "10px 0" }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: 10 }}>
          <div className="admin_search_bar" style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, background: "var(--bg-active)", padding: "0 12px", borderRadius: 8, border: "1px solid var(--border)", height: 38 }}>
            <MdSearch size={18} style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search riders..."
              style={{ background: "transparent", border: "none", color: "var(--text)", outline: "none", fontSize: "0.85rem", width: "100%" }}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            style={{ height: 38, background: "var(--bg-active)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--text)", padding: "0 10px", outline: "none", fontSize: "0.85rem" }}
            value={stateId}
            onChange={(e) => {
              setStateId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Listing */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", padding: "40px 0" }}>
            <div className="rider-spinner" />
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Loading riders catalog...</span>
          </div>
        ) : riders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--bg-active)", borderRadius: 12, color: "var(--text-muted)" }}>
            <MdDirectionsBike size={32} style={{ opacity: 0.2, marginBottom: 12 }} />
            <div style={{ fontWeight: 600, color: "var(--text)" }}>No Riders Found</div>
            <div style={{ fontSize: "0.8rem", marginTop: 4 }}>No courier accounts match your filters.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowY: "auto", flex: 1, paddingBottom: 20 }}>
            {riders.map((r) => {
              const u = r.user || {};
              const vehicle = VEHICLE_LABELS[r.vehicleType] || r.vehicleType;
              return (
                <div
                  key={r.id}
                  className="admin_op_list_item"
                  style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 16px", cursor: "pointer", transition: "border-color 0.2s" }}
                  onClick={() => setSelectedRider(r)}
                >
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--bg-active)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {u.image ? (
                        <img src={u.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <MdPerson size={18} style={{ color: "var(--text-muted)" }} />
                      )}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: 700 }}>{u.fullName || "—"}</span>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {vehicle} · {r.state?.name || "No State"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <StatusBadge isApproved={r.isApproved} />
                    <MdChevronRight size={18} style={{ color: "var(--text-muted)" }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detail drawer popup */}
        {selectedRider && (
          <RiderDetail
            rider={selectedRider}
            onClose={() => setSelectedRider(null)}
            onRefreshList={fetchRiders}
          />
        )}
      </div>
    </Drawer>
  );
}
