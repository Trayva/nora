import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdOutlinePeople,
  MdOutlineStore,
  MdOutlineBadge,
  MdOutlineLocalShipping,
  MdOutlineFactCheck,
  MdOutlineLocationOn,
  MdClose,
  MdCheck,
  MdCircle,
  MdArrowForward,
  MdOutlineTrendingUp,
  MdEdit,
  MdDelete,
  MdOutlineFastfood,
  MdOutlineReceiptLong,
  MdSupportAgent,
} from "react-icons/md";
import { LuPlus } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";
import { CountrySelect, StatusBadge, getS } from "./adminUtils_";
import AdminSalesFormula from "./AdminSalesFormula";
import AdminVendorApplicationSettings from "./AdminVendorApplicationSettings";
import AdminContractSettings from "./AdminContractSettings";
import AdminSalesAnalytics from "./AdminSalesAnalytics";
import AdminUsers from "./AdminUsers";
import AdminApplications from "./AdminApplications";
import AdminOperators from "./AdminOperators";
import AdminVendorDetail from "./AdminVendorDetail";
import AdminKiosks from "./AdminKiosks";
import AdminInvoiceGenerator from "./AdminInvoiceGenerator";
import AdminGlobalWalletSettings from "./AdminGlobalWalletSettings";
import AdminVatSettings from "./AdminVatSettings";

import {
  DashboardSkeleton,
  TableSkeleton,
  CardSkeleton
} from "../../components/SkeletonTemplates";
import Modal from "../../components/Modal";
import UnitSelect from "../../components/UnitSelect";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "—";

