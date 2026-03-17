import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdEdit, MdDelete } from "react-icons/md";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";
import { CountrySelect } from "./adminUtils";

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

export default function AdminRentalSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetch = async () => {
    try {
      const r = await api.get("/icart/concept-rental-settings");
      setItems(r.data.data || []);
    } catch {
      toast.error("Failed");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetch();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setOpen(true);
  };
  const openEdit = (i) => {
    setForm({ ...i, payments: i.payments || [{ ...EMPTY_PAYMENT }] });
    setEditing(i);
    setOpen(true);
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

  const handleSave = async () => {
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
      if (editing)
        await api.patch(`/icart/concept-rental-settings/${editing.id}`, body);
      else await api.post("/icart/concept-rental-settings", body);
      toast.success(editing ? "Updated" : "Created");
      setOpen(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    setDeleting(id);
    try {
      await api.delete(`/icart/concept-rental-settings/${id}`);
      toast.success("Deleted");
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <div className="admin_settings_panel">
        <div className="admin_settings_panel_header">
          <span className="admin_settings_panel_title">
            Concept Rental Settings
          </span>
          <button
            className="app_btn app_btn_confirm biz_add_btn"
            onClick={openCreate}
          >
            <LuPlus size={13} /> Add
          </button>
        </div>
        <div className="admin_settings_panel_body">
          {loading ? (
            <div className="page_loader" style={{ padding: 24 }}>
              <div className="page_loader_spinner" />
            </div>
          ) : items.length === 0 ? (
            <div
              style={{
                padding: "20px 0",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: "0.8rem",
              }}
            >
              No rental settings yet.
            </div>
          ) : (
            items.map((item) => (
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
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    className="biz_icon_btn"
                    onClick={() => openEdit(item)}
                  >
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

      <Drawer
        isOpen={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Rental Setting" : "New Rental Setting"}
        description="Define concept rental pricing per country"
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
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
              style={{ flex: 2, height: 42, position: "relative" }}
              onClick={handleSave}
              disabled={saving}
            >
              <span className="btn_text">
                {editing ? "Save Changes" : "Create"}
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
    </>
  );
}
