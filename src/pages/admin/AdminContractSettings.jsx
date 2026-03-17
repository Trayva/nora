import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdOutlineDescription,
  MdAdd,
  MdDelete,
  MdClose,
  MdEdit,
  MdExpandMore,
  MdExpandLess,
} from "react-icons/md";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import api from "../../api/axios";

const EMPTY_PAYMENT = {
  title: "",
  description: "",
  amount: "",
  refundable: false,
  recurring: false,
};
const EMPTY_FORM = {
  durationDays: "",
  country: "",
  currency: "",
  type: "LEASE",
  terms: "",
  length: "",
  breadth: "",
  unit: "m",
  payments: [{ ...EMPTY_PAYMENT }],
};

function PaymentRow({ payment, idx, onChange, onRemove, canRemove }) {
  const set = (k) => (e) => onChange(idx, k, e.target.value);
  const toggle = (k) => () => onChange(idx, k, !payment[k]);

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
      }}
    >
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
          Payment {idx + 1}
        </span>
        {canRemove && (
          <button
            className="biz_icon_btn biz_icon_btn_danger"
            onClick={() => onRemove(idx)}
            style={{ width: 22, height: 22 }}
          >
            <LuTrash2 size={12} />
          </button>
        )}
      </div>
      <div className="admin_form_grid" style={{ marginBottom: 8 }}>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="modal-label">Title *</label>
          <input
            className="modal-input"
            placeholder="e.g. Security Deposit"
            value={payment.title}
            onChange={set("title")}
          />
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="modal-label">Amount *</label>
          <input
            className="modal-input"
            type="number"
            min="0"
            placeholder="e.g. 100000"
            value={payment.amount}
            onChange={set("amount")}
          />
        </div>
      </div>
      <div className="form-field" style={{ marginBottom: 8 }}>
        <label className="modal-label">Description</label>
        <input
          className="modal-input"
          placeholder="Brief description…"
          value={payment.description}
          onChange={set("description")}
        />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
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
              gap: 5,
              padding: "4px 11px",
              borderRadius: 8,
              border: `1px solid ${payment[key] ? "rgba(34,197,94,0.35)" : "var(--border)"}`,
              background: payment[key]
                ? "rgba(34,197,94,0.08)"
                : "var(--bg-hover)",
              color: payment[key] ? "#16a34a" : "var(--text-muted)",
              fontSize: "0.73rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: payment[key] ? "#16a34a" : "var(--border)",
              }}
            />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ContractForm({ initial = EMPTY_FORM, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const updatePayment = (i, k, v) =>
    setForm((p) => {
      const payments = [...p.payments];
      payments[i] = { ...payments[i], [k]: v };
      return { ...p, payments };
    });
  const addPayment = () =>
    setForm((p) => ({ ...p, payments: [...p.payments, { ...EMPTY_PAYMENT }] }));
  const removePayment = (i) =>
    setForm((p) => ({
      ...p,
      payments: p.payments.filter((_, idx) => idx !== i),
    }));

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
          {initial.id ? "Edit Contract Setting" : "New Contract Setting"}
        </span>
        <button className="biz_icon_btn" onClick={onCancel}>
          <MdClose size={15} />
        </button>
      </div>

      {/* Top fields */}
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
          <label className="modal-label">Type *</label>
          <select
            className="modal-input"
            value={form.type}
            onChange={set("type")}
          >
            <option value="LEASE">LEASE</option>
            <option value="PURCHASE">PURCHASE</option>
          </select>
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="modal-label">Duration (days) *</label>
          <input
            className="modal-input"
            type="number"
            min="0"
            placeholder="e.g. 365"
            value={form.durationDays}
            onChange={set("durationDays")}
          />
        </div>
      </div>

      {/* Kiosk size */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 80px",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="modal-label">Kiosk Length *</label>
          <input
            className="modal-input"
            type="number"
            min="0"
            placeholder="e.g. 2"
            value={form.length}
            onChange={set("length")}
          />
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="modal-label">Kiosk Breadth *</label>
          <input
            className="modal-input"
            type="number"
            min="0"
            placeholder="e.g. 1.5"
            value={form.breadth}
            onChange={set("breadth")}
          />
        </div>
        <div className="form-field" style={{ marginBottom: 0 }}>
          <label className="modal-label">Unit *</label>
          <select
            className="modal-input"
            value={form.unit}
            onChange={set("unit")}
          >
            <option value="m">m</option>
            <option value="cm">cm</option>
          </select>
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

      {/* Payments */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <label className="modal-label" style={{ margin: 0 }}>
            Payments *{" "}
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
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
          <PaymentRow
            key={i}
            payment={p}
            idx={i}
            onChange={updatePayment}
            onRemove={removePayment}
            canRemove={form.payments.length > 1}
          />
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

function SettingCard({ item, onEdit, onDelete, deleting }) {
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
          <MdOutlineDescription size={17} />
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
              {item.type} — {item.country}
            </span>
          </div>
          <div className="admin_card_meta">
            <span className="admin_meta_chip">{item.currency}</span>
            {item.durationDays && (
              <span className="admin_meta_chip">{item.durationDays} days</span>
            )}
            {item.kioskSize && (
              <span className="admin_meta_chip">
                {item.kioskSize.length}×{item.kioskSize.breadth}{" "}
                {item.kioskSize.unit}
              </span>
            )}
            <span className="admin_meta_chip">
              {item.payments?.length || 0} payment
              {item.payments?.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="admin_card_actions">
          <button
            className="biz_icon_btn"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? <MdExpandLess size={14} /> : <MdExpandMore size={14} />}
          </button>
          <button className="biz_icon_btn" onClick={() => onEdit(item)}>
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
      {expanded && item.payments?.length > 0 && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: "1px solid var(--border)",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {item.payments.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 11px",
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--text-body)",
                  }}
                >
                  {p.title}
                </div>
                {p.description && (
                  <div
                    style={{ fontSize: "0.71rem", color: "var(--text-muted)" }}
                  >
                    {p.description}
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 800,
                    color: "var(--text-heading)",
                  }}
                >
                  {item.currency} {Number(p.amount).toLocaleString()}
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  {p.recurring && (
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
                  {p.refundable && (
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminContractSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const r = await api.get("/contract/settings");
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
    if (
      !form.country ||
      !form.currency ||
      !form.durationDays ||
      !form.length ||
      !form.breadth
    )
      return toast.error("Please fill all required fields");
    if (
      !form.payments.length ||
      form.payments.some((p) => !p.title || !p.amount)
    )
      return toast.error("Each payment needs a title and amount");

    setSaving(true);
    try {
      const body = {
        ...(form.id && { id: form.id }),
        durationDays: Number(form.durationDays),
        country: form.country.trim(),
        currency: form.currency.trim(),
        type: form.type,
        length: Number(form.length),
        breadth: Number(form.breadth),
        unit: form.unit,
        ...(form.terms && { terms: form.terms }),
        payments: form.payments.map((p) => ({
          title: p.title,
          description: p.description || "",
          amount: Number(p.amount),
          refundable: Boolean(p.refundable),
          recurring: Boolean(p.recurring),
        })),
      };
      await api.post("/contract/settings", body);
      toast.success(form.id ? "Setting updated" : "Setting created");
      setShowForm(false);
      setEditing(null);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const prepareEdit = (item) => {
    setEditing({
      ...item,
      length: item.kioskSize?.length || "",
      breadth: item.kioskSize?.breadth || "",
      unit: item.kioskSize?.unit || "m",
      payments: item.payments || [{ ...EMPTY_PAYMENT }],
    });
  };

  return (
    <div className="admin_page">
      <div className="admin_page_header">
        <div>
          <h2 className="admin_page_title">Contract Settings</h2>
          <p className="admin_page_sub">
            Define lease and purchase plans for iCart contracts, including kiosk
            size and payment schedules.
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
        <ContractForm
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      )}
      {editing && (
        <ContractForm
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
          <MdOutlineDescription size={28} style={{ opacity: 0.3 }} />
          <p className="admin_empty_title">No contract settings yet</p>
          <p className="admin_empty_sub">
            Create lease or purchase plans for iCart contracts.
          </p>
        </div>
      ) : (
        <div className="admin_card_list">
          {items
            .filter((i) => editing?.id !== i.id)
            .map((item) => (
              <SettingCard
                key={item.id}
                item={item}
                onEdit={prepareEdit}
                onDelete={(id) => {
                  if (window.confirm("Delete this setting?")) {
                    setDeleting(id);
                    api
                      .delete(`/contract/settings/${id}`)
                      .then(() => {
                        toast.success("Deleted");
                        fetch();
                      })
                      .catch(() => toast.error("Failed"))
                      .finally(() => setDeleting(null));
                  }
                }}
                deleting={deleting}
              />
            ))}
        </div>
      )}
    </div>
  );
}
