import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdEdit, MdDelete, MdClose } from "react-icons/md";
import { LuPlus } from "react-icons/lu";
import api from "../../api/axios";
import { CountrySelect } from "./adminUtils_";

const EMPTY_FORM = {
  country: "",
  rate: 0.0,
  enabled: true,
};

export default function AdminVatSettings() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const r = await api.get("/config/vat");
      setSettings(r.data.data || []);
    } catch (err) {
      toast.error("Failed to load VAT settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setForm({
      country: item.country,
      rate: item.rate,
      enabled: !!item.enabled,
    });
    setEditing(item);
    setShowForm(true);
  };

  const set = (k) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((p) => ({ ...p, [k]: value }));
  };

  const handleSave = async () => {
    if (!form.country.trim()) {
      return toast.error("Country is required");
    }
    if (form.rate === "" || isNaN(Number(form.rate)) || Number(form.rate) < 0) {
      return toast.error("Please enter a valid VAT rate");
    }
    setSaving(true);
    try {
      await api.post("/config/vat", {
        country: form.country.trim(),
        rate: Number(form.rate),
        enabled: form.enabled,
      });
      toast.success(editing ? "VAT settings updated" : "VAT settings created");
      setShowForm(false);
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this VAT configuration?")) return;
    setDeleting(id);
    try {
      await api.delete(`/config/vat/${id}`);
      toast.success("VAT setting deleted");
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="admin_settings_panel" style={{ marginTop: 16 }}>
      <div className="admin_settings_panel_header">
        <span className="admin_settings_panel_title">Country VAT Settings</span>
        <button className="app_btn app_btn_confirm biz_add_btn" onClick={openCreate}>
          <LuPlus size={13} /> Add VAT Config
        </button>
      </div>
      <div className="admin_settings_panel_body">
        {showForm && (
          <div className="admin_form_card" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-heading)" }}>
                {editing ? "Edit" : "New"} VAT Config
              </span>
              <button className="biz_icon_btn" onClick={() => setShowForm(false)}>
                <MdClose size={13} />
              </button>
            </div>
            <div className="admin_form_grid_3" style={{ marginBottom: 10, gridTemplateColumns: "1fr 1fr" }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Country *</label>
                {editing ? (
                  <input className="modal-input" value={form.country} disabled />
                ) : (
                  <CountrySelect value={form.country} onChange={set("country")} required />
                )}
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">VAT Rate (%) *</label>
                <input
                  className="modal-input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 7.5"
                  value={form.rate}
                  onChange={set("rate")}
                />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0 14px" }}>
              <input
                type="checkbox"
                id="vat_enabled_check"
                checked={form.enabled}
                onChange={set("enabled")}
                style={{ width: 16, height: 16, cursor: "pointer" }}
              />
              <label htmlFor="vat_enabled_check" style={{ fontSize: "0.82rem", cursor: "pointer", color: "var(--text-body)" }}>
                Enable VAT for this country
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="app_btn app_btn_cancel" style={{ height: 34 }} onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button
                className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
                style={{ height: 34, minWidth: 80, position: "relative" }}
                onClick={handleSave}
                disabled={saving}
              >
                <span className="btn_text">{editing ? "Save" : "Create"}</span>
                {saving && <span className="btn_loader" style={{ width: 12, height: 12 }} />}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="page_loader" style={{ padding: 24 }}>
            <div className="page_loader_spinner" />
          </div>
        ) : settings.length === 0 && !showForm ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
            No VAT configurations set yet.
          </div>
        ) : (
          settings.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 0",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 4 }}>
                  {item.country}
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  <span className="admin_meta_chip">Rate: {item.rate}%</span>
                  <span
                    className="admin_meta_chip"
                    style={{
                      color: item.enabled ? "#16a34a" : "#ef4444",
                      borderColor: item.enabled ? "rgba(22,163,74,0.3)" : "rgba(239,68,68,0.3)",
                      background: item.enabled ? "rgba(22,163,74,0.05)" : "rgba(239,68,68,0.05)",
                    }}
                  >
                    {item.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="biz_icon_btn" onClick={() => openEdit(item)}>
                  <MdEdit size={13} />
                </button>
                <button
                  className="biz_icon_btn biz_icon_btn_danger"
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  style={{ position: "relative" }}
                >
                  {deleting === item.id ? (
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
  );
}
