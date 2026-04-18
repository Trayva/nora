import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdEdit, MdDelete } from "react-icons/md";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";
import { CountrySelect } from "./adminUtils_";

const DURATION_PRESETS = [
  { label: "None", days: null },
  { label: "1 Month", days: 30 },
  { label: "3 Months", days: 90 },
  { label: "6 Months", days: 180 },
  { label: "1 Year", days: 365 },
  { label: "Custom", days: null },
];
const EMPTY_PAYMENT = {
  title: "",
  description: "",
  amount: "",
  refundable: false,
  recurring: false,
  intervalInDays: "",
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
  maxMenus: "",
  maxOperatorsAtATime: "",
  payments: [{ ...EMPTY_PAYMENT }],
};

export default function AdminContractSettings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [durationPreset, setDurationPreset] = useState(null);

  const fetch = async () => {
    try {
      const r = await api.get("/contract/settings");
      setItems(r.data.data || []);
    } catch {
      toast.error("Failed");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditing(null); setDurationPreset(null); setOpen(true); };
  const openEdit = (i) => {
    setForm({
      ...i,
      length: i.kioskSize?.length || "",
      breadth: i.kioskSize?.breadth || "",
      unit: i.kioskSize?.unit || "m",
      maxMenus: i.maxMenus ?? "",
      maxOperatorsAtATime: i.maxOperatorsAtATime ?? "",
      payments: i.payments || [{ ...EMPTY_PAYMENT }],
    });
    setEditing(i);
    setDurationPreset(null);
    setOpen(true);
  };
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const updatePayment = (i, k, v) =>
    setForm((p) => { const ps = [...p.payments]; ps[i] = { ...ps[i], [k]: v }; return { ...p, payments: ps }; });
  const addPayment = () => setForm((p) => ({ ...p, payments: [...p.payments, { ...EMPTY_PAYMENT }] }));
  const removePayment = (i) => setForm((p) => ({ ...p, payments: p.payments.filter((_, idx) => idx !== i) }));

  const selectPreset = (preset) => {
    setDurationPreset(preset.label);
    if (preset.days) setForm((p) => ({ ...p, durationDays: preset.days.toString() }));
    else setForm((p) => ({ ...p, durationDays: 0 }));
  };

  const handleSave = async () => {
    if (!form.country || !form.currency || !form.length || !form.breadth)
      return toast.error("Fill all required fields");
    if (form.maxMenus === "" || form.maxOperatorsAtATime === "")
      return toast.error("Max Menus and Max Operators are required");
    if (!form.payments.length || form.payments.some((p) => !p.title || !p.amount))
      return toast.error("Each payment needs title and amount");
    setSaving(true);
    try {
      const body = {
        ...(editing?.id && { id: editing.id }),
        durationDays: form.durationDays ? Number(form.durationDays) : null,
        country: form.country.trim(),
        currency: form.currency.trim(),
        type: form.type,
        length: Number(form.length),
        breadth: Number(form.breadth),
        unit: form.unit,
        maxMenus: Number(form.maxMenus),
        maxOperatorsAtATime: Number(form.maxOperatorsAtATime),
        ...(form.terms && { terms: form.terms }),
        payments: form.payments.map((p) => ({
          title: p.title,
          description: p.description || "",
          amount: Number(p.amount),
          refundable: Boolean(p.refundable),
          recurring: Boolean(p.recurring),
          ...(p.recurring && p.intervalInDays && { intervalInDays: Number(p.intervalInDays) }),
        })),
      };
      await api.post("/contract/settings", body);
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
      await api.delete(`/contract/settings/${id}`);
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
      <div className="admin_settings_panel" style={{ gridColumn: "1 / -1" }}>
        <div className="admin_settings_panel_header">
          <span className="admin_settings_panel_title">Contract Settings</span>
          <button className="app_btn app_btn_confirm biz_add_btn" onClick={openCreate}>
            <LuPlus size={13} /> Add
          </button>
        </div>
        <div className="admin_settings_panel_body">
          {loading ? (
            <div className="page_loader" style={{ padding: 24 }}><div className="page_loader_spinner" /></div>
          ) : items.length === 0 ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>
              No contract settings yet.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-heading)" }}>
                      {item.type} — {item.country}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <span className="admin_meta_chip">{item.currency}</span>
                    {item.durationDays && <span className="admin_meta_chip">{item.durationDays} days</span>}
                    {item.kioskSize && (
                      <span className="admin_meta_chip">
                        {item.kioskSize.length}×{item.kioskSize.breadth}{item.kioskSize.unit}
                      </span>
                    )}
                    <span className="admin_meta_chip">
                      {item.payments?.length || 0} payment{item.payments?.length !== 1 ? "s" : ""}
                    </span>
                    {item.maxMenus != null && (
                      <span className="admin_meta_chip">{item.maxMenus} menus</span>
                    )}
                    {item.maxOperatorsAtATime != null && (
                      <span className="admin_meta_chip">{item.maxOperatorsAtATime} operators max</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="biz_icon_btn" onClick={() => openEdit(item)}><MdEdit size={13} /></button>
                  <button className="biz_icon_btn biz_icon_btn_danger" onClick={() => handleDelete(item.id)} disabled={deleting === item.id} style={{ position: "relative" }}>
                    {deleting === item.id
                      ? <span className="btn_loader" style={{ width: 12, height: 12, borderColor: "#ef4444", borderTopColor: "transparent" }} />
                      : <MdDelete size={13} />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Drawer isOpen={open} onClose={() => setOpen(false)} title={editing ? "Edit Contract Setting" : "New Contract Setting"} description="Define lease or purchase plans for Kiosk contracts" width={540}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="admin_form_grid">
            <div className="form-field">
              <label className="modal-label">Country *</label>
              <CountrySelect value={form.country} onChange={set("country")} required />
            </div>
            <div className="form-field">
              <label className="modal-label">Currency *</label>
              <input className="modal-input" placeholder="e.g. NGN" value={form.currency} onChange={set("currency")} />
            </div>
            <div className="form-field">
              <label className="modal-label">Type *</label>
              <select className="modal-input" value={form.type} onChange={set("type")}>
                <option value="LEASE">LEASE</option>
                <option value="PURCHASE">PURCHASE</option>
                <option value="FRANCHISE">FRANCHISE</option>
              </select>
            </div>
            <div className="form-field">
              <label className="modal-label">Duration (days) *</label>
              <input className="modal-input" type="number" min="0" placeholder="e.g. 365" value={form.durationDays} onChange={set("durationDays")} />
            </div>
          </div>

          <div>
            <label className="modal-label">Quick Duration</label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {DURATION_PRESETS.map((p) => (
                <button key={p.label} type="button" onClick={() => selectPreset(p)}
                  style={{ padding: "4px 12px", borderRadius: 8, border: `1px solid ${durationPreset === p.label ? "rgba(203,108,220,0.4)" : "var(--border)"}`, background: durationPreset === p.label ? "var(--bg-active)" : "var(--bg-hover)", color: durationPreset === p.label ? "var(--accent)" : "var(--text-muted)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 12 }}>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Length *</label>
              <input className="modal-input" type="number" min="0" placeholder="2" value={form.length} onChange={set("length")} />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Breadth *</label>
              <input className="modal-input" type="number" min="0" placeholder="1.5" value={form.breadth} onChange={set("breadth")} />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Unit *</label>
              <select className="modal-input" value={form.unit} onChange={set("unit")}>
                <option value="m">m</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>

          {/* ── Max Menus & Max Operators ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Max Menu Items *</label>
              <input
                className="modal-input"
                type="number"
                min="0"
                placeholder="e.g. 5"
                value={form.maxMenus}
                onChange={set("maxMenus")}
              />
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Max Operators *</label>
              <input
                className="modal-input"
                type="number"
                min="0"
                placeholder="e.g. 3"
                value={form.maxOperatorsAtATime}
                onChange={set("maxOperatorsAtATime")}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="modal-label">Terms</label>
            <textarea className="modal-input" rows={2} style={{ resize: "none" }} placeholder="Optional terms…" value={form.terms} onChange={set("terms")} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label className="modal-label" style={{ margin: 0 }}>
                Payments * <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(min 1)</span>
              </label>
              <button type="button" onClick={addPayment}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "var(--accent)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                <LuPlus size={13} /> Add Payment
              </button>
            </div>
            {form.payments.map((p, i) => (
              <div key={i} className="admin_payment_item">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Payment {i + 1}</span>
                  {form.payments.length > 1 && (
                    <button className="biz_icon_btn biz_icon_btn_danger" onClick={() => removePayment(i)} style={{ width: 22, height: 22 }}>
                      <LuTrash2 size={11} />
                    </button>
                  )}
                </div>
                <div className="admin_form_grid" style={{ marginBottom: 8 }}>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="modal-label">Title *</label>
                    <input className="modal-input" placeholder="e.g. Security Deposit" value={p.title} onChange={(e) => updatePayment(i, "title", e.target.value)} />
                  </div>
                  <div className="form-field" style={{ marginBottom: 0 }}>
                    <label className="modal-label">Amount *</label>
                    <input className="modal-input" type="number" min="0" placeholder="e.g. 100000" value={p.amount} onChange={(e) => updatePayment(i, "amount", e.target.value)} />
                  </div>
                </div>
                <div className="form-field" style={{ marginBottom: 8 }}>
                  <label className="modal-label">Description</label>
                  <input className="modal-input" placeholder="Brief description…" value={p.description} onChange={(e) => updatePayment(i, "description", e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start" }}>
                  {[{ k: "refundable", l: "Refundable" }, { k: "recurring", l: "Recurring" }].map(({ k, l }) => (
                    <button key={k} type="button" onClick={() => updatePayment(i, k, !p[k])}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 8, border: `1px solid ${p[k] ? "rgba(34,197,94,0.35)" : "var(--border)"}`, background: p[k] ? "rgba(34,197,94,0.08)" : "var(--bg-hover)", color: p[k] ? "#16a34a" : "var(--text-muted)", fontSize: "0.73rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: p[k] ? "#16a34a" : "var(--border)" }} />
                      {l}
                    </button>
                  ))}
                </div>
                {p.recurring && (
                  <div style={{ marginTop: 10 }}>
                    <label className="modal-label">Interval</label>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                      {[{ l: "1 Month", d: 30 }, { l: "3 Months", d: 90 }, { l: "6 Months", d: 180 }, { l: "1 Year", d: 365 }].map((opt) => (
                        <button key={opt.l} type="button" onClick={() => updatePayment(i, "intervalInDays", opt.d.toString())}
                          style={{ padding: "3px 10px", borderRadius: 7, border: `1px solid ${Number(p.intervalInDays) === opt.d ? "rgba(203,108,220,0.4)" : "var(--border)"}`, background: Number(p.intervalInDays) === opt.d ? "var(--bg-active)" : "var(--bg-hover)", color: Number(p.intervalInDays) === opt.d ? "var(--accent)" : "var(--text-muted)", fontSize: "0.72rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          {opt.l}
                        </button>
                      ))}
                    </div>
                    <input className="modal-input" type="number" min="1" placeholder="Custom days" value={p.intervalInDays} onChange={(e) => updatePayment(i, "intervalInDays", e.target.value)} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, paddingTop: 8 }}>
            <button className="app_btn app_btn_cancel" style={{ flex: 1, height: 42 }} onClick={() => setOpen(false)}>Cancel</button>
            <button className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`} style={{ flex: 2, height: 42, position: "relative" }} onClick={handleSave} disabled={saving}>
              <span className="btn_text">{editing ? "Save Changes" : "Create"}</span>
              {saving && <span className="btn_loader" style={{ width: 13, height: 13 }} />}
            </button>
          </div>
        </div>
      </Drawer>
    </>
  );
}