import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../../api/axios";
import MaintenanceTab from "./MaintenanceTab";
import {
  MdSearch,
  MdTask,
  MdBuild,
  MdInfo,
  MdExpandMore,
  MdExpandLess,
  MdCheck,
  MdClose,
  MdCircle,
  MdLocationOn,
  MdSignalCellularAlt,
  MdWifi,
  MdWifiOff,
  MdLock,
  MdLockOpen,
  MdPerson,
  MdVerified,
  MdRestaurantMenu,
  MdStorefront,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdFileOpen,
} from "react-icons/md";
import { LuShoppingCart } from "react-icons/lu";
import { TbGridDots } from "react-icons/tb";

/* ── helpers ── */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "—";

function StatusBadge({ status }) {
  const map = {
    PENDING: { bg: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "rgba(234,179,8,0.25)" },
    IN_PROGRESS: { bg: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "rgba(59,130,246,0.25)" },
    COMPLETED: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.25)" },
    MISSED: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", border: "rgba(239,68,68,0.25)" },
    SUBMITTED: { bg: "rgba(168,85,247,0.1)", color: "#a855f7", border: "rgba(168,85,247,0.25)" },
    CREATED: { bg: "rgba(107,114,128,0.1)", color: "#6b7280", border: "rgba(107,114,128,0.25)" },
    ACTIVE: { bg: "rgba(34,197,94,0.1)", color: "#16a34a", border: "rgba(34,197,94,0.25)" },
  };
  const s = map[status] || map.CREATED;
  return (
    <span
      style={{
        fontSize: "0.62rem", fontWeight: 800, padding: "2px 8px",
        borderRadius: 999, background: s.bg, color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      <MdCircle size={5} style={{ verticalAlign: "middle", marginRight: 3 }} />
      {status}
    </span>
  );
}

/* ── Kiosk Details panel ── */
function CartDetailsPanel({ cart }) {
  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

  const vendor = cart.vendor;
  const brandColor = vendor?.brandColor;
  const gradientBg = brandColor
    ? `linear-gradient(135deg, ${brandColor}18 0%, ${brandColor}06 100%)`
    : "linear-gradient(135deg, rgba(203,108,220,0.08) 0%, rgba(203,108,220,0.02) 100%)";
  const borderCol = brandColor ? `${brandColor}33` : "rgba(203,108,220,0.15)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── Hero card ── */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        {/* Brand colour strip when vendor present */}
        {brandColor && <div style={{ height: 4, background: brandColor, opacity: 0.7 }} />}
        <div style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
            {/* Cart icon / brand logo */}
            {vendor?.brandLogo ? (
              <img src={vendor.brandLogo} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", flexShrink: 0, border: "2px solid var(--border)" }} />
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.2)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LuShoppingCart size={22} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--text-heading)", fontFamily: "monospace", letterSpacing: "0.04em" }}>
                  {cart.serialNumber}
                </span>
                <StatusBadge status={cart.status} />
              </div>
              {/* Status pills */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: cart.isOnline ? "rgba(34,197,94,0.1)" : "rgba(107,114,128,0.1)", color: cart.isOnline ? "#22c55e" : "#6b7280", border: `1px solid ${cart.isOnline ? "rgba(34,197,94,0.25)" : "rgba(107,114,128,0.25)"}` }}>
                  {cart.isOnline ? <MdWifi size={11} /> : <MdWifiOff size={11} />}
                  {cart.isOnline ? "Online" : "Offline"}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: cart.isLocked ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", color: cart.isLocked ? "#ef4444" : "#16a34a", border: `1px solid ${cart.isLocked ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}` }}>
                  {cart.isLocked ? <MdLock size={11} /> : <MdLockOpen size={11} />}
                  {cart.isLocked ? "Locked" : "Unlocked"}
                </span>
                {cart.serviceRadius > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "var(--bg-hover)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                    <MdSignalCellularAlt size={11} />{cart.serviceRadius} km
                  </span>
                )}
                {cart.contract && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "rgba(34,197,94,0.08)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)" }}>
                    {cart.contract.type}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
            {[
              { label: "Menu Items", value: cart.menuItems?.length > 0 ? String(cart.menuItems.length) : null },
              { label: "Operators", value: cart.operators?.length > 0 ? String(cart.operators.length) : null },
              // { label: "Concepts",    value: cart.concepts?.length > 0 ? String(cart.concepts.length) : null },
              { label: "Reports", value: cart.reports?.length > 0 ? String(cart.reports.length) : null },
              { label: "Contract", value: cart.contract?.status || null },
            ].filter((m) => m.value).map((m) => (
              <div key={m.label} style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 10, padding: "9px 12px" }}>
                <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-body)" }}>{m.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Vendor / Brand ── */}
      {vendor && (
        <div style={{ background: gradientBg, border: `1px solid ${borderCol}`, borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          {vendor.brandLogo ? (
            <img src={vendor.brandLogo} alt="" style={{ width: 44, height: 44, borderRadius: 11, objectFit: "cover", flexShrink: 0, border: "2px solid rgba(255,255,255,0.15)" }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0, background: "rgba(203,108,220,0.1)", border: "1px solid rgba(203,108,220,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MdStorefront size={20} style={{ color: "var(--accent)" }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 2 }}>Brand</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "var(--text-heading)" }}>{vendor.businessName}</div>
            {vendor.brandTagline && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{vendor.brandTagline}</div>}
            {vendor.user?.email && <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 2 }}>{vendor.user.email}</div>}
          </div>
          {brandColor && (
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: brandColor, flexShrink: 0, border: "3px solid rgba(255,255,255,0.2)", boxShadow: `0 0 8px ${brandColor}66` }} />
          )}
        </div>
      )}

      {/* ── Location ── */}
      {cart.location && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: "rgba(203,108,220,0.08)", border: "1px solid rgba(203,108,220,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MdLocationOn size={16} style={{ color: "var(--accent)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 4 }}>Location</div>
            <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 2 }}>{cart.location.name}</div>
            {[cart.location.address, cart.location.lga, cart.location.city, cart.location.country].filter(Boolean).join(", ") && (
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                {[cart.location.address, cart.location.lga, cart.location.city, cart.location.country].filter(Boolean).join(", ")}
              </div>
            )}
            {cart.location.latitude && cart.location.longitude && (
              <a
                href={`https://www.google.com/maps?q=${cart.location.latitude},${cart.location.longitude}`}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: "0.68rem", color: "var(--accent)", fontWeight: 700, textDecoration: "none", marginTop: 4, display: "inline-block" }}
              >
                {Number(cart.location.latitude).toFixed(5)}, {Number(cart.location.longitude).toFixed(5)} ↗
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Concepts ── */}
      {/* {cart.concepts?.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 10 }}>
            Concepts · {cart.concepts.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {cart.concepts.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  {c.description && <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.description}</div>}
                </div>
                {c.status && (
                  <span style={{ fontSize: "0.6rem", fontWeight: 800, padding: "2px 7px", borderRadius: 999, flexShrink: 0, background: c.status === "APPROVED" ? "rgba(34,197,94,0.1)" : "var(--bg-hover)", color: c.status === "APPROVED" ? "#16a34a" : "var(--text-muted)", border: `1px solid ${c.status === "APPROVED" ? "rgba(34,197,94,0.25)" : "var(--border)"}` }}>
                    {c.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* ── Menu items ── */}
      {cart.menuItems?.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 10 }}>
            Menu Items · {cart.menuItems.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {cart.menuItems.map((item, idx) => {
              const img = item.image;
              const price = item.sellingPrice || 0;
              const variantCount = item.variants?.length || 0;
              const extrasCount = item.extras?.length || 0;
              return (
                <div key={item.id || idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 10 }}>
                  {img ? (
                    <img src={img} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 38, height: 38, borderRadius: 8, flexShrink: 0, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MdRestaurantMenu size={15} style={{ color: "var(--text-muted)" }} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                    <div style={{ display: "flex", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                      {item.ticketTime > 0 && <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>⏱ {item.ticketTime}min</span>}
                      {variantCount > 0 && <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{variantCount} variant{variantCount !== 1 ? "s" : ""}</span>}
                      {extrasCount > 0 && <span style={{ fontSize: "0.62rem", color: "var(--text-muted)" }}>{extrasCount} extra{extrasCount !== 1 ? "s" : ""}</span>}
                    </div>
                  </div>
                  {price > 0 && <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>₦{fmt(price)}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Operators ── */}
      {cart.operators?.length > 0 && (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 10 }}>
            Operators · {cart.operators.length}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {cart.operators.map((op) => {
              const name = op.user?.fullName || op.user?.email || `Operator #${op.id?.slice(0, 6).toUpperCase()}`;
              return (
                <div key={op.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 900, color: "var(--accent)" }}>
                    {name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-body)", display: "flex", alignItems: "center", gap: 5 }}>
                      {name}
                      {op.isApproved && <MdVerified size={13} style={{ color: "#16a34a" }} />}
                    </div>
                    {op.user?.email && <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{op.user.email}</div>}
                  </div>
                  <span
                    style={{
                      fontSize: "0.62rem", fontWeight: 800, padding: "2px 8px",
                      borderRadius: 999, flexShrink: 0,
                      background: op.isApproved ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)",
                      color: op.isApproved ? "#16a34a" : "#ca8a04",
                      border: `1px solid ${op.isApproved ? "rgba(34,197,94,0.25)" : "rgba(234,179,8,0.25)"}`,
                    }}
                  >
                    {op.isApproved ? "Active" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tasks panel ── */
function TaskCard({ task }) {
  const [expanded, setExpanded] = useState(false);
  const schema = task.template?.schema?.fields || [];
  const isPending = task.status === "PENDING" || task.status === "IN_PROGRESS";

  return (
    <div
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden", marginBottom: 8,
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 14px", cursor: "pointer",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: "var(--bg-hover)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <MdTask size={14} style={{ color: "var(--text-muted)" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-body)", marginBottom: 2 }}>
            {task.template?.name || task.name || "Task"}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {task.template?.recurrence && (
              <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>{task.template.recurrence}</span>
            )}
            {task.dueAt && (
              <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>
                · Due {fmtDate(task.dueAt)}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={task.status} />
        {expanded
          ? <MdExpandLess size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          : <MdExpandMore size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
        }
      </div>

      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
          {task.data && Object.keys(task.data).length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em", color: "var(--text-muted)", marginBottom: 8 }}>
                Submitted Data
              </div>
              {Object.entries(task.data).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "7px 10px", background: "var(--bg-hover)",
                    border: "1px solid var(--border)", borderRadius: 8, marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)" }}>{k}</span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-body)" }}>
                    {typeof v === "boolean"
                      ? (v ? <MdCheck size={14} style={{ color: "#22c55e" }} /> : <MdClose size={14} style={{ color: "#ef4444" }} />)
                      : String(v)
                    }
                  </span>
                </div>
              ))}
            </div>
          )}
          {task.managerComments && (
            <div
              style={{
                marginTop: 10, padding: "9px 12px",
                background: "rgba(203,108,220,0.06)", border: "1px solid rgba(203,108,220,0.2)",
                borderRadius: 9,
              }}
            >
              <div style={{ fontSize: "0.62rem", fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                Manager Note
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-body)", lineHeight: 1.6 }}>
                {task.managerComments}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TasksPanel({ kioskId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/kiosk/tasks?kioskId=${kioskId}`);
      setTasks(res.data.data?.items || res.data.data || []);
    } catch {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTasks(); }, [kioskId]);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array(3).fill(0).map((_, i) => (
        <div key={i} className="skeleton_shimmer skeleton_rect" style={{ height: 60, borderRadius: 12 }} />
      ))}
    </div>
  );

  if (tasks.length === 0) {
    return (
      <div className="kiosk_empty_inline" style={{ padding: "40px 0" }}>
        <MdTask size={28} style={{ opacity: 0.3 }} />
        <span>No pending tasks</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text-heading)" }}>
          Pending & In-Progress Tasks
        </span>
        <span
          style={{
            fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px",
            borderRadius: 999, background: "var(--bg-hover)",
            color: "var(--text-muted)", border: "1px solid var(--border)",
          }}
        >
          {tasks.length}
        </span>
      </div>
      {tasks.map((t) => <TaskCard key={t.id} task={t} />)}
    </div>
  );
}

/* ── Tab config ── */
const TABS = [
  { key: "details", label: "Details", icon: <MdInfo size={14} /> },
  { key: "tasks", label: "Tasks", icon: <MdTask size={14} /> },
  { key: "maintenance", label: "Reports", icon: <MdFileOpen size={14} /> },
];

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function AggregatorPage() {
  const [serial, setSerial] = useState("");
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    const q = serial.trim().toUpperCase();
    if (!q) return toast.error("Enter a serial number");
    setSearching(true);
    setCart(null);
    setNotFound(false);
    setActiveTab("details");
    try {
      const res = await api.get(`/kiosk/${encodeURIComponent(q)}`);
      const found = res.data.data;
      if (!found?.id) {
        setNotFound(true);
        return;
      }
      setCart(found);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error(err.response?.data?.message || "Search failed");
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="page_wrapper">
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <TbGridDots size={18} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "var(--text-heading)" }}>
              Aggregator
            </h1>
            <p style={{ margin: 0, fontSize: "0.76rem", color: "var(--text-muted)" }}>
              Look up any Kiosk by serial number
            </p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div
        style={{
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "18px 20px", marginBottom: 24,
        }}
      >
        <label
          style={{
            display: "block", fontSize: "0.72rem", fontWeight: 800,
            textTransform: "uppercase", letterSpacing: "0.07em",
            color: "var(--text-muted)", marginBottom: 10,
          }}
        >
          Kiosk Serial Number
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <MdSearch
              size={16}
              style={{
                position: "absolute", left: 12, top: "50%",
                transform: "translateY(-50%)", color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              className="modal-input"
              style={{ paddingLeft: 36, height: 44, fontSize: "0.92rem", marginBottom: 0, fontFamily: "monospace", letterSpacing: "0.04em", textTransform: "uppercase" }}
              placeholder="e.g. KIOSK-00142"
              value={serial}
              onChange={(e) => setSerial(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            className={`app_btn app_btn_confirm${searching ? " btn_loading" : ""}`}
            style={{
              height: 44, padding: "0 22px", fontSize: "0.88rem",
              fontWeight: 800, position: "relative",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
              flexShrink: 0,
            }}
            onClick={handleSearch}
            disabled={searching}
          >
            <span className="btn_text"><MdSearch size={15} /> Search</span>
            {searching && <span className="btn_loader" style={{ width: 15, height: 15 }} />}
          </button>
        </div>
      </div>

      {/* Not found */}
      {notFound && (
        <div
          style={{
            padding: "28px 20px",
            background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 14, textAlign: "center",
          }}
        >
          <LuShoppingCart size={28} style={{ color: "#ef4444", opacity: 0.5, marginBottom: 8 }} />
          <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#ef4444", marginBottom: 4 }}>
            Kiosk not found
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            No Kiosk matched serial number <strong style={{ fontFamily: "monospace" }}>"{serial}"</strong>
          </div>
        </div>
      )}

      {/* Results */}
      {cart && (
        <div>
          {/* Tab bar */}
          <div
            style={{
              display: "flex", borderBottom: "1px solid var(--border)",
              marginBottom: 20, background: "var(--bg-card)",
              borderRadius: "12px 12px 0 0", padding: "0 4px",
              overflowX: "auto", scrollbarWidth: "none",
            }}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "12px 18px", background: "transparent", border: "none",
                    borderBottom: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                    color: active ? "var(--accent)" : "var(--text-muted)",
                    fontSize: "0.82rem", fontWeight: active ? 700 : 600,
                    cursor: "pointer", whiteSpace: "nowrap",
                    fontFamily: "inherit", transition: "color 0.15s, border-color 0.15s",
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "details" && <CartDetailsPanel cart={cart} />}
          {activeTab === "tasks" && <TasksPanel kioskId={cart.id} />}
          {activeTab === "maintenance" && (
            <MaintenanceTab kioskId={cart.id} canUpdateStatus={true} />
          )}
        </div>
      )}

      {/* Empty state — before any search */}
      {!cart && !notFound && !searching && (
        <div
          style={{
            padding: "48px 20px", textAlign: "center",
            background: "var(--bg-card)", border: "1px solid var(--border)",
            borderRadius: 16,
          }}
        >
          <div
            style={{
              width: 64, height: 64, borderRadius: 16, margin: "0 auto 16px",
              background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <TbGridDots size={28} style={{ color: "var(--accent)", opacity: 0.6 }} />
          </div>
          <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-heading)", marginBottom: 6 }}>
            Enter a serial number to begin
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", maxWidth: 280, margin: "0 auto" }}>
            Search for any Kiosk by its serial number to view details, tasks, and maintenance reports.
          </div>
        </div>
      )}
    </div>
  );
}