const ItemListSkeleton = ({ count = 4 }) => (
  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
    {Array(count).fill(0).map((_, i) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div className="skeleton_shimmer skeleton_circle" style={{ width: "36px", height: "36px" }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton_shimmer skeleton_text" style={{ width: "70%", height: "12px", marginBottom: "6px" }} />
          <div className="skeleton_shimmer skeleton_text" style={{ width: "40%", height: "8px" }} />
        </div>
      </div>
    ))}
  </div>
);

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
        <ItemListSkeleton />
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
    kiosks: 0,
    suppliers: 0,
    tickets: 0,
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
  const [kiosksOpen, setKiosksOpen] = useState(false);
  const [invoiceGeneratorOpen, setInvoiceGeneratorOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Entity drawers
  const [drawer, setDrawer] = useState(null); // "users"|"vendors"|"operators"|"suppliers"|"kiosks"|"locations"
  const [drawerItems, setDrawerItems] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [entityApproving, setEntityApproving] = useState(null);

  const [drawerPage, setDrawerPage] = useState(1);
  const [drawerTotalPages, setDrawerTotalPages] = useState(1);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [editingEntity, setEditingEntity] = useState(null);
  const [entityForm, setEntityForm] = useState({});
  const [entityImageFile, setEntityImageFile] = useState(null);
  const [savingEntity, setSavingEntity] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(drawerSearch);
      setDrawerPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [drawerSearch]);

  const fetchDrawerItems = async () => {
    if (!drawer) return;
    setDrawerLoading(true);
    try {
      const cfg = DRAWER_CONFIG[drawer];
      if (!cfg) return;

      const params = {
        page: drawerPage,
        limit: 15,
      };
      if (debouncedSearch) {
        params.search = debouncedSearch;
      }

      const r = await api.get(cfg.url, { params });
      const d = r.data.data;

      const extract = (dataObj) => {
        if (Array.isArray(dataObj)) return dataObj;
        const namedKey = [
          "vendors",
          "operators",
          "suppliers",
          "users",
          "kiosks",
          "states",
          "data",
          "ingredients",
          "machineries",
        ].find((k) => Array.isArray(dataObj?.[k]));
        if (namedKey) return dataObj[namedKey];
        return dataObj?.items || dataObj?.data || [];
      };

      const itemsList = extract(d);
      setDrawerItems(itemsList);

      if (d && typeof d.totalPages === "number") {
        setDrawerTotalPages(d.totalPages);
      } else if (d && typeof d.pages === "number") {
        setDrawerTotalPages(d.pages);
      } else {
        setDrawerTotalPages(1);
      }
    } catch {
      toast.error("Failed to load");
    } finally {
      setDrawerLoading(false);
    }
  };

  useEffect(() => {
    fetchDrawerItems();
  }, [drawer, drawerPage, debouncedSearch]);

  const handleEditEntity = (item) => {
    setEditingEntity(item);
    setEntityImageFile(null);
    if (drawer === "ingredients") {
      setEntityForm({
        name: item.name || "",
        unit: item.unit || "",
        image: item.image || "",

      });
    } else {
      setEntityForm({
        name: item.name || "",
        description: item.description || "",
        powerConsumption: item.powerConsumption || "",
        manufacturer: item.manufacturer || "",
        modelNumber: item.modelNumber || "",
        image: item.image || "",
      });
    }
  };

  const handleSaveEntityUpdate = async (e) => {
    e.preventDefault();
    if (!editingEntity) return;
    setSavingEntity(true);
    try {
      const fd = new FormData();
      fd.append("name", entityForm.name);

      if (drawer === "ingredients") {
        fd.append("unit", entityForm.unit);
      } else {
        if (entityForm.description) fd.append("description", entityForm.description);
        if (entityForm.powerConsumption !== undefined && entityForm.powerConsumption !== null) {
          fd.append("powerConsumption", String(entityForm.powerConsumption));
        }
        if (entityForm.manufacturer) fd.append("manufacturer", entityForm.manufacturer);
        if (entityForm.modelNumber) fd.append("modelNumber", entityForm.modelNumber);
      }

      if (entityImageFile) {
        fd.append("image", entityImageFile);
      }

      const url = drawer === "ingredients"
        ? `/library/ingredient/${editingEntity.id}`
        : `/library/machinery/${editingEntity.id}`;

      await api.patch(url, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Updated successfully!");
      setEditingEntity(null);
      fetchDrawerItems();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update item");
    } finally {
      setSavingEntity(false);
    }
  };

  const displayedItems = (() => {
    if (drawer === "locations" && debouncedSearch) {
      return drawerItems.filter((item) =>
        item.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        item.code?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }
    return drawerItems;
  })();

  // Location form
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationForm, setLocationForm] = useState({
    name: "",
    country: "",
    code: "",
    currency: "",
    maxSlots: "",
    slotRadius: "",
  });
  const [savingLocation, setSavingLocation] = useState(false);

  // State edit / delete
  const [editingState, setEditingState] = useState(null);
  const [editStateForm, setEditStateForm] = useState({
    name: "",
    code: "",
    country: "",
    currency: "",
    notes: "",
    status: "",
  });
  const [savingState, setSavingState] = useState(false);
  const [confirmDeleteState, setConfirmDeleteState] = useState(null);
  const [deletingState, setDeletingState] = useState(null);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const r = await api.get("/account/counts");
      const d = r.data.data;
      setStats({
        users: d?.users || 0,
        vendors: d?.vendors || 0,
        operators: d?.operators || 0,
        kiosks: d?.kiosks || 0,
        suppliers: d?.suppliers || 0,
        tickets: d?.tickets || 0,
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
      url: "/kiosk/operator",
      title: "Operators",
      description: "All Kiosk operators",
    },
    suppliers: {
      url: "/supplier",
      title: "Suppliers",
      description: "All inventory suppliers",
    },
    kiosks: {
      url: "/kiosk",
      title: "Kiosk Fleet",
      description: "Every Kiosk in the fleet",
    },
    locations: {
      url: "/config/state",
      title: "Locations",
      description: "States and regions",
    },
    ingredients: {
      url: "/library/ingredient",
      title: "Ingredients",
      description: "Ingredients and raw materials",
    },
    machineries: {
      url: "/library/machinery",
      title: "Machineries",
      description: "Machines and equipments",
    },
  };

  const openDrawer = async (key) => {
    // Users and kiosks have dedicated full drawers
    if (key === "users") {
      setUsersOpen(true);
      return;
    }
    if (key === "kiosks") {
      setKiosksOpen(true);
      return;
    }
    if (key === "operators") {
      setOperatorsOpen(true);
      return;
    }
    // vendors falls through to entity drawer — clicking a row opens AdminVendorDetail

    if (key === "tickets") {
      navigate("/app/admin/support");
      return;
    }

    setDrawerPage(1);
    setDrawerSearch("");
    setDebouncedSearch("");
    setDrawer(key);
    setDrawerItems([]);
  };

  const handleEntityApprove = async (id) => {
    setEntityApproving(id);
    try {
      if (drawer === "kiosks") {
        await api.post(`/kiosk/${id}/activate`);
      } else {
        const endpoints = {
          vendors: `/vendor/profile/${id}/status`,
          operators: `/kiosk/operator/${id}/approve`,
          suppliers: `/supplier/${id}/approve`,
        };
        const url = endpoints[drawer];
        if (!url) return;
        const body = drawer === "vendors" ? { status: "ACTIVE" } : {};
        await api.patch(url, body);
      }
      toast.success(drawer === "kiosks" ? "Kiosk activated" : "Approved successfully");
      openDrawer(drawer);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setEntityApproving(null);
    }
  };

  const handleEntityUnapprove = async (id) => {
    setEntityApproving(id);
    try {
      if (drawer === "kiosks") {
        await api.post(`/kiosk/${id}/deactivate`);
      } else if (drawer === "vendors") {
        await api.patch(`/vendor/profile/${id}/status`, { status: "PENDING" });
      } else {
        const endpoints = {
          operators: `/kiosk/operator/${id}/unapprove`,
          suppliers: `/supplier/${id}/unapprove`,
        };
        const url = endpoints[drawer];
        if (!url) return;
        await api.patch(url);
      }
      toast.success(drawer === "kiosks" ? "Kiosk deactivated" : "Unapproved successfully");
      openDrawer(drawer);
      fetchStats();
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
        ...(locationForm.maxSlots !== "" &&
          locationForm.maxSlots !== undefined && {
          maxSlots: Number(locationForm.maxSlots),
        }),
        ...(locationForm.slotRadius !== "" &&
          locationForm.slotRadius !== undefined && {
          slotRadius: Number(locationForm.slotRadius),
        }),
      });
      toast.success("State created");
      setShowLocationForm(false);
      setLocationForm({
        name: "",
        country: "",
        code: "",
        currency: "",
        maxSlots: "",
        slotRadius: "",
      });
      if (drawer === "locations") openDrawer("locations");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSavingLocation(false);
    }
  };

  const handleUpdateState = async () => {
    if (!editStateForm.currency.trim())
      return toast.error("Currency is required");
    setSavingState(true);
    try {
      await api.patch(`/config/state/${editingState.id}`, {
        ...(editStateForm.name.trim() && { name: editStateForm.name.trim() }),
        ...(editStateForm.code.trim() && { code: editStateForm.code.trim() }),
        ...(editStateForm.country.trim() && {
          country: editStateForm.country.trim(),
        }),
        ...(editStateForm.status && { status: editStateForm.status }),
        ...(editStateForm.notes.trim() && {
          notes: editStateForm.notes.trim(),
        }),
        currency: editStateForm.currency.trim(),
        ...(editStateForm.maxSlots !== "" && {
          maxSlots: Number(editStateForm.maxSlots),
        }),
        ...(editStateForm.slotRadius !== "" && {
          slotRadius: Number(editStateForm.slotRadius),
        }),
      });
      toast.success("State updated");
      setEditingState(null);
      openDrawer("locations");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update state");
    } finally {
      setSavingState(false);
    }
  };

  const handleDeleteState = async (id) => {
    setDeletingState(id);
    try {
      await api.delete(`/config/state/${id}`);
      toast.success("State deleted");
      setConfirmDeleteState(null);
      openDrawer("locations");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete state");
    } finally {
      setDeletingState(null);
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
      key: "kiosks",
      label: "Kiosks",
      icon: MdOutlineStore,
      color: "#16a34a",
    },
    {
      key: "suppliers",
      label: "Suppliers",
      icon: MdOutlineLocalShipping,
      color: "#8b5cf6",
    },
    {
      key: "tickets",
      label: "Support Tickets",
      icon: MdSupportAgent,
      color: "#f43f5e",
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
    const imageUrl = item.brandLogo || item.imageUrl || item.image || item.branding?.logo

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
          : item.kioskId
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
      ["vendors", "operators", "suppliers", "kiosks"].includes(drawer) && !approved;
    const canUnapprove =
      ["vendors", "operators", "suppliers", "kiosks"].includes(drawer) && approved;
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
        <div className="admin_drawer_avatar">{imageUrl ? (
          <img style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }} src={imageUrl} alt={name} />
        ) : (
          initials
        )}</div>
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
          {["ingredients", "machineries"].includes(drawer) && (
            <button
              className="biz_icon_btn"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                handleEditEntity(item);
                console.log(item)
              }}
              style={{ width: 28, height: 28 }}
            >
              <MdEdit size={13} />
            </button>
          )}
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
                <MdCheck size={12} /> {drawer === "kiosks" ? "Activate" : "Approve"}
              </span>
              {entityApproving === item.id && (
                <span
                  className="btn_loader"
                  style={{ width: 11, height: 11 }}
                />
              )}
            </button>
          )}
          {canUnapprove && (
            <button
              className={`app_btn app_btn_cancel${entityApproving === item.id ? " btn_loading" : ""}`}
              style={{
                height: 28,
                padding: "0 10px",
                fontSize: "0.72rem",
                position: "relative",
              }}
              onClick={() => handleEntityUnapprove(item.id)}
              disabled={!!entityApproving}
            >
              <span className="btn_text">
                {drawer === "kiosks" ? "Deactivate" : "Unapprove"}
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
              else if (key === "kiosks") setKiosksOpen(true);
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
              key: "machineries",
              label: "Machineries",
              icon: MdOutlineLocalShipping,
              color: "#8b5cf6",
            },
            {
              key: "ingredients",
              label: "Ingredients",
              icon: MdOutlineFastfood,
              color: "#8b5cf6",
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
          <ItemListSkeleton />
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
                        {app.numberOfKiosks && (
                          <span className="admin_meta_chip">
                            {app.numberOfKiosks} Kiosk
                            {app.numberOfKiosks !== 1 ? "s" : ""}
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
              Revenue trends, payment breakdown, top Kiosks and full transaction
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

      {/* Kiosks drawer */}
      <Drawer
        isOpen={kiosksOpen}
        onClose={() => setKiosksOpen(false)}
        title="Kiosk Fleet"
        description="All Kiosks — filter by state or serial number"
        width={600}
      >
        <AdminKiosks />
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
          <AdminVendorApplicationSettings />
        </div>
        <div className="admin_two_col">
          <AdminVatSettings />
          <AdminGlobalWalletSettings />
        </div>
        <br />
        <AdminContractSettings />
      </div>

      {/* ── Tools ── */}
      <div className="admin_section">
        <div className="admin_section_header">
          <span className="admin_section_title">Tools</span>
        </div>
        <div className="admin_two_col" style={{ marginBottom: 16 }}>
          <div
            className="admin_stat_card"
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
              cursor: "pointer",
              padding: "18px 20px",
            }}
            onClick={() => setInvoiceGeneratorOpen(true)}
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
              <MdOutlineReceiptLong size={22} />
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
                Instant Invoice Generator
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Create, customize, and print ad-hoc invoices on-the-fly (frontend only)
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
                Launch Tool
              </span>
              <MdArrowForward size={16} style={{ color: "var(--accent)" }} />
            </div>
          </div>
        </div>
      </div>

      <AdminInvoiceGenerator
        isOpen={invoiceGeneratorOpen}
        onClose={() => setInvoiceGeneratorOpen(false)}
      />

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
          setEditingState(null);
        }}
        title={cfg.title || ""}
        description={cfg.description || ""}
        width={500}
      >
        {drawer && (
          <div style={{ marginBottom: 16 }}>
            <input
              className="modal-input"
              placeholder={`Search ${cfg.title || "items"}...`}
              value={drawerSearch}
              onChange={(e) => setDrawerSearch(e.target.value)}
              style={{ height: 38 }}
            />
          </div>
        )}
        {/* Location create form */}
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
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="modal-label">Max Slots</label>
                    <input
                      className="modal-input"
                      type="number"
                      min="0"
                      placeholder="e.g. 50"
                      value={locationForm.maxSlots}
                      onChange={(e) =>
                        setLocationForm((p) => ({
                          ...p,
                          maxSlots: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="modal-label">Slot Radius (km)</label>
                    <input
                      className="modal-input"
                      type="number"
                      min="0"
                      placeholder="e.g. 5"
                      value={locationForm.slotRadius}
                      onChange={(e) =>
                        setLocationForm((p) => ({
                          ...p,
                          slotRadius: e.target.value,
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
        ) : drawer === "locations" ? (
          /* ── Location rows with edit/delete ── */
          <div className="admin_drawer_list">
            {displayedItems.map((state) => (
              <div key={state.id}>
                {editingState?.id === state.id ? (
                  /* Inline edit form */
                  <div className="admin_form_card" style={{ marginBottom: 8 }}>
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
                        Edit {state.name}
                      </span>
                      <button
                        className="biz_icon_btn"
                        onClick={() => setEditingState(null)}
                      >
                        <MdClose size={13} />
                      </button>
                    </div>
                    <div
                      className="admin_form_grid"
                      style={{ marginBottom: 8 }}
                    >
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="modal-label">Name</label>
                        <input
                          className="modal-input"
                          value={editStateForm.name}
                          onChange={(e) =>
                            setEditStateForm((p) => ({
                              ...p,
                              name: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="modal-label">Code</label>
                        <input
                          className="modal-input"
                          placeholder="e.g. LAG"
                          value={editStateForm.code}
                          onChange={(e) =>
                            setEditStateForm((p) => ({
                              ...p,
                              code: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="modal-label">Country</label>
                        <CountrySelect
                          value={editStateForm.country}
                          onChange={(e) =>
                            setEditStateForm((p) => ({
                              ...p,
                              country: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="modal-label">Currency *</label>
                        <input
                          className="modal-input"
                          placeholder="e.g. NGN"
                          value={editStateForm.currency}
                          onChange={(e) =>
                            setEditStateForm((p) => ({
                              ...p,
                              currency: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div
                      className="admin_form_grid"
                      style={{ marginBottom: 10 }}
                    >
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="modal-label">Status</label>
                        <select
                          className="modal-input"
                          value={editStateForm.status}
                          onChange={(e) =>
                            setEditStateForm((p) => ({
                              ...p,
                              status: e.target.value,
                            }))
                          }
                        >
                          <option value="">— no change —</option>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="PENDING">PENDING</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                        </select>
                      </div>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="modal-label">Notes</label>
                        <input
                          className="modal-input"
                          placeholder="Optional"
                          value={editStateForm.notes}
                          onChange={(e) =>
                            setEditStateForm((p) => ({
                              ...p,
                              notes: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="modal-label">Max Slots</label>
                        <input
                          className="modal-input"
                          type="number"
                          min="0"
                          placeholder="e.g. 50"
                          value={editStateForm.maxSlots}
                          onChange={(e) =>
                            setEditStateForm((p) => ({
                              ...p,
                              maxSlots: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="form-field" style={{ marginBottom: 0 }}>
                        <label className="modal-label">Slot Radius (km)</label>
                        <input
                          className="modal-input"
                          type="number"
                          min="0"
                          placeholder="e.g. 5"
                          value={editStateForm.slotRadius}
                          onChange={(e) =>
                            setEditStateForm((p) => ({
                              ...p,
                              slotRadius: e.target.value,
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
                        onClick={() => setEditingState(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className={`app_btn app_btn_confirm${savingState ? " btn_loading" : ""}`}
                        style={{
                          height: 34,
                          minWidth: 80,
                          position: "relative",
                        }}
                        onClick={handleUpdateState}
                        disabled={savingState}
                      >
                        <span className="btn_text">Save</span>
                        {savingState && (
                          <span
                            className="btn_loader"
                            style={{ width: 12, height: 12 }}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal state row */
                  <div className="admin_drawer_row">
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 9,
                        background: "rgba(22,163,74,0.1)",
                        border: "1px solid rgba(22,163,74,0.2)",
                        color: "#16a34a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontWeight: 800,
                        fontSize: "0.7rem",
                      }}
                    >
                      {state.code || state.name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="admin_drawer_info">
                      <div className="admin_drawer_name">{state.name}</div>
                      <div className="admin_drawer_sub">
                        {[
                          state.country,
                          state.currency,
                          state.status,
                          state.maxSlots != null
                            ? `${state.maxSlots} slots`
                            : null,
                          state.slotRadius != null
                            ? `r=${state.slotRadius}km`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                      <button
                        className="biz_icon_btn"
                        title="Edit"
                        onClick={() => {
                          setEditingState(state);
                          setEditStateForm({
                            name: state.name || "",
                            code: state.code || "",
                            country: state.country || "",
                            currency: state.currency || "",
                            notes: state.notes || "",
                            status: state.status || "",
                            maxSlots:
                              state.maxSlots != null
                                ? String(state.maxSlots)
                                : "",
                            slotRadius:
                              state.slotRadius != null
                                ? String(state.slotRadius)
                                : "",
                          });
                        }}
                      >
                        <MdEdit size={14} />
                      </button>
                      <button
                        className="biz_icon_btn biz_icon_btn_danger"
                        title="Delete"
                        onClick={() => setConfirmDeleteState(state)}
                      >
                        <MdDelete size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="admin_drawer_list">
            {displayedItems.map((item) => renderEntityRow(item))}
          </div>
        )}

        {drawerTotalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 16,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              className="app_btn app_btn_cancel"
              style={{ height: 32, padding: "0 12px", fontSize: "0.75rem" }}
              disabled={drawerPage === 1}
              onClick={() => setDrawerPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Page {drawerPage} of {drawerTotalPages}
            </span>
            <button
              className="app_btn app_btn_cancel"
              style={{ height: 32, padding: "0 12px", fontSize: "0.75rem" }}
              disabled={drawerPage >= drawerTotalPages}
              onClick={() => setDrawerPage((p) => Math.min(drawerTotalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </Drawer>

      {/* Confirm delete state modal */}
      {confirmDeleteState && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1400,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={() => setConfirmDeleteState(null)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(3px)",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              background: "var(--bg-card)",
              borderRadius: 16,
              padding: "24px",
              width: "min(360px, 92vw)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 800,
                color: "var(--text-heading)",
                marginBottom: 8,
              }}
            >
              Delete State
            </div>
            <div
              style={{
                fontSize: "0.82rem",
                color: "var(--text-muted)",
                marginBottom: 20,
              }}
            >
              Delete{" "}
              <strong style={{ color: "var(--text-body)" }}>
                {confirmDeleteState.name}
              </strong>
              ? This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="app_btn app_btn_cancel"
                style={{ flex: 1, height: 40 }}
                onClick={() => setConfirmDeleteState(null)}
              >
                Cancel
              </button>
              <button
                className={`app_btn app_btn_confirm${deletingState ? " btn_loading" : ""}`}
                style={{
                  flex: 1,
                  height: 40,
                  background: "#ef4444",
                  position: "relative",
                }}
                onClick={() => handleDeleteState(confirmDeleteState.id)}
                disabled={!!deletingState}
              >
                <span className="btn_text">Delete</span>
                {deletingState && (
                  <span
                    className="btn_loader"
                    style={{ width: 13, height: 13 }}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ingredients & Machineries Modal */}
      {editingEntity && (
        <Modal
          isOpen={!!editingEntity}
          onClose={() => setEditingEntity(null)}
          title={drawer === "ingredients" ? "Edit Ingredient" : "Edit Machinery"}
          description="Update details for this catalog item."
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            width: "100%",
            height: "100px",
            borderRadius: "8px",
            overflow: "hidden",
            position: "relative",
          }}>
            <img src={entityForm.image} alt={entityForm.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <button
              className="app_btn app_btn_cancel"
              style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, padding: 0, margin: 0 }}
              onClick={() => setEditingEntity(null)}
            >
              <MdClose />
            </button>
          </div>
          <form onSubmit={handleSaveEntityUpdate}>
            <div className="modal-body">
              <div className="form-field">
                <label className="modal-label">Name *</label>
                <input
                  className="modal-input"
                  value={entityForm.name}
                  onChange={(e) => setEntityForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {drawer === "ingredients" ? (
                <div className="form-field">
                  <label className="modal-label">Unit of Measure *</label>
                  <UnitSelect
                    value={entityForm.unit}
                    onChange={(e) =>
                      setEntityForm((p) => ({ ...p, unit: e.target.value }))
                    }
                    style={{ marginBottom: 8 }}
                  />
                  {/* <input
                    className="modal-input"
                    placeholder="e.g. kg, litres, pcs"
                    value={entityForm.unit}
                    onChange={(e) => setEntityForm((prev) => ({ ...prev, unit: e.target.value }))}
                    required
                  /> */}
                </div>
              ) : (
                <>
                  <div className="form-field">
                    <label className="modal-label">Description</label>
                    <textarea
                      className="modal-input"
                      style={{ height: 60, padding: 8 }}
                      value={entityForm.description}
                      onChange={(e) => setEntityForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div className="form-field">
                      <label className="modal-label">Power Consumption (W)</label>
                      <input
                        className="modal-input"
                        type="number"
                        value={entityForm.powerConsumption}
                        onChange={(e) => setEntityForm((prev) => ({ ...prev, powerConsumption: e.target.value }))}
                      />
                    </div>
                    <div className="form-field">
                      <label className="modal-label">Model Number</label>
                      <input
                        className="modal-input"
                        value={entityForm.modelNumber}
                        onChange={(e) => setEntityForm((prev) => ({ ...prev, modelNumber: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="form-field">
                    <label className="modal-label">Manufacturer</label>
                    <input
                      className="modal-input"
                      value={entityForm.manufacturer}
                      onChange={(e) => setEntityForm((prev) => ({ ...prev, manufacturer: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className="form-field">
                <label className="modal-label">Image</label>
                <input
                  className="modal-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setEntityImageFile(e.target.files[0])}
                />
              </div>

              <div className="modal-footer">
                <button className="app_btn app_btn_cancel" type="button" onClick={() => setEditingEntity(null)}>
                  Cancel
                </button>
                <button
                  className={`app_btn app_btn_confirm ${savingEntity ? "btn_loading" : ""}`}
                  type="submit"
                  disabled={savingEntity}
                  style={{ position: "relative", minWidth: 120 }}
                >
                  <span className="btn_text">Save Changes</span>
                  {savingEntity && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

