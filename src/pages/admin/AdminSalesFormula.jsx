import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdEdit, MdDelete, MdClose } from "react-icons/md";
import { LuPlus } from "react-icons/lu";
import api from "../../api/axios";
import { CountrySelect } from "./adminUtils";

const EMPTY = { country: "", vendorPercent: "", noraPercent: "" };

export default function AdminSalesFormula() {
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [deleting, setDeleting] = useState(null);

  const fetch = async () => {
    try {
      const r = await api.get("/icart/sales-formula");
      setFormulas(r.data.data || []);
    } catch {
      toast.error("Failed to load formulas");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetch();
  }, []);

  const openCreate = () => {
    setForm(EMPTY);
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (f) => {
    setForm(f);
    setEditing(f);
    setShowForm(true);
  };
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const ownerPct = () => {
    const v = Number(form.vendorPercent),
      n = Number(form.noraPercent);
    return !isNaN(v) && !isNaN(n) && v + n <= 100
      ? (100 - v - n).toFixed(1)
      : "—";
  };

  const handleSave = async () => {
    if (
      !form.country.trim() ||
      form.vendorPercent === "" ||
      form.noraPercent === ""
    )
      return toast.error("All fields required");
    if (Number(form.vendorPercent) + Number(form.noraPercent) > 100)
      return toast.error("Cannot exceed 100%");
    setSaving(true);
    try {
      const body = {
        country: form.country.trim(),
        vendorPercent: Number(form.vendorPercent),
        noraPercent: Number(form.noraPercent),
      };
      if (editing) await api.patch(`/icart/sales-formula/${editing.id}`, body);
      else await api.post("/icart/sales-formula", body);
      toast.success(editing ? "Updated" : "Created");
      setShowForm(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this formula?")) return;
    setDeleting(id);
    try {
      await api.delete(`/icart/sales-formula/${id}`);
      toast.success("Deleted");
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="admin_settings_panel">
      <div className="admin_settings_panel_header">
        <span className="admin_settings_panel_title">Sales Formula</span>
        <button
          className="app_btn app_btn_confirm biz_add_btn"
          onClick={openCreate}
        >
          <LuPlus size={13} /> Add
        </button>
      </div>
      <div className="admin_settings_panel_body">
        {showForm && (
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
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "var(--text-heading)",
                }}
              >
                {editing ? "Edit" : "New"} Formula
              </span>
              <button
                className="biz_icon_btn"
                onClick={() => setShowForm(false)}
              >
                <MdClose size={13} />
              </button>
            </div>
            <div className="admin_form_grid_3" style={{ marginBottom: 10 }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Country *</label>
                <CountrySelect
                  value={form.country}
                  onChange={set("country")}
                  required
                />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Vendor %</label>
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="5"
                  value={form.vendorPercent}
                  onChange={set("vendorPercent")}
                />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Nora %</label>
                <input
                  className="modal-input"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="25"
                  value={form.noraPercent}
                  onChange={set("noraPercent")}
                />
              </div>
            </div>
            {form.vendorPercent && form.noraPercent && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[
                  { l: "Vendor", v: `${form.vendorPercent}%`, c: "#3b82f6" },
                  { l: "Nora", v: `${form.noraPercent}%`, c: "var(--accent)" },
                  { l: "Owner", v: `${ownerPct()}%`, c: "#16a34a" },
                ].map((x) => (
                  <div
                    key={x.l}
                    style={{
                      flex: 1,
                      padding: "6px 10px",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.58rem",
                        fontWeight: 700,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        marginBottom: 2,
                      }}
                    >
                      {x.l}
                    </div>
                    <div
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 900,
                        color: x.c,
                      }}
                    >
                      {x.v}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                className="app_btn app_btn_cancel"
                style={{ height: 34 }}
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button
                className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
                style={{ height: 34, minWidth: 80, position: "relative" }}
                onClick={handleSave}
                disabled={saving}
              >
                <span className="btn_text">{editing ? "Save" : "Create"}</span>
                {saving && (
                  <span
                    className="btn_loader"
                    style={{ width: 12, height: 12 }}
                  />
                )}
              </button>
            </div>
          </div>
        )}
        {loading ? (
          <div className="page_loader" style={{ padding: 24 }}>
            <div className="page_loader_spinner" />
          </div>
        ) : formulas.length === 0 && !showForm ? (
          <div
            style={{
              padding: "20px 0",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "0.8rem",
            }}
          >
            No formulas yet.
          </div>
        ) : (
          formulas.map((f) => (
            <div
              key={f.id}
              style={{
                display: "flex",
                alignItems: "center",
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
                  {f.country}
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {[
                    { l: "Vendor", v: f.vendorPercent, c: "#3b82f6" },
                    { l: "Nora", v: f.noraPercent, c: "var(--accent)" },
                    {
                      l: "Owner",
                      v: (100 - f.vendorPercent - f.noraPercent).toFixed(1),
                      c: "#16a34a",
                    },
                  ].map((x) => (
                    <span
                      key={x.l}
                      className="admin_meta_chip"
                      style={{ color: x.c }}
                    >
                      {x.l} {x.v}%
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="biz_icon_btn" onClick={() => openEdit(f)}>
                  <MdEdit size={13} />
                </button>
                <button
                  className="biz_icon_btn biz_icon_btn_danger"
                  onClick={() => handleDelete(f.id)}
                  disabled={deleting === f.id}
                  style={{ position: "relative" }}
                >
                  {deleting === f.id ? (
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
