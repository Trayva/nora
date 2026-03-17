import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdOutlinePeople,
  MdOutlineStore,
  MdOutlineBadge,
  MdOutlineShoppingCart,
  MdOutlineLocalShipping,
  MdOutlineFactCheck,
  MdOutlineLocationOn,
  MdClose,
  MdCheck,
  MdCircle,
  MdArrowForward,
  MdOutlineTrendingUp,
  MdOutlineHub,
} from "react-icons/md";
import { LuPlus } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";
import AdminSalesFormula from "./AdminSalesFormula";
import AdminRentalSettings from "./AdminRentalSettings";
import AdminContractSettings from "./AdminContractSettings";
import AdminSalesAnalytics from "./AdminSalesAnalytics";
import AdminUsers from "./AdminUsers";
import AdminApplications from "./AdminApplications";
import AdminOperators from "./AdminOperators";
import AdminVendorDetail from "./AdminVendorDetail";
import AdminIcarts from "./AdminIcarts";
import { getS, StatusBadge } from "./adminUtils_";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

/* ══════════════════════════════════════════════════════════════
   ENTITY DRAWER (generic list + approve)
═══════════════════════════════════════════════════════════════ */
function EntityDrawer({
  open,
  onClose,
  title,
  description,
  items,
  loading,
  onApprove,
  approving,
  renderRow,
  emptyText,
}) {
  return (
    <Drawer
      isOpen={open}
      onClose={onClose}
      title={title}
      description={description}
      width={520}
    >
      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="admin_empty">
          <p style={{ margin: 0, fontSize: "0.82rem" }}>
            {emptyText || "Nothing here yet."}
          </p>
        </div>
      ) : (
        <div className="admin_drawer_list">
          {items.map((item) => renderRow(item))}
        </div>
      )}
    </Drawer>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();

  // Stats
  const [stats, setStats] = useState({
    users: 0,
    vendors: 0,
    operators: 0,
    icarts: 0,
    suppliers: 0,
    aggregators: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Applications
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [approving, setApproving] = useState(null);

  // Analytics drawer
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [appsDrawerOpen, setAppsDrawerOpen] = useState(false);
  const [operatorsOpen, setOperatorsOpen] = useState(false);
  // Section drawers
  const [usersOpen, setUsersOpen] = useState(false);
  const [icartsOpen, setIcartsOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Entity drawers
  const [drawer, setDrawer] = useState(null); // "users"|"vendors"|"operators"|"suppliers"|"icarts"|"locations"
  const [drawerItems, setDrawerItems] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [entityApproving, setEntityApproving] = useState(null);

  // Location form
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationForm, setLocationForm] = useState({
    name: "",
    country: "",
    code: "",
    currency: "",
  });
  const [savingLocation, setSavingLocation] = useState(false);

  // Aggregator state
  const [showAggForm, setShowAggForm] = useState(false);
  const [aggForm, setAggForm] = useState({ userId: "" });
  const [savingAgg, setSavingAgg] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [userSearching, setUserSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAssignForm, setShowAssignForm] = useState(null); // aggregator id
  const [assignCartId, setAssignCartId] = useState("");
  const [assigningCart, setAssigningCart] = useState(false);
  const [icartList, setIcartList] = useState([]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const [usersR, vendorsR, operatorsR, icartsR, suppliersR, aggregatorsR] =
        await Promise.allSettled([
          api.get("/account"),
          api.get("/vendor/profile"),
          api.get("/icart/operator/hirable"),
          api.get("/icart"),
          api.get("/supplier"),
          api.get("/icart/aggregator"),
        ]);
      const count = (r) => {
        if (r.status !== "fulfilled") return 0;
        const d = r.value.data.data;
        if (!d) return 0;
        if (typeof d.total === "number") return d.total;
        // named array key
        const k = [
          "vendors",
          "operators",
          "suppliers",
          "users",
          "icarts",
          "states",
          "aggregators",
        ].find((k) => Array.isArray(d[k]));
        if (k) return d[k].length;
        if (Array.isArray(d)) return d.length;
        return d.items?.length || 0;
      };
      setStats({
        users: count(usersR),
        vendors: count(vendorsR),
        operators: count(operatorsR),
        icarts: count(icartsR),
        suppliers: count(suppliersR),
        aggregators: count(aggregatorsR),
      });
    } catch {
      /* silent */
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchApplications = async () => {
    setAppsLoading(true);
    try {
      const r = await api.get("/contract/application/all");
      const d = r.data.data;
      setApplications(Array.isArray(d) ? d : d?.items || []);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchApplications();
  }, []);

  const handleApproveApp = async (id) => {
    setApproving(id);
    try {
      await api.post(`/contract/application/${id}/approve`);
      toast.success("Approved");
      fetchApplications();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setApproving(null);
    }
  };

  const DRAWER_CONFIG = {
    users: {
      url: "/account",
      title: "All Users",
      description: "Every registered user across all roles",
    },
    vendors: {
      url: "/vendor/profile",
      title: "Vendors",
      description: "Food & brand vendors on the platform",
    },
    operators: {
      url: "/icart/operator",
      title: "Operators",
      description: "All iCart operators",
    },
    suppliers: {
      url: "/supplier",
      title: "Suppliers",
      description: "All inventory suppliers",
    },
    icarts: {
      url: "/icart",
      title: "iCart Fleet",
      description: "Every iCart in the fleet",
    },
    locations: {
      url: "/config/state",
      title: "Locations",
      description: "States and regions",
    },
    aggregators: {
      url: "/icart/aggregator",
      title: "Aggregators",
      description: "All iCart aggregators",
    },
  };

  const openDrawer = async (key) => {
    // Users and icarts have dedicated full drawers
    if (key === "users") {
      setUsersOpen(true);
      return;
    }
    if (key === "icarts") {
      setIcartsOpen(true);
      return;
    }
    if (key === "operators") {
      setOperatorsOpen(true);
      return;
    }
    // vendors falls through to entity drawer — clicking a row opens AdminVendorDetail

    setDrawer(key);
    setDrawerItems([]);
    setDrawerLoading(true);
    try {
      const cfg = DRAWER_CONFIG[key];
      const r = await api.get(cfg.url);
      const d = r.data.data;
      // Handle all response shapes: flat array, .items, .vendors, .operators, .suppliers, .data
      const extract = (d) => {
        if (Array.isArray(d)) return d;
        // named keys first (vendors, operators, suppliers, users, icarts, states)
        const namedKey = [
          "vendors",
          "operators",
          "suppliers",
          "users",
          "icarts",
          "states",
          "aggregators",
          "data",
        ].find((k) => Array.isArray(d?.[k]));
        if (namedKey) return d[namedKey];
        return d?.items || [];
      };
      setDrawerItems(extract(d));
    } catch {
      toast.error("Failed to load");
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleEntityApprove = async (id) => {
    const endpoints = {
      vendors: `/vendor/profile/${id}/status`,
      operators: `/icart/operator/${id}/approve`,
      suppliers: `/supplier/${id}/approve`,
    };
    const url = endpoints[drawer];
    if (!url) return;
    setEntityApproving(id);
    try {
      // vendors need { status } body; operators/suppliers are no-body endpoints
      const body = drawer === "vendors" ? { status: "ACTIVE" } : {};
      await api.patch(url, body);
      toast.success("Approved");
      openDrawer(drawer);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setEntityApproving(null);
    }
  };

  const handleUnlockUser = async (id) => {
    setEntityApproving(id);
    try {
      await api.put(`/account/${id}/unlock`);
      toast.success("Account unlocked");
      openDrawer("users");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to unlock");
    } finally {
      setEntityApproving(null);
    }
  };

  // Fetch icarts for assign dropdown (lazy)
  const fetchIcartList = async () => {
    try {
      const r = await api.get("/icart");
      const d = r.data.data;
      const list = Array.isArray(d) ? d : d?.items || d?.icarts || [];
      setIcartList(list);
    } catch {
      /* silent */
    }
  };

  const searchUsers = async (q) => {
    setUserSearch(q);
    if (!q.trim()) {
      setUserResults([]);
      return;
    }
    setUserSearching(true);
    try {
      const r = await api.get("/account", { params: { search: q } });
      const d = r.data.data;
      const users = Array.isArray(d) ? d : d?.users || d?.items || [];
      setUserResults(users.slice(0, 8));
    } catch {
      /* silent */
    } finally {
      setUserSearching(false);
    }
  };

  const handleCreateAggregator = async () => {
    if (!selectedUser) return toast.error("Select a user first");
    setSavingAgg(true);
    try {
      await api.post("/icart/aggregator/create", { userId: selectedUser.id });
      toast.success("Aggregator created");
      setShowAggForm(false);
      setAggForm({ userId: "" });
      setSelectedUser(null);
      setUserSearch("");
      setUserResults([]);
      openDrawer("aggregators");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSavingAgg(false);
    }
  };

  const handleAssignCart = async (aggregatorId) => {
    if (!assignCartId.trim())
      return toast.error("Enter an iCart serial number");
    setAssigningCart(true);
    try {
      // Resolve serial number to cart ID
      const searchRes = await api.get("/icart", {
        params: { search: assignCartId.trim() },
      });
      const d = searchRes.data.data;
      const list = Array.isArray(d) ? d : d?.items || d?.icarts || [];
      const cart = list.find(
        (c) =>
          c.serialNumber?.toLowerCase() === assignCartId.trim().toLowerCase(),
      );
      if (!cart) {
        toast.error("iCart not found — check the serial number");
        setAssigningCart(false);
        return;
      }
      await api.post("/icart/aggregator/assign-cart", {
        aggregatorId,
        cartId: cart.id,
      });
      toast.success("Cart assigned");
      setShowAssignForm(null);
      setAssignCartId("");
      openDrawer("aggregators");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setAssigningCart(false);
    }
  };

  const handleUnassignCart = async (cartId) => {
    if (!window.confirm("Unassign this cart?")) return;
    try {
      await api.post("/icart/aggregator/unassign-cart", { cartId });
      toast.success("Cart unassigned");
      openDrawer("aggregators");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  const handleSaveLocation = async () => {
    if (!locationForm.name.trim()) return toast.error("Name is required");
    setSavingLocation(true);
    try {
      await api.post("/config/state", {
        name: locationForm.name.trim(),
        ...(locationForm.country && { country: locationForm.country.trim() }),
        ...(locationForm.code && { code: locationForm.code.trim() }),
        ...(locationForm.currency && {
          currency: locationForm.currency.trim(),
        }),
      });
      toast.success("State created");
      setShowLocationForm(false);
      setLocationForm({ name: "", country: "", code: "", currency: "" });
      if (drawer === "locations") openDrawer("locations");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSavingLocation(false);
    }
  };

  const pending = {
    vendors: drawerItems.filter((v) => !v.isApproved).length,
    operators: drawerItems.filter((o) => !o.isApproved).length,
    suppliers: drawerItems.filter((s) => !s.isApproved).length,
  };

  const appsPending = applications.filter(
    (a) => a.status === "SUBMITTED",
  ).length;

  const STAT_CARDS = [
    { key: "users", label: "Users", icon: MdOutlinePeople, color: "#3b82f6" },
    {
      key: "vendors",
      label: "Vendors",
      icon: MdOutlineStore,
      color: "var(--accent)",
    },
    {
      key: "operators",
      label: "Operators",
      icon: MdOutlineBadge,
      color: "#f59e0b",
    },
    {
      key: "icarts",
      label: "iCarts",
      icon: MdOutlineShoppingCart,
      color: "#16a34a",
    },
    {
      key: "suppliers",
      label: "Suppliers",
      icon: MdOutlineLocalShipping,
      color: "#8b5cf6",
    },
    {
      key: "aggregators",
      label: "Aggregators",
      icon: MdOutlineHub,
      color: "#06b6d4",
    },
  ];

  const renderEntityRow = (item) => {
    // Name: vendors have businessName, operators have user.fullName
    const name =
      item.businessName ||
      item.user?.fullName ||
      item.user?.name ||
      item.fullName ||
      item.name ||
      item.serialNumber ||
      `#${item.id?.slice(0, 8).toUpperCase()}`;

    // Sub: email + extra context
    const sub = (() => {
      if (item.email) {
        // For users, show roles alongside email
        const roleNames = item.roles?.map((r) => r.role || r).join(", ");
        return roleNames ? `${item.email} · ${roleNames}` : item.email;
      }
      if (item.user?.email) {
        const extra = item.state?.name
          ? ` · ${item.state.name}`
          : item.cartId
            ? " · Assigned"
            : " · Unassigned";
        return item.user.email + extra;
      }
      if (item.membershipStatus) return item.membershipStatus;
      if (item.state?.name) return item.state.name;
      if (item.status) return item.status;
      return "";
    })();

    const initials = (name || "?").charAt(0).toUpperCase();

    // Approval: vendors use membershipStatus, operators/suppliers use isApproved
    const approved =
      item.membershipStatus === "ACTIVE" ||
      item.isApproved === true ||
      item.status === "APPROVED" ||
      item.status === "ACTIVE";

    const canApprove =
      ["vendors", "operators", "suppliers"].includes(drawer) && !approved;
    const isUsersDrawer = drawer === "users";

    const statusLabel =
      item.membershipStatus ||
      (item.isApproved != null
        ? item.isApproved
          ? "APPROVED"
          : "PENDING"
        : null) ||
      item.status ||
      null;

    const statusStyle = approved
      ? {
          background: "rgba(34,197,94,0.1)",
          color: "#16a34a",
          border: "1px solid rgba(34,197,94,0.25)",
        }
      : {
          background: "rgba(234,179,8,0.1)",
          color: "#ca8a04",
          border: "1px solid rgba(234,179,8,0.25)",
        };

    return (
      <div
        key={item.id}
        className="admin_drawer_row"
        style={{ cursor: drawer === "vendors" ? "pointer" : "default" }}
        onClick={() => {
          if (drawer === "vendors") {
            setDrawer(null);
            setSelectedVendor(item);
          }
        }}
      >
        <div className="admin_drawer_avatar">{initials}</div>
        <div className="admin_drawer_info">
          <div className="admin_drawer_name">{name}</div>
          {sub && <div className="admin_drawer_sub">{sub}</div>}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {statusLabel && (
            <span className="admin_status_badge" style={statusStyle}>
              <MdCircle size={5} />
              {statusLabel}
            </span>
          )}
          {canApprove && (
            <button
              className={`app_btn app_btn_confirm${entityApproving === item.id ? " btn_loading" : ""}`}
              style={{
                height: 28,
                padding: "0 10px",
                fontSize: "0.72rem",
                position: "relative",
              }}
              onClick={() => handleEntityApprove(item.id)}
              disabled={!!entityApproving}
            >
              <span className="btn_text">
                <MdCheck size={12} /> Approve
              </span>
              {entityApproving === item.id && (
                <span
                  className="btn_loader"
                  style={{ width: 11, height: 11 }}
                />
              )}
            </button>
          )}
          {isUsersDrawer && item.passwordLockedUntil && (
            <button
              className="app_btn app_btn_cancel"
              style={{
                height: 28,
                padding: "0 10px",
                fontSize: "0.72rem",
                position: "relative",
                whiteSpace: "nowrap",
              }}
              onClick={() => handleUnlockUser(item.id)}
              disabled={entityApproving === item.id}
            >
              Unlock
            </button>
          )}
        </div>
      </div>
    );
  };

  const cfg = drawer ? DRAWER_CONFIG[drawer] : {};

  return (
    <div className="admin_dashboard">
      {/* Header */}
      <div className="admin_dashboard_header">
        <div>
          <h1 className="admin_page_title">Admin Dashboard</h1>
          <p className="admin_page_sub">
            Platform overview, approvals, and configuration
          </p>
        </div>
        <button className="admin_back_link" onClick={() => navigate("/app")}>
          ← Back to App
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="admin_stats_grid">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="admin_stat_card"
            onClick={() => {
              if (key === "users") setUsersOpen(true);
              else if (key === "icarts") setIcartsOpen(true);
              else if (key === "operators") setOperatorsOpen(true);
              else openDrawer(key);
            }}
          >
            <div className="admin_stat_icon" style={{ color }}>
              <Icon size={18} />
            </div>
            <div>
              <div className="admin_stat_value">
                {statsLoading ? "—" : (stats[key] || 0).toLocaleString()}
              </div>
              <div className="admin_stat_label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pending Approvals ── */}
      <div className="admin_section">
        <div className="admin_section_header">
          <span className="admin_section_title">Pending Approvals</span>
          {appsPending > 0 && (
            <span
              className="admin_section_count"
              style={{
                background: "rgba(234,179,8,0.1)",
                color: "#ca8a04",
                border: "1px solid rgba(234,179,8,0.25)",
              }}
            >
              {appsPending} contracts
            </span>
          )}
        </div>
        <div className="admin_approval_row">
          {[
            {
              key: "vendors",
              label: "Vendors",
              icon: MdOutlineStore,
              color: "var(--accent)",
            },
            {
              key: "operators",
              label: "Operators",
              icon: MdOutlineBadge,
              color: "#f59e0b",
            },
            {
              key: "suppliers",
              label: "Suppliers",
              icon: MdOutlineLocalShipping,
              color: "#8b5cf6",
            },
            {
              key: "applications",
              label: "Contracts",
              icon: MdOutlineFactCheck,
              color: "#3b82f6",
            },
            {
              key: "locations",
              label: "Locations",
              icon: MdOutlineLocationOn,
              color: "#16a34a",
            },
            {
              key: "aggregators",
              label: "Aggregators",
              icon: MdOutlineHub,
              color: "#06b6d4",
            },
          ].map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              className="admin_approval_chip"
              onClick={() =>
                key === "applications"
                  ? setAppsDrawerOpen(true)
                  : openDrawer(key)
              }
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: `${color}18`,
                  color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={16} />
              </div>
              <span className="admin_approval_chip_label">{label}</span>
              <MdArrowForward
                size={14}
                style={{ color: "var(--text-muted)", marginLeft: "auto" }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ── Contract Applications ── */}
      {/* ── Contract Applications ── */}
      <div className="admin_section" id="admin_apps_section">
        <div className="admin_section_header">
          <span className="admin_section_title">Contract Applications</span>
          <span className="admin_section_count">{applications.length}</span>
          {appsPending > 0 && (
            <span
              className="admin_section_count"
              style={{
                background: "rgba(234,179,8,0.1)",
                color: "#ca8a04",
                border: "1px solid rgba(234,179,8,0.25)",
              }}
            >
              {appsPending} pending
            </span>
          )}
          <button
            className="app_btn app_btn_cancel"
            style={{
              height: 30,
              padding: "0 12px",
              fontSize: "0.75rem",
              marginLeft: "auto",
            }}
            onClick={() => setAppsDrawerOpen(true)}
          >
            Show All
          </button>
        </div>
        {appsLoading ? (
          <div className="page_loader">
            <div className="page_loader_spinner" />
          </div>
        ) : applications.length === 0 ? (
          <div className="admin_empty">
            <p style={{ margin: 0, fontSize: "0.82rem" }}>
              No applications yet.
            </p>
          </div>
        ) : (
          <>
            <div className="admin_card_list">
              {applications.slice(0, 4).map((app) => {
                const s = getS(app.status);
                const user = app.user || app.owner;
                return (
                  <div key={app.id} className="admin_card">
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: s.bg,
                        border: `1px solid ${s.border}`,
                        color: s.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MdOutlineFactCheck size={16} />
                    </div>
                    <div className="admin_card_body">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          marginBottom: 4,
                          flexWrap: "wrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 800,
                            color: "var(--text-heading)",
                            fontFamily: "monospace",
                          }}
                        >
                          #{app.id.slice(0, 8).toUpperCase()}
                        </span>
                        <StatusBadge status={app.status} />
                      </div>
                      <div className="admin_card_meta">
                        {(user?.fullName || user?.name) && (
                          <span className="admin_meta_chip">
                            {user.fullName || user.name}
                          </span>
                        )}
                        {user?.email && (
                          <span className="admin_meta_chip">{user.email}</span>
                        )}
                        {app.type && (
                          <span className="admin_meta_chip">{app.type}</span>
                        )}
                        {app.numberOfCarts && (
                          <span className="admin_meta_chip">
                            {app.numberOfCarts} iCart
                            {app.numberOfCarts !== 1 ? "s" : ""}
                          </span>
                        )}
                        <span className="admin_meta_chip">
                          {fmtDate(app.createdAt)}
                        </span>
                      </div>
                    </div>
                    {app.status === "SUBMITTED" && (
                      <button
                        className={`app_btn app_btn_confirm${approving === app.id ? " btn_loading" : ""}`}
                        style={{
                          height: 34,
                          padding: "0 14px",
                          fontSize: "0.75rem",
                          position: "relative",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          flexShrink: 0,
                        }}
                        onClick={() => handleApproveApp(app.id)}
                        disabled={!!approving}
                      >
                        <span className="btn_text">
                          <MdCheck size={13} /> Approve
                        </span>
                        {approving === app.id && (
                          <span
                            className="btn_loader"
                            style={{ width: 12, height: 12 }}
                          />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {applications.length > 4 && (
              <button
                className="app_btn app_btn_cancel"
                style={{
                  width: "100%",
                  height: 38,
                  marginTop: 10,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                }}
                onClick={() => setAppsDrawerOpen(true)}
              >
                View all {applications.length} applications →
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Sales Analytics card ── */}
      <div className="admin_section">
        <div className="admin_section_header">
          <span className="admin_section_title">Sales Analytics</span>
        </div>
        <div
          className="admin_stat_card"
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            cursor: "pointer",
            padding: "18px 20px",
          }}
          onClick={() => setAnalyticsOpen(true)}
        >
          <div
            className="admin_stat_icon"
            style={{
              color: "var(--accent)",
              width: 44,
              height: 44,
              borderRadius: 12,
              flexShrink: 0,
            }}
          >
            <MdOutlineTrendingUp size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "0.9rem",
                fontWeight: 800,
                color: "var(--text-heading)",
                marginBottom: 3,
              }}
            >
              Platform Sales
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Revenue trends, payment breakdown, top iCarts and full transaction
              history
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: 999,
                background: "var(--bg-active)",
                color: "var(--accent)",
                border: "1px solid rgba(203,108,220,0.2)",
              }}
            >
              View Analytics
            </span>
            <MdArrowForward size={16} style={{ color: "var(--accent)" }} />
          </div>
        </div>
      </div>

      {/* Analytics drawer */}
      <Drawer
        isOpen={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        title="Sales Analytics"
        description="Platform-wide revenue, trends, and transaction history"
        width={680}
      >
        <AdminSalesAnalytics />
      </Drawer>

      {/* Users drawer */}
      <Drawer
        isOpen={usersOpen}
        onClose={() => setUsersOpen(false)}
        title="All Users"
        description="Every registered user on the platform"
        width={560}
      >
        <AdminUsers />
      </Drawer>

      {/* Operators drawer */}
      <AdminOperators
        open={operatorsOpen}
        onClose={() => setOperatorsOpen(false)}
      />

      {/* iCarts drawer */}
      <Drawer
        isOpen={icartsOpen}
        onClose={() => setIcartsOpen(false)}
        title="iCart Fleet"
        description="All iCarts — filter by state or serial number"
        width={600}
      >
        <AdminIcarts />
      </Drawer>

      {/* Vendor detail drawer */}
      {selectedVendor && (
        <AdminVendorDetail
          vendor={selectedVendor}
          onClose={() => {
            setSelectedVendor(null);
            openDrawer("vendors");
          }}
        />
      )}

      {/* ── Settings quick panels ── */}
      <div className="admin_section">
        <div className="admin_section_header">
          <span className="admin_section_title">Platform Settings</span>
        </div>
        <div className="admin_two_col" style={{ marginBottom: 16 }}>
          <AdminSalesFormula />
          <AdminRentalSettings />
        </div>
        <AdminContractSettings />
      </div>

      {/* Applications drawer */}
      <AdminApplications
        open={appsDrawerOpen}
        onClose={() => setAppsDrawerOpen(false)}
        onApproved={() => {
          fetchApplications();
          fetchStats();
        }}
      />

      {/* ── Entity drawer ── */}
      <Drawer
        isOpen={!!drawer}
        onClose={() => {
          setDrawer(null);
          setShowLocationForm(false);
        }}
        title={cfg.title || ""}
        description={cfg.description || ""}
        width={500}
      >
        {/* Location create form */}
        {/* Aggregator create form */}
        {drawer === "aggregators" && (
          <div style={{ marginBottom: 16 }}>
            {showAggForm ? (
              <div className="admin_form_card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--text-heading)",
                    }}
                  >
                    Create Aggregator
                  </span>
                  <button
                    className="biz_icon_btn"
                    onClick={() => setShowAggForm(false)}
                  >
                    <MdClose size={13} />
                  </button>
                </div>
                <div className="form-field" style={{ marginBottom: 10 }}>
                  <label className="modal-label">Search User *</label>
                  {selectedUser ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        background: "rgba(6,182,212,0.08)",
                        border: "1px solid rgba(6,182,212,0.25)",
                        borderRadius: 9,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: "rgba(6,182,212,0.15)",
                          color: "#06b6d4",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 800,
                          fontSize: "0.82rem",
                          flexShrink: 0,
                        }}
                      >
                        {(selectedUser.fullName || selectedUser.email || "U")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: "var(--text-heading)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {selectedUser.fullName || "User"}
                        </div>
                        <div
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--text-muted)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {selectedUser.email}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedUser(null);
                          setUserSearch("");
                          setUserResults([]);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-muted)",
                          padding: 0,
                          display: "flex",
                        }}
                      >
                        <MdClose size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ position: "relative" }}>
                      <input
                        className="modal-input"
                        placeholder="Type name or email to search…"
                        value={userSearch}
                        onChange={(e) => searchUsers(e.target.value)}
                        autoComplete="off"
                      />
                      {userSearching && (
                        <div
                          style={{
                            position: "absolute",
                            right: 10,
                            top: "50%",
                            transform: "translateY(-50%)",
                          }}
                        >
                          <div
                            className="page_loader_spinner"
                            style={{ width: 14, height: 14 }}
                          />
                        </div>
                      )}
                      {userResults.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            top: "calc(100% + 4px)",
                            left: 0,
                            right: 0,
                            zIndex: 50,
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            overflow: "hidden",
                            boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
                          }}
                        >
                          {userResults.map((u) => (
                            <div
                              key={u.id}
                              onClick={() => {
                                setSelectedUser(u);
                                setUserSearch("");
                                setUserResults([]);
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "9px 12px",
                                cursor: "pointer",
                                borderBottom: "1px solid var(--border)",
                                transition: "background 0.1s",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "var(--bg-hover)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 7,
                                  background: "var(--bg-active)",
                                  border: "1px solid rgba(203,108,220,0.2)",
                                  color: "var(--accent)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: 800,
                                  fontSize: "0.75rem",
                                  flexShrink: 0,
                                }}
                              >
                                {(u.fullName || u.email || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "0.78rem",
                                    fontWeight: 700,
                                    color: "var(--text-heading)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {u.fullName || "—"}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.68rem",
                                    color: "var(--text-muted)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {u.email}
                                </div>
                              </div>
                              {u.roles?.length > 0 && (
                                <span
                                  style={{
                                    fontSize: "0.6rem",
                                    fontWeight: 700,
                                    padding: "1px 6px",
                                    borderRadius: 999,
                                    background: "var(--bg-hover)",
                                    border: "1px solid var(--border)",
                                    color: "var(--text-muted)",
                                    flexShrink: 0,
                                  }}
                                >
                                  {u.roles[0]?.role || u.roles[0]}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    className="app_btn app_btn_cancel"
                    style={{ height: 34 }}
                    onClick={() => setShowAggForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={`app_btn app_btn_confirm${savingAgg ? " btn_loading" : ""}`}
                    style={{ height: 34, minWidth: 80, position: "relative" }}
                    onClick={handleCreateAggregator}
                    disabled={savingAgg}
                  >
                    <span className="btn_text">Create</span>
                    {savingAgg && (
                      <span
                        className="btn_loader"
                        style={{ width: 12, height: 12 }}
                      />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="app_btn app_btn_confirm biz_add_btn"
                style={{ marginBottom: 12 }}
                onClick={() => setShowAggForm(true)}
              >
                <LuPlus size={13} /> New Aggregator
              </button>
            )}
          </div>
        )}

        {drawer === "locations" && (
          <div style={{ marginBottom: 16 }}>
            {showLocationForm ? (
              <div className="admin_form_card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--text-heading)",
                    }}
                  >
                    New State
                  </span>
                  <button
                    className="biz_icon_btn"
                    onClick={() => setShowLocationForm(false)}
                  >
                    <MdClose size={13} />
                  </button>
                </div>
                <div className="admin_form_grid" style={{ marginBottom: 10 }}>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="modal-label">Name *</label>
                    <input
                      className="modal-input"
                      placeholder="e.g. Lagos"
                      value={locationForm.name}
                      onChange={(e) =>
                        setLocationForm((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="modal-label">Country</label>
                    <CountrySelect
                      value={locationForm.country}
                      onChange={(e) =>
                        setLocationForm((p) => ({
                          ...p,
                          country: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="modal-label">Code</label>
                    <input
                      className="modal-input"
                      placeholder="e.g. LAG"
                      value={locationForm.code}
                      onChange={(e) =>
                        setLocationForm((p) => ({ ...p, code: e.target.value }))
                      }
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="modal-label">Currency</label>
                    <input
                      className="modal-input"
                      placeholder="e.g. NGN"
                      value={locationForm.currency}
                      onChange={(e) =>
                        setLocationForm((p) => ({
                          ...p,
                          currency: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    className="app_btn app_btn_cancel"
                    style={{ height: 34 }}
                    onClick={() => setShowLocationForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={`app_btn app_btn_confirm${savingLocation ? " btn_loading" : ""}`}
                    style={{ height: 34, minWidth: 80, position: "relative" }}
                    onClick={handleSaveLocation}
                    disabled={savingLocation}
                  >
                    <span className="btn_text">Create</span>
                    {savingLocation && (
                      <span
                        className="btn_loader"
                        style={{ width: 12, height: 12 }}
                      />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="app_btn app_btn_confirm biz_add_btn"
                style={{ marginBottom: 12 }}
                onClick={() => setShowLocationForm(true)}
              >
                <LuPlus size={13} /> New State
              </button>
            )}
          </div>
        )}

        {drawerLoading ? (
          <div className="page_loader">
            <div className="page_loader_spinner" />
          </div>
        ) : drawerItems.length === 0 ? (
          <div className="admin_empty">
            <p style={{ margin: 0, fontSize: "0.82rem" }}>Nothing here yet.</p>
          </div>
        ) : (
          <div className="admin_drawer_list">
            {drawerItems.map((item) => {
              if (drawer === "aggregators") {
                const name =
                  item.user?.fullName ||
                  item.user?.name ||
                  item.businessName ||
                  item.userId?.slice(0, 8);
                const email = item.user?.email || "";
                // API doesn't return carts on aggregator — cross-reference from icartList
                const carts = icartList.filter(
                  (c) => c.aggregatorId === item.id,
                );
                const initials = (name || "A").charAt(0).toUpperCase();
                return (
                  <div key={item.id}>
                    <div
                      className="admin_drawer_row"
                      style={{
                        flexDirection: "column",
                        alignItems: "stretch",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          className="admin_drawer_avatar"
                          style={{
                            background: "rgba(6,182,212,0.12)",
                            color: "#06b6d4",
                            border: "1px solid rgba(6,182,212,0.2)",
                          }}
                        >
                          {initials}
                        </div>
                        <div className="admin_drawer_info">
                          <div className="admin_drawer_name">
                            {name || "Aggregator"}
                          </div>
                          {email && (
                            <div className="admin_drawer_sub">{email}</div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                          <span className="admin_meta_chip">
                            {carts.length} cart{carts.length !== 1 ? "s" : ""}
                          </span>
                          <button
                            className="app_btn app_btn_confirm biz_add_btn"
                            style={{ height: 28 }}
                            onClick={() => {
                              setShowAssignForm(
                                showAssignForm === item.id ? null : item.id,
                              );
                              setAssignCartId("");
                            }}
                          >
                            <LuPlus size={12} /> Assign
                          </button>
                        </div>
                      </div>
                      {/* Assigned carts */}
                      {carts.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 5,
                            paddingLeft: 46,
                          }}
                        >
                          {carts.map((c) => (
                            <div
                              key={c.id || c}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "3px 9px",
                                background: "var(--bg-card)",
                                border: "1px solid var(--border)",
                                borderRadius: 999,
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                color: "var(--text-body)",
                                fontFamily: "monospace",
                              }}
                            >
                              {c.serialNumber ||
                                c.id?.slice(0, 8).toUpperCase() ||
                                c}
                              <button
                                onClick={() => handleUnassignCart(c.id || c)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  color: "#ef4444",
                                  padding: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  lineHeight: 1,
                                }}
                              >
                                <MdClose size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Assign cart inline form */}
                      {showAssignForm === item.id && (
                        <div
                          style={{
                            paddingLeft: 46,
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <input
                            className="modal-input"
                            style={{
                              flex: 1,
                              height: 34,
                              marginBottom: 0,
                              fontFamily: "monospace",
                            }}
                            placeholder="Enter iCart serial number…"
                            value={assignCartId}
                            onChange={(e) => setAssignCartId(e.target.value)}
                          />
                          <button
                            className={`app_btn app_btn_confirm${assigningCart ? " btn_loading" : ""}`}
                            style={{
                              height: 34,
                              padding: "0 14px",
                              position: "relative",
                              flexShrink: 0,
                            }}
                            onClick={() => handleAssignCart(item.id)}
                            disabled={assigningCart || !assignCartId}
                          >
                            <span className="btn_text">Assign</span>
                            {assigningCart && (
                              <span
                                className="btn_loader"
                                style={{ width: 12, height: 12 }}
                              />
                            )}
                          </button>
                          <button
                            className="app_btn app_btn_cancel"
                            style={{
                              height: 34,
                              padding: "0 10px",
                              flexShrink: 0,
                            }}
                            onClick={() => setShowAssignForm(null)}
                          >
                            <MdClose size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return renderEntityRow(item);
            })}
          </div>
        )}
      </Drawer>
    </div>
  );
}
