import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdEdit,
  MdDelete,
  MdExpandMore,
  MdExpandLess,
  MdCheck,
  MdCircle,
} from "react-icons/md";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import Drawer from "../../components/Drawer";
import Modal from "../../components/Modal";
import api from "../../api/axios";
import { CountrySelect } from "./adminUtils_";

/* ─── constants ─────────────────────────────────────────────── */
const EMPTY_PAYMENT = {
  title: "",
  description: "",
  amount: "",
  refundable: false,
  recurring: false,
  intervalInDays: "",
};
const EMPTY_FORM = {
  country: "",
  currency: "",
  terms: "",
  payments: [{ ...EMPTY_PAYMENT }],
};

const STATUS_COLORS = {
  PENDING: {
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
  ACTIVE: {
    bg: "rgba(34,197,94,0.1)",
    color: "#16a34a",
    border: "rgba(34,197,94,0.25)",
  },
};
const getStatusStyle = (s) => STATUS_COLORS[s] || STATUS_COLORS.PENDING;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

/* ─── ApplicationDrawer ─────────────────────────────────────── */
function ApplicationDrawer({ app, onClose, onStatusUpdated, onDeleted }) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.patch(`/kioskVendorApplication/${app.id}/status`, {
        status: newStatus,
      });
      toast.success(`Status updated to ${newStatus}`);
      onStatusUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/kioskVendorApplication/${app.id}`);
      toast.success("Application deleted");
      setConfirmDelete(false);
      onDeleted();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (!app) return null;
  const s = getStatusStyle(app.status);
  const user = app.user || app.vendor?.user;

  return (
    <>
      <Drawer
        isOpen={!!app}
        onClose={onClose}
        title={`Application #${app.id?.slice(0, 8).toUpperCase()}`}
        description="Vendor application details"
        width={500}
      >
        {/* Status badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              padding: "4px 10px",
              borderRadius: 999,
              background: s.bg,
              color: s.color,
              border: `1px solid ${s.border}`,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <MdCircle size={5} /> {app.status || "PENDING"}
          </span>
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
            {fmtDate(app.createdAt)}
          </span>
        </div>

        {/* Applicant info */}
        {(user || app.vendor) && (
          <div
            style={{
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: "0.62rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 10,
              }}
            >
              Applicant
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(user?.fullName || user?.name) && (
                <div className="kiosk_meta_row">
                  <span className="kiosk_meta_key">Name</span>
                  <span className="kiosk_meta_val">
                    {user.fullName || user.name}
                  </span>
                </div>
              )}
              {user?.email && (
                <div className="kiosk_meta_row">
                  <span className="kiosk_meta_key">Email</span>
                  <span className="kiosk_meta_val">{user.email}</span>
                </div>
              )}
              {app.vendor?.businessName && (
                <div className="kiosk_meta_row">
                  <span className="kiosk_meta_key">Business</span>
                  <span className="kiosk_meta_val">
                    {app.vendor.businessName}
                  </span>
                </div>
              )}
              {app.country && (
                <div className="kiosk_meta_row">
                  <span className="kiosk_meta_key">Country</span>
                  <span className="kiosk_meta_val">{app.country}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Application fields */}
        {Object.entries(app).filter(
          ([k]) =>
            ![
              "id",
              "status",
              "createdAt",
              "updatedAt",
              "user",
              "vendor",
              "payments",
            ].includes(k) &&
            app[k] != null &&
            typeof app[k] !== "object",
        ).length > 0 && (
          <div
            style={{
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "14px 16px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: "0.62rem",
                fontWeight: 900,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 10,
              }}
            >
              Details
            </div>
            {Object.entries(app)
              .filter(
                ([k]) =>
                  ![
                    "id",
                    "status",
                    "createdAt",
                    "updatedAt",
                    "user",
                    "vendor",
                    "payments",
                  ].includes(k) &&
                  app[k] != null &&
                  typeof app[k] !== "object",
              )
              .map(([k, v]) => (
                <div key={k} className="kiosk_meta_row">
                  <span
                    className="kiosk_meta_key"
                    style={{ textTransform: "capitalize" }}
                  >
                    {k.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span className="kiosk_meta_val">{String(v)}</span>
                </div>
              ))}
          </div>
        )}

        {/* Status actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              fontSize: "0.62rem",
              fontWeight: 900,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: 4,
            }}
          >
            Update Status
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {["APPROVED", "REJECTED", "PENDING"].map((status) => {
              const sc = getStatusStyle(status);
              const isCurrent = app.status === status;
              return (
                <button
                  key={status}
                  onClick={() => !isCurrent && handleStatus(status)}
                  disabled={updatingStatus || isCurrent}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 9,
                    border: `1px solid ${isCurrent ? sc.border : "var(--border)"}`,
                    background: isCurrent ? sc.bg : "var(--bg-hover)",
                    color: isCurrent ? sc.color : "var(--text-muted)",
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    cursor: isCurrent ? "default" : "pointer",
                    fontFamily: "inherit",
                    opacity: updatingStatus ? 0.6 : 1,
                  }}
                >
                  {isCurrent ? (
                    <>
                      <MdCheck size={12} style={{ marginRight: 4 }} />
                      {status}
                    </>
                  ) : (
                    status
                  )}
                </button>
              );
            })}
          </div>

          {/* Delete */}
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              marginTop: 8,
              height: 36,
              borderRadius: 9,
              border: "1px solid rgba(239,68,68,0.25)",
              background: "rgba(239,68,68,0.06)",
              color: "#ef4444",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Delete Application
          </button>
        </div>
      </Drawer>

      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Application"
        description={`Are you sure you want to delete application #${app.id?.slice(0, 8).toUpperCase()}? This cannot be undone.`}
      >
        <div className="modal-body">
          <div className="modal-footer">
            <button
              className="app_btn app_btn_cancel"
              type="button"
              onClick={() => setConfirmDelete(false)}
            >
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm ${deleting ? "btn_loading" : ""}`}
              style={{
                background: "#ef4444",
                position: "relative",
                minWidth: 110,
              }}
              onClick={handleDelete}
              disabled={deleting}
            >
              <span className="btn_text">Delete</span>
              {deleting && (
                <span
                  className="btn_loader"
                  style={{ width: 14, height: 14 }}
                />
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function AdminVendorApplicationSettings() {
  /* ── Settings state ── */
  const [settings, setSettings] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingSetting, setDeletingSetting] = useState(null);
  const [confirmDeleteSetting, setConfirmDeleteSetting] = useState(null);

  /* ── Applications state ── */
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsExpanded, setAppsExpanded] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  /* ── Fetch ── */
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const r = await api.get("/kioskVendorApplication/settings/all");
      setSettings(r.data.data || []);
    } catch {
      toast.error("Failed to load vendor settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchApplications = async () => {   
    setAppsLoading(true);
    try {
      const r = await api.get("/kioskVendorApplication");
      const d = r.data.data;
      setApplications(Array.isArray(d) ? d : d?.items || d?.applications || []);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setAppsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchApplications();
  }, []);

  /* ── Settings form helpers ── */
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingSetting(null);
    setSettingsOpen(true);
  };
  const openEdit = (item) => {
    setForm({ ...item, payments: item.payments || [{ ...EMPTY_PAYMENT }] });
    setEditingSetting(item);
    setSettingsOpen(true);
  };
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const updatePayment = (i, k, v) =>
    setForm((p) => {
      const ps = [...p.payments];
      ps[i] = { ...ps[i], [k]: v };
      return { ...p, payments: ps };
    });
  const addPayment = () =>
    setForm((p) => ({ ...p, payments: [...p.payments, { ...EMPTY_PAYMENT }] }));
  const removePayment = (i) =>
    setForm((p) => ({
      ...p,
      payments: p.payments.filter((_, idx) => idx !== i),
    }));

  const handleSaveSetting = async () => {
    if (!form.country || !form.currency)
      return toast.error("Country and currency required");
    if (
      !form.payments.length ||
      form.payments.some((p) => !p.title || !p.amount)
    )
      return toast.error("Each payment needs title and amount");
    setSaving(true);
    try {
      const body = {
        country: form.country.trim(),
        currency: form.currency.trim(),
        ...(form.terms && { terms: form.terms }),
        payments: form.payments.map((p) => ({
          title: p.title,
          description: p.description || "",
          amount: Number(p.amount),
          refundable: Boolean(p.refundable),
          recurring: Boolean(p.recurring),
          ...(p.intervalInDays && { intervalInDays: Number(p.intervalInDays) }),
        })),
      };
      if (editingSetting)
        await api.patch(
          `/kioskVendorApplication/settings/${editingSetting.id}`,
          body,
        );
      else await api.post("/kioskVendorApplication/settings", body);
      toast.success(editingSetting ? "Updated" : "Created");
      setSettingsOpen(false);
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSetting = async () => {
    if (!confirmDeleteSetting) return;
    setDeletingSetting(confirmDeleteSetting.id);
    try {
      await api.delete(
        `/kioskVendorApplication/settings/${confirmDeleteSetting.id}`,
      );
      toast.success("Deleted");
      setConfirmDeleteSetting(null);
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setDeletingSetting(null);
    }
  };

  /* ── Counts ── */
  const pendingCount = applications.filter(
    (a) => (a.status || "PENDING") === "PENDING",
  ).length;
  const visibleApps = appsExpanded ? applications : applications.slice(0, 4);

  return (
    <>
      {/* ════ APPLICATIONS PANEL ════ */}
      <div className="admin_settings_panel">
        <div className="admin_settings_panel_header">
          <span className="admin_settings_panel_title">
            Vendor Applications
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {pendingCount > 0 && (
              <span
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: "rgba(234,179,8,0.1)",
                  color: "#ca8a04",
                  border: "1px solid rgba(234,179,8,0.25)",
                }}
              >
                {pendingCount} pending
              </span>
            )}
          </div>
        </div>
        <div className="admin_settings_panel_body">
          {appsLoading ? (
            <div className="page_loader" style={{ padding: 24 }}>
              <div className="page_loader_spinner" />
            </div>
          ) : applications.length === 0 ? (
            <div
              style={{
                padding: "16px 0",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
              }}
            >
              No applications yet.
            </div>
          ) : (
            <>
              {visibleApps.map((app) => {
                const s = getStatusStyle(app.status);
                const user = app.user || app.vendor?.user;
                const name =
                  app.vendor?.businessName ||
                  user?.fullName ||
                  user?.name ||
                  `#${app.id?.slice(0, 8).toUpperCase()}`;
                return (
                  <div
                    key={app.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedApp(app)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          color: "var(--text-heading)",
                          marginBottom: 2,
                        }}
                      >
                        {name}
                      </div>
                      <div
                        style={{ display: "flex", gap: 5, flexWrap: "wrap" }}
                      >
                        {user?.email && (
                          <span className="admin_meta_chip">{user.email}</span>
                        )}
                        {app.country && (
                          <span className="admin_meta_chip">{app.country}</span>
                        )}
                        <span className="admin_meta_chip">
                          {fmtDate(app.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: s.bg,
                        color: s.color,
                        border: `1px solid ${s.border}`,
                        flexShrink: 0,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <MdCircle size={5} /> {app.status || "PENDING"}
                    </span>
                  </div>
                );
              })}
              {applications.length > 4 && (
                <button
                  onClick={() => setAppsExpanded((v) => !v)}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    height: 34,
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--bg-hover)",
                    color: "var(--text-muted)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                  }}
                >
                  {appsExpanded ? (
                    <>
                      <MdExpandLess size={15} /> Show less
                    </>
                  ) : (
                    <>
                      <MdExpandMore size={15} /> Show all {applications.length}{" "}
                      applications
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ════ SETTINGS PANEL ════ */}
      <div className="admin_settings_panel">
        <div className="admin_settings_panel_header">
          <span className="admin_settings_panel_title">
            Vendor Application Settings
          </span>
          <button
            className="app_btn app_btn_confirm biz_add_btn"
            onClick={openCreate}
          >
            <LuPlus size={13} /> Add
          </button>
        </div>
        <div className="admin_settings_panel_body">
          {settingsLoading ? (
            <div className="page_loader" style={{ padding: 24 }}>
              <div className="page_loader_spinner" />
            </div>
          ) : settings.length === 0 ? (
            <div
              style={{
                padding: "20px 0",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
              }}
            >
              No settings yet.
            </div>
          ) : (
            settings.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--text-heading)",
                      marginBottom: 4,
                    }}
                  >
                    {item.country}{" "}
                    <span
                      style={{ fontWeight: 500, color: "var(--text-muted)" }}
                    >
                      · {item.currency}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <span className="admin_meta_chip">
                      {item.payments?.length || 0} payment
                      {item.payments?.length !== 1 ? "s" : ""}
                    </span>
                    {item.payments?.map((p, i) => (
                      <span
                        key={i}
                        className="admin_meta_chip"
                        style={{ color: "var(--accent)" }}
                      >
                        {p.title}: {item.currency}{" "}
                        {Number(p.amount).toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    className="biz_icon_btn"
                    onClick={() => openEdit(item)}
                  >
                    <MdEdit size={13} />
                  </button>
                  <button
                    className="biz_icon_btn biz_icon_btn_danger"
                    onClick={() => setConfirmDeleteSetting(item)}
                    disabled={deletingSetting === item.id}
                    style={{ position: "relative" }}
                  >
                    {deletingSetting === item.id ? (
                      <span
                        className="btn_loader"
                        style={{
                          width: 12,
                          height: 12,
                          borderColor: "#ef4444",
                          borderTopColor: "transparent",
                        }}
                      />
                    ) : (
                      <MdDelete size={13} />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ════ SETTINGS DRAWER ════ */}
      <Drawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={editingSetting ? "Edit Vendor Setting" : "New Vendor Setting"}
        description="Define vendor application pricing per country"
        width={520}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="admin_form_grid">
            <div className="form-field">
              <label className="modal-label">Country *</label>
              <CountrySelect
                value={form.country}
                onChange={set("country")}
                required
              />
            </div>
            <div className="form-field">
              <label className="modal-label">Currency *</label>
              <input
                className="modal-input"
                placeholder="e.g. NGN"
                value={form.currency}
                onChange={set("currency")}
              />
            </div>
          </div>
          <div className="form-field">
            <label className="modal-label">Terms</label>
            <textarea
              className="modal-input"
              rows={2}
              style={{ resize: "none" }}
              placeholder="Optional terms…"
              value={form.terms}
              onChange={set("terms")}
            />
          </div>

          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <label className="modal-label" style={{ margin: 0 }}>
                Payments *{" "}
                <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>
                  (min 1)
                </span>
              </label>
              <button
                type="button"
                onClick={addPayment}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                <LuPlus size={13} /> Add Payment
              </button>
            </div>
            {form.payments.map((p, i) => (
              <div key={i} className="admin_payment_item">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Payment {i + 1}
                  </span>
                  {form.payments.length > 1 && (
                    <button
                      className="biz_icon_btn biz_icon_btn_danger"
                      onClick={() => removePayment(i)}
                      style={{ width: 22, height: 22 }}
                    >
                      <LuTrash2 size={11} />
                    </button>
                  )}
                </div>
                <div className="admin_form_grid" style={{ marginBottom: 8 }}>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="modal-label">Title *</label>
                    <input
                      className="modal-input"
                      placeholder="e.g. Base Fare"
                      value={p.title}
                      onChange={(e) =>
                        updatePayment(i, "title", e.target.value)
                      }
                    />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="modal-label">Amount *</label>
                    <input
                      className="modal-input"
                      type="number"
                      min="0"
                      placeholder="e.g. 2000"
                      value={p.amount}
                      onChange={(e) =>
                        updatePayment(i, "amount", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="form-field" style={{ marginBottom: 8 }}>
                  <label className="modal-label">Description</label>
                  <input
                    className="modal-input"
                    placeholder="Brief description…"
                    value={p.description}
                    onChange={(e) =>
                      updatePayment(i, "description", e.target.value)
                    }
                  />
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { k: "refundable", l: "Refundable" },
                    { k: "recurring", l: "Recurring" },
                  ].map(({ k, l }) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => updatePayment(i, k, !p[k])}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 11px",
                        borderRadius: 8,
                        border: `1px solid ${p[k] ? "rgba(34,197,94,0.35)" : "var(--border)"}`,
                        background: p[k]
                          ? "rgba(34,197,94,0.08)"
                          : "var(--bg-hover)",
                        color: p[k] ? "#16a34a" : "var(--text-muted)",
                        fontSize: "0.73rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: p[k] ? "#16a34a" : "var(--border)",
                        }}
                      />
                      {l}
                    </button>
                  ))}
                  {p.recurring && (
                    <div
                      className="form-field"
                      style={{ marginBottom: 0, marginTop: 8, width: "100%" }}
                    >
                      <label className="modal-label">Interval (days)</label>
                      <input
                        className="modal-input"
                        type="number"
                        min="1"
                        placeholder="e.g. 30"
                        value={p.intervalInDays}
                        onChange={(e) =>
                          updatePayment(i, "intervalInDays", e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
            <button
              className="app_btn app_btn_cancel"
              style={{ flex: 1, height: 42 }}
              onClick={() => setSettingsOpen(false)}
            >
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
              style={{ flex: 2, height: 42, position: "relative" }}
              onClick={handleSaveSetting}
              disabled={saving}
            >
              <span className="btn_text">
                {editingSetting ? "Save Changes" : "Create"}
              </span>
              {saving && (
                <span
                  className="btn_loader"
                  style={{ width: 13, height: 13 }}
                />
              )}
            </button>
          </div>
        </div>
      </Drawer>

      {/* ════ DELETE SETTING CONFIRM ════ */}
      <Modal
        isOpen={!!confirmDeleteSetting}
        onClose={() => setConfirmDeleteSetting(null)}
        title="Delete Setting"
        description={`Are you sure you want to delete the setting for "${confirmDeleteSetting?.country}"? This cannot be undone.`}
      >
        <div className="modal-body">
          <div className="modal-footer">
            <button
              className="app_btn app_btn_cancel"
              type="button"
              onClick={() => setConfirmDeleteSetting(null)}
            >
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm ${deletingSetting ? "btn_loading" : ""}`}
              style={{
                background: "#ef4444",
                position: "relative",
                minWidth: 110,
              }}
              onClick={handleDeleteSetting}
              disabled={!!deletingSetting}
            >
              <span className="btn_text">Delete</span>
              {deletingSetting && (
                <span
                  className="btn_loader"
                  style={{ width: 14, height: 14 }}
                />
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ════ APPLICATION DETAIL DRAWER ════ */}
      {selectedApp && (
        <ApplicationDrawer
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onStatusUpdated={() => {
            setSelectedApp(null);
            fetchApplications();
          }}
          onDeleted={() => {
            setSelectedApp(null);
            fetchApplications();
          }}
        />
      )}
    </>
  );
}
