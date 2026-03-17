import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdOutlineCalculate,
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
} from "react-icons/md";
import api from "../../api/axios";

const EMPTY = { country: "", vendorPercent: "", noraPercent: "" };

function FormulaForm({ initial = EMPTY, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const ownerPercent = (() => {
    const v = Number(form.vendorPercent);
    const n = Number(form.noraPercent);
    if (!isNaN(v) && !isNaN(n) && v + n <= 100) return (100 - v - n).toFixed(1);
    return "—";
  })();

  return (
    <div className="admin_form_card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span className="admin_form_title" style={{ margin: 0 }}>
          {initial.id ? "Edit Formula" : "New Sales Formula"}
        </span>
        <button className="biz_icon_btn" onClick={onCancel}>
          <MdClose size={15} />
        </button>
      </div>

      <div className="admin_form_grid_3" style={{ marginBottom: 12 }}>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="modal-label">Country *</label>
          <input
            className="modal-input"
            placeholder="e.g. Nigeria"
            value={form.country}
            onChange={set("country")}
          />
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="modal-label">Vendor % *</label>
          <input
            className="modal-input"
            type="number"
            min="0"
            max="100"
            placeholder="e.g. 5"
            value={form.vendorPercent}
            onChange={set("vendorPercent")}
          />
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="modal-label">Nora % *</label>
          <input
            className="modal-input"
            type="number"
            min="0"
            max="100"
            placeholder="e.g. 25"
            value={form.noraPercent}
            onChange={set("noraPercent")}
          />
        </div>
      </div>

      {/* Live breakdown */}
      {form.vendorPercent && form.noraPercent && (
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 14,
            flexWrap: "wrap",
          }}
        >
          {[
            {
              label: "Vendor",
              val: `${form.vendorPercent}%`,
              color: "#3b82f6",
            },
            {
              label: "Nora",
              val: `${form.noraPercent}%`,
              color: "var(--accent)",
            },
            { label: "Owner", val: `${ownerPercent}%`, color: "#16a34a" },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                flex: 1,
                minWidth: 80,
                padding: "8px 12px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 9,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 3,
                }}
              >
                {c.label}
              </div>
              <div
                style={{ fontSize: "1rem", fontWeight: 900, color: c.color }}
              >
                {c.val}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          className="app_btn app_btn_cancel"
          style={{ height: 38 }}
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
          style={{ height: 38, minWidth: 100, position: "relative" }}
          onClick={() => onSave(form)}
          disabled={saving}
        >
          <span className="btn_text">
            {initial.id ? "Save Changes" : "Create"}
          </span>
          {saving && (
            <span className="btn_loader" style={{ width: 13, height: 13 }} />
          )}
        </button>
      </div>
    </div>
  );
}

export default function SalesFormula() {
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetch = async () => {
    setLoading(true);
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

  const handleSave = async (form) => {
    if (!form.country.trim()) return toast.error("Country is required");
    if (form.vendorPercent === "" || form.noraPercent === "")
      return toast.error("Both percentages are required");
    const total = Number(form.vendorPercent) + Number(form.noraPercent);
    if (total > 100) return toast.error("Vendor % + Nora % cannot exceed 100%");

    setSaving(true);
    try {
      const body = {
        country: form.country.trim(),
        vendorPercent: Number(form.vendorPercent),
        noraPercent: Number(form.noraPercent),
      };
      if (form.id) {
        await api.patch(`/icart/sales-formula/${form.id}`, body);
        toast.success("Formula updated");
      } else {
        await api.post("/icart/sales-formula", body);
        toast.success("Formula created");
      }
      setShowForm(false);
      setEditing(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
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
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="admin_page">
      <div className="admin_page_header">
        <div>
          <h2 className="admin_page_title">Sales Formula</h2>
          <p className="admin_page_sub">
            Define how sale revenue is split between vendor, Nora, and cart
            owner — per country.
          </p>
        </div>
        {!showForm && !editing && (
          <button
            className="app_btn app_btn_confirm"
            style={{
              height: 38,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onClick={() => setShowForm(true)}
          >
            <MdAdd size={16} />
            <span className="btn_text_label"> New Formula</span>
          </button>
        )}
      </div>

      {showForm && (
        <FormulaForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      )}

      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : formulas.length === 0 && !showForm ? (
        <div className="admin_empty">
          <MdOutlineCalculate size={28} style={{ opacity: 0.3 }} />
          <p className="admin_empty_title">No formulas yet</p>
          <p className="admin_empty_sub">
            Create a formula to define how revenue is distributed for each
            country.
          </p>
        </div>
      ) : (
        <div className="admin_card_list">
          {formulas.map((f) =>
            editing?.id === f.id ? (
              <FormulaForm
                key={f.id}
                initial={editing}
                onSave={handleSave}
                onCancel={() => setEditing(null)}
                saving={saving}
              />
            ) : (
              <div key={f.id} className="admin_card">
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: "var(--bg-active)",
                    border: "1px solid rgba(203,108,220,0.2)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <MdOutlineCalculate size={17} />
                </div>
                <div className="admin_card_body">
                  <div className="admin_card_title">{f.country}</div>
                  <div className="admin_card_meta">
                    <span
                      className="admin_meta_chip"
                      style={{
                        color: "#3b82f6",
                        borderColor: "rgba(59,130,246,0.2)",
                        background: "rgba(59,130,246,0.08)",
                      }}
                    >
                      Vendor {f.vendorPercent}%
                    </span>
                    <span
                      className="admin_meta_chip"
                      style={{
                        color: "var(--accent)",
                        borderColor: "rgba(203,108,220,0.2)",
                        background: "rgba(203,108,220,0.08)",
                      }}
                    >
                      Nora {f.noraPercent}%
                    </span>
                    <span
                      className="admin_meta_chip"
                      style={{
                        color: "#16a34a",
                        borderColor: "rgba(34,197,94,0.2)",
                        background: "rgba(34,197,94,0.08)",
                      }}
                    >
                      Owner {(100 - f.vendorPercent - f.noraPercent).toFixed(1)}
                      %
                    </span>
                  </div>
                </div>
                <div className="admin_card_actions">
                  <button
                    className="biz_icon_btn"
                    onClick={() => setEditing(f)}
                    title="Edit"
                  >
                    <MdEdit size={14} />
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
                          width: 13,
                          height: 13,
                          borderColor: "#ef4444",
                          borderTopColor: "transparent",
                        }}
                      />
                    ) : (
                      <MdDelete size={14} />
                    )}
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
