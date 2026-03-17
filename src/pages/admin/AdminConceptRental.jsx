import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdOutlineStore,
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import api from "../../api/axios";

const EMPTY = {
  country: "",
  currency: "",
  title: "",
  description: "",
  amount: "",
  refundable: false,
  recurring: false,
  intervalInDays: "",
  terms: "",
};

function RentalForm({ initial = EMPTY, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const toggle = (k) => () => setForm((p) => ({ ...p, [k]: !p[k] }));

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
          {initial.id ? "Edit Rental Setting" : "New Rental Setting"}
        </span>
        <button className="biz_icon_btn" onClick={onCancel}>
          <MdClose size={15} />
        </button>
      </div>

      <div className="admin_form_grid" style={{ marginBottom: 12 }}>
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
          <label className="modal-label">Currency *</label>
          <input
            className="modal-input"
            placeholder="e.g. NGN"
            value={form.currency}
            onChange={set("currency")}
          />
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="modal-label">Title *</label>
          <input
            className="modal-input"
            placeholder="e.g. Monthly Rental Fee"
            value={form.title}
            onChange={set("title")}
          />
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="modal-label">Amount *</label>
          <input
            className="modal-input"
            type="number"
            min="0"
            placeholder="e.g. 50000"
            value={form.amount}
            onChange={set("amount")}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="modal-label">Description *</label>
        <textarea
          className="modal-input"
          rows={2}
          style={{ resize: "none" }}
          placeholder="Describe this fee…"
          value={form.description}
          onChange={set("description")}
        />
      </div>

      <div className="admin_form_grid" style={{ marginBottom: 12 }}>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="modal-label">Interval (days)</label>
          <input
            className="modal-input"
            type="number"
            min="0"
            placeholder="e.g. 30"
            value={form.intervalInDays}
            onChange={set("intervalInDays")}
          />
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="modal-label">Terms</label>
          <input
            className="modal-input"
            placeholder="Optional terms…"
            value={form.terms}
            onChange={set("terms")}
          />
        </div>
      </div>

      {/* Toggles */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {[
          { key: "refundable", label: "Refundable" },
          { key: "recurring", label: "Recurring" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={toggle(key)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: 9,
              border: `1px solid ${form[key] ? "rgba(34,197,94,0.35)" : "var(--border)"}`,
              background: form[key]
                ? "rgba(34,197,94,0.08)"
                : "var(--bg-hover)",
              color: form[key] ? "#16a34a" : "var(--text-muted)",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: form[key] ? "#16a34a" : "var(--border)",
              }}
            />
            {label}
          </button>
        ))}
      </div>

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

function RentalCard({ item, onEdit, onDelete, deleting }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="admin_card" style={{ flexDirection: "column", gap: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 14,
          width: "100%",
        }}
      >
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
          <MdOutlineStore size={17} />
        </div>
        <div className="admin_card_body">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 5,
            }}
          >
            <span className="admin_card_title" style={{ margin: 0 }}>
              {item.title}
            </span>
            <span
              style={{
                fontSize: "0.62rem",
                fontWeight: 700,
                padding: "2px 7px",
                borderRadius: 999,
                background: "var(--bg-hover)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {item.country}
            </span>
          </div>
          <div className="admin_card_meta">
            <span
              className="admin_meta_chip"
              style={{
                color: "var(--accent)",
                borderColor: "rgba(203,108,220,0.2)",
                background: "rgba(203,108,220,0.08)",
              }}
            >
              {item.currency} {Number(item.amount).toLocaleString()}
            </span>
            {item.recurring && (
              <span
                className="admin_meta_chip"
                style={{
                  color: "#3b82f6",
                  borderColor: "rgba(59,130,246,0.2)",
                  background: "rgba(59,130,246,0.08)",
                }}
              >
                Recurring
              </span>
            )}
            {item.refundable && (
              <span
                className="admin_meta_chip"
                style={{
                  color: "#16a34a",
                  borderColor: "rgba(34,197,94,0.2)",
                  background: "rgba(34,197,94,0.08)",
                }}
              >
                Refundable
              </span>
            )}
            {item.intervalInDays && (
              <span className="admin_meta_chip">
                Every {item.intervalInDays} days
              </span>
            )}
          </div>
        </div>
        <div className="admin_card_actions">
          <button
            className="biz_icon_btn"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <MdExpandLess size={14} /> : <MdExpandMore size={14} />}
          </button>
          <button
            className="biz_icon_btn"
            onClick={() => onEdit(item)}
            title="Edit"
          >
            <MdEdit size={14} />
          </button>
          <button
            className="biz_icon_btn biz_icon_btn_danger"
            onClick={() => onDelete(item.id)}
            disabled={deleting === item.id}
            style={{ position: "relative" }}
          >
            {deleting === item.id ? (
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
      {expanded && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
            width: "100%",
          }}
        >
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              lineHeight: 1.55,
              marginBottom: item.terms ? 8 : 0,
            }}
          >
            {item.description}
          </div>
          {item.terms && (
            <div
              style={{
                fontSize: "0.74rem",
                color: "var(--text-muted)",
                fontStyle: "italic",
              }}
            >
              {item.terms}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConceptRentalSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await api.get("/icart/concept-rental-settings");
      setItems(r.data.data || []);
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, []);

  const handleSave = async (form) => {
    const required = ["country", "currency", "title", "description", "amount"];
    for (const k of required) {
      if (!form[k].toString().trim()) return toast.error(`${k} is required`);
    }
    setSaving(true);
    try {
      const body = {
        country: form.country.trim(),
        currency: form.currency.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        amount: Number(form.amount),
        refundable: Boolean(form.refundable),
        recurring: Boolean(form.recurring),
        ...(form.intervalInDays && {
          intervalInDays: Number(form.intervalInDays),
        }),
        ...(form.terms && { terms: form.terms }),
      };
      if (form.id) {
        await api.patch(`/icart/concept-rental-settings/${form.id}`, body);
        toast.success("Setting updated");
      } else {
        await api.post("/icart/concept-rental-settings", body);
        toast.success("Setting created");
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
    if (!window.confirm("Delete this rental setting?")) return;
    setDeleting(id);
    try {
      await api.delete(`/icart/concept-rental-settings/${id}`);
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
          <h2 className="admin_page_title">Concept Rental Settings</h2>
          <p className="admin_page_sub">
            Define pricing for vendors renting concepts to deploy on iCarts.
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
            <span className="btn_text_label"> New Setting</span>
          </button>
        )}
      </div>

      {showForm && (
        <RentalForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      )}
      {editing && (
        <RentalForm
          initial={editing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}

      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : items.length === 0 && !showForm ? (
        <div className="admin_empty">
          <MdOutlineStore size={28} style={{ opacity: 0.3 }} />
          <p className="admin_empty_title">No rental settings yet</p>
          <p className="admin_empty_sub">
            Create rental pricing plans for concept deployment.
          </p>
        </div>
      ) : (
        <div className="admin_card_list">
          {items
            .filter((i) => editing?.id !== i.id)
            .map((item) => (
              <RentalCard
                key={item.id}
                item={item}
                onEdit={setEditing}
                onDelete={handleDelete}
                deleting={deleting}
              />
            ))}
        </div>
      )}
    </div>
  );
}
