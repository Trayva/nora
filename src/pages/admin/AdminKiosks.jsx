import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  MdSearch,
  MdChevronLeft,
  MdChevronRight,
  MdCircle,
  MdExpandMore,
  MdExpandLess,
  MdOutlineStore,
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
import KioskDrawer from "../kiosk/KioskDrawer";


const fmt = (n) =>
  Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });
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
const toISO = (d) => d.toISOString().split("T")[0];

const STATUS_COLORS = {
  PURCHASED: {
    bg: "rgba(59,130,246,0.1)",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.25)",
  },
  LEASED: {
    bg: "rgba(203,108,220,0.1)",
    color: "var(--accent)",
    border: "rgba(203,108,220,0.25)",
  },
  AVAILABLE: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  INACTIVE: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.25)",
  },
};
const getStatus = (s) => STATUS_COLORS[s] || STATUS_COLORS.INACTIVE;

const pmColors = {
  CASH: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.2)",
  },
  POS: {
    bg: "rgba(59,130,246,0.1)",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.2)",
  },
  TRANSFER: {
    bg: "rgba(168,85,247,0.1)",
    color: "#a855f7",
    border: "rgba(168,85,247,0.2)",
  },
  OTHER: {
    bg: "rgba(107,114,128,0.1)",
    color: "#6b7280",
    border: "rgba(107,114,128,0.2)",
  },
};

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "All", days: null },
];


const ItemListSkeleton = ({ count = 5 }) => (
  <div style={{ padding: "0 10px", display: "flex", flexDirection: "column", gap: "px" }}>
    {Array(count).fill(0).map((_, i) => (
      <div key={i} className="admin_drawer_row">
        <div className="skeleton_shimmer skeleton_circle" style={{ width: "36px", height: "36px" }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton_shimmer skeleton_text" style={{ width: "40%", height: "14px", marginBottom: "8px" }} />
          <div className="skeleton_shimmer skeleton_text" style={{ width: "20%", height: "10px" }} />
        </div>
        <div className="skeleton_shimmer skeleton_rect" style={{ width: "80px", height: "24px", borderRadius: "20px" }} />
      </div>
    ))}
  </div>
);

/* ── Main list ────────────────────────────────────────────── */
export default function AdminKiosks() {
  const [carts, setCarts] = useState([]);
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serial, setSerial] = useState("");
  const [stateId, setStateId] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const limit = 20;
  const searchTimer = useRef(null);

  useEffect(() => {
    api
      .get("/config/state")
      .then((r) => {
        const d = r.data.data;
        setStates(Array.isArray(d) ? d : d?.states || d?.items || []);
      })
      .catch(() => { });
  }, []);

  const fetchCarts = async (s = serial, sid = stateId, p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (s.trim()) params.serialNumber = s.trim();
      if (sid) params.stateId = sid;
      const r = await api.get("/kiosk", { params });
      const d = r.data.data;
      const list = Array.isArray(d) ? d : d?.kiosks || d?.items || [];
      setCarts(list);
      setTotal(d?.total || list.length);
    } catch {
      toast.error("Failed to load Kiosks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, []);

  const handleSerial = (val) => {
    setSerial(val);
    setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchCarts(val, stateId, 1), 400);
  };

  const handleState = (val) => {
    setStateId(val);
    setPage(1);
    fetchCarts(serial, val, 1);
  };
  const handlePage = (p) => {
    setPage(p);
    fetchCarts(serial, stateId, p);
  };
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <div className="admin_section">
        <div className="admin_section_header">
          <span className="admin_section_title">Kiosk Fleet</span>
          <span className="admin_section_count">{total}</span>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
            <MdSearch
              size={15}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              className="modal-input"
              style={{ paddingLeft: 30, marginBottom: 0 }}
              placeholder="Serial number…"
              value={serial}
              onChange={(e) => handleSerial(e.target.value)}
            />
          </div>
          <select
            className="modal-input"
            style={{ marginBottom: 0, minWidth: 160 }}
            value={stateId}
            onChange={(e) => handleState(e.target.value)}
          >
            <option value="">All States</option>
            {states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* List */}
        {loading ? (
          <ItemListSkeleton />
        ) : carts.length === 0 ? (
          <div className="admin_empty">
            <p style={{ margin: 0, fontSize: "0.82rem" }}>No Kiosks found.</p>
          </div>
        ) : (
          <div className="admin_drawer_list">
            {carts.map((c) => {
              const s = getStatus(c.status);
              return (
                <div
                  key={c.id}
                  className="admin_drawer_row"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelected(c)}
                >
                  <div
                    className="admin_drawer_avatar"
                    style={{
                      background: "rgba(34,197,94,0.1)",
                      color: "#16a34a",
                      border: "1px solid rgba(34,197,94,0.2)",
                      fontFamily: "monospace",
                      fontSize: "0.62rem",
                      fontWeight: 900,
                    }}
                  >
                    <MdOutlineStore size={16} />
                  </div>
                  <div className="admin_drawer_info">
                    <div
                      className="admin_drawer_name"
                      style={{ fontFamily: "monospace" }}
                    >
                      {c.serialNumber}
                    </div>
                    <div className="admin_drawer_sub">
                      {c.location?.name || c.state?.name || "—"}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      flexShrink: 0,
                    }}
                  >
                    <span
                      className="admin_status_badge"
                      style={{
                        background: s.bg,
                        color: s.color,
                        border: `1px solid ${s.border}`,
                      }}
                    >
                      <MdCircle size={5} />
                      {c.status}
                    </span>
                    {c.isOnline != null && (
                      <span
                        className="admin_meta_chip"
                        style={{ color: c.isOnline ? "#16a34a" : "#6b7280" }}
                      >
                        {c.isOnline ? "Online" : "Offline"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 16,
            }}
          >
            <button
              className="biz_icon_btn"
              onClick={() => handlePage(page - 1)}
              disabled={page <= 1}
            >
              <MdChevronLeft size={16} />
            </button>
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              Page {page} of {totalPages}
            </span>
            <button
              className="biz_icon_btn"
              onClick={() => handlePage(page + 1)}
              disabled={page >= totalPages}
            >
              <MdChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      {selected && (
        <KioskDrawer
          kioskId={selected.id}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => {
            setSelected(updated);
            setCarts((prev) =>
              prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
            );
          }}
        />
      )}
    </>
  );
}
