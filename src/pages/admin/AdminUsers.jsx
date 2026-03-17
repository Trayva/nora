import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { MdSearch, MdChevronLeft, MdChevronRight } from "react-icons/md";
import { MdCircle } from "react-icons/md";
import api from "../../api/axios";
import AdminUserDetail from "./AdminUserDetail";

function initials(u) {
  return (u.fullName || u.email || "U").charAt(0).toUpperCase();
}

const ROLES_COLORS = {
  ADMIN: {
    bg: "rgba(203,108,220,0.1)",
    color: "var(--accent)",
    border: "rgba(203,108,220,0.25)",
  },
  VENDOR: {
    bg: "rgba(59,130,246,0.1)",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.25)",
  },
  OPERATOR: {
    bg: "rgba(245,158,11,0.1)",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.25)",
  },
  CUSTOMER: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
  SUPPLIER: {
    bg: "rgba(139,92,246,0.1)",
    color: "#8b5cf6",
    border: "rgba(139,92,246,0.25)",
  },
  AGGREGATOR: {
    bg: "rgba(6,182,212,0.1)",
    color: "#06b6d4",
    border: "rgba(6,182,212,0.25)",
  },
};

function RolePill({ role }) {
  const r = ROLES_COLORS[role] || ROLES_COLORS.CUSTOMER;
  return (
    <span
      style={{
        fontSize: "0.6rem",
        fontWeight: 800,
        padding: "1px 7px",
        borderRadius: 999,
        background: r.bg,
        color: r.color,
        border: `1px solid ${r.border}`,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {role}
    </span>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const limit = 20;
  const searchTimer = useRef(null);

  const fetchUsers = async (q = search, p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (q.trim()) params.search = q.trim();
      const r = await api.get("/account", { params });
      const d = r.data.data;
      const list = Array.isArray(d) ? d : d?.users || d?.items || [];
      setUsers(list);
      setTotal(d?.total || list.length);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchUsers(val, 1), 400);
  };

  const handlePage = (p) => {
    setPage(p);
    fetchUsers(search, p);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <>
      <div className="admin_section">
        <div className="admin_section_header">
          <span className="admin_section_title">Users</span>
          <span className="admin_section_count">{total}</span>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <MdSearch
            size={16}
            style={{
              position: "absolute",
              left: 11,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            className="modal-input"
            style={{ paddingLeft: 34, marginBottom: 0 }}
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {loading && (
            <div
              className="page_loader_spinner"
              style={{
                width: 14,
                height: 14,
                position: "absolute",
                right: 11,
                top: "50%",
                transform: "translateY(-50%)",
              }}
            />
          )}
        </div>

        {/* List */}
        {!loading && users.length === 0 ? (
          <div className="admin_empty">
            <p style={{ margin: 0, fontSize: "0.82rem" }}>No users found.</p>
          </div>
        ) : (
          <div className="admin_drawer_list">
            {users.map((u) => (
              <div
                key={u.id}
                className="admin_drawer_row"
                style={{ cursor: "pointer" }}
                onClick={() => setSelected(u)}
              >
                <div className="admin_drawer_avatar">{initials(u)}</div>
                <div className="admin_drawer_info">
                  <div className="admin_drawer_name">{u.fullName || "—"}</div>
                  <div className="admin_drawer_sub">{u.email}</div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    flexShrink: 0,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  {u.roles?.slice(0, 3).map((r) => (
                    <RolePill key={r.role || r} role={r.role || r} />
                  ))}
                  {!u.isActive && (
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 800,
                        padding: "1px 7px",
                        borderRadius: 999,
                        background: "rgba(239,68,68,0.1)",
                        color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.25)",
                      }}
                    >
                      INACTIVE
                    </span>
                  )}
                  {u.passwordLockedUntil && (
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 800,
                        padding: "1px 7px",
                        borderRadius: 999,
                        background: "rgba(239,68,68,0.1)",
                        color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.25)",
                      }}
                    >
                      LOCKED
                    </span>
                  )}
                </div>
              </div>
            ))}
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

      {/* User detail drawer */}
      {selected && (
        <AdminUserDetail
          user={selected}
          onClose={() => {
            setSelected(null);
            fetchUsers();
          }}
        />
      )}
    </>
  );
}
