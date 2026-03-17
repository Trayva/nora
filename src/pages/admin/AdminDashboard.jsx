import { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  MdOutlinePeople, MdOutlineStore, MdOutlineBadge, MdOutlineShoppingCart,
  MdOutlineLocalShipping, MdOutlineFactCheck, MdOutlineCalculate,
  MdAdd, MdEdit, MdDelete, MdClose, MdCheck, MdExpandMore, MdExpandLess,
  MdOutlineLocationOn, MdOutlineShield, MdCircle, MdArrowForward,
  MdOutlineLightMode, MdOutlineDarkMode,
} from "react-icons/md";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";

/* ── helpers ──────────────────────────────────────────────── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const STATUS_COLORS = {
  SUBMITTED:  { bg: "rgba(234,179,8,0.1)",   color: "#ca8a04", border: "rgba(234,179,8,0.25)" },
  APPROVED:   { bg: "rgba(34,197,94,0.1)",   color: "#16a34a", border: "rgba(34,197,94,0.25)" },
  ACTIVE:     { bg: "rgba(59,130,246,0.1)",  color: "#3b82f6", border: "rgba(59,130,246,0.25)" },
  CREATED:    { bg: "rgba(203,108,220,0.1)", color: "var(--accent)", border: "rgba(203,108,220,0.25)" },
  INACTIVE:   { bg: "rgba(107,114,128,0.1)", color: "#6b7280", border: "rgba(107,114,128,0.25)" },
  REJECTED:   { bg: "rgba(239,68,68,0.1)",   color: "#ef4444", border: "rgba(239,68,68,0.25)" },
  PENDING:    { bg: "rgba(234,179,8,0.1)",   color: "#ca8a04", border: "rgba(234,179,8,0.25)" },
};
const getS = (s) => STATUS_COLORS[s] || STATUS_COLORS.INACTIVE;

function StatusBadge({ status }) {
  const s = getS(status);
  return (
    <span className="admin_status_badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <MdCircle size={5} />{status}
    </span>
  );
}

/* ── Confirm delete util ──────────────────────────────────── */
function useConfirmDelete(onDelete) {
  const [pending, setPending] = useState(null);
  const confirm = (item) => {
    if (window.confirm(`Delete "${item.name || item.title || item.country || item.id}"?`)) onDelete(item.id);
  };
  return confirm;
}

/* ══════════════════════════════════════════════════════════════
   SALES FORMULA PANEL
═══════════════════════════════════════════════════════════════ */
const EMPTY_FORMULA = { country: "", vendorPercent: "", noraPercent: "" };

function SalesFormulaPanel() {
  const [formulas, setFormulas] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [form, setForm]         = useState(EMPTY_FORMULA);
  const [deleting, setDeleting] = useState(null);

  const fetch = async () => {
    try { const r = await api.get("/icart/sales-formula"); setFormulas(r.data.data || []); }
    catch { toast.error("Failed to load formulas"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm(EMPTY_FORMULA); setEditing(null); setShowForm(true); };
  const openEdit   = (f)  => { setForm(f);            setEditing(f);    setShowForm(true); };
  const set        = (k)  => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const ownerPct = () => {
    const v = Number(form.vendorPercent), n = Number(form.noraPercent);
    return (!isNaN(v) && !isNaN(n) && v + n <= 100) ? (100 - v - n).toFixed(1) : "—";
  };

  const handleSave = async () => {
    if (!form.country.trim() || form.vendorPercent === "" || form.noraPercent === "") return toast.error("All fields required");
    if (Number(form.vendorPercent) + Number(form.noraPercent) > 100) return toast.error("Cannot exceed 100%");
    setSaving(true);
    try {
      const body = { country: form.country.trim(), vendorPercent: Number(form.vendorPercent), noraPercent: Number(form.noraPercent) };
      if (editing) await api.patch(`/icart/sales-formula/${editing.id}`, body);
      else         await api.post("/icart/sales-formula", body);
      toast.success(editing ? "Updated" : "Created");
      setShowForm(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this formula?")) return;
    setDeleting(id);
    try { await api.delete(`/icart/sales-formula/${id}`); toast.success("Deleted"); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setDeleting(null); }
  };

  return (
    <div className="admin_settings_panel">
      <div className="admin_settings_panel_header">
        <span className="admin_settings_panel_title">Sales Formula</span>
        <button className="app_btn app_btn_confirm biz_add_btn" onClick={openCreate}><LuPlus size={13} /> Add</button>
      </div>
      <div className="admin_settings_panel_body">
        {showForm && (
          <div className="admin_form_card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-heading)" }}>{editing ? "Edit" : "New"} Formula</span>
              <button className="biz_icon_btn" onClick={() => setShowForm(false)}><MdClose size={13} /></button>
            </div>
            <div className="admin_form_grid_3" style={{ marginBottom: 10 }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Country *</label>
                <input className="modal-input" placeholder="Nigeria" value={form.country} onChange={set("country")} />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Vendor %</label>
                <input className="modal-input" type="number" min="0" max="100" placeholder="5" value={form.vendorPercent} onChange={set("vendorPercent")} />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Nora %</label>
                <input className="modal-input" type="number" min="0" max="100" placeholder="25" value={form.noraPercent} onChange={set("noraPercent")} />
              </div>
            </div>
            {form.vendorPercent && form.noraPercent && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {[{ l: "Vendor", v: `${form.vendorPercent}%`, c: "#3b82f6" }, { l: "Nora", v: `${form.noraPercent}%`, c: "var(--accent)" }, { l: "Owner", v: `${ownerPct()}%`, c: "#16a34a" }].map((x) => (
                  <div key={x.l} style={{ flex: 1, padding: "6px 10px", background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, textAlign: "center" }}>
                    <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 2 }}>{x.l}</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 900, color: x.c }}>{x.v}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="app_btn app_btn_cancel" style={{ height: 34 }} onClick={() => setShowForm(false)}>Cancel</button>
              <button className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`} style={{ height: 34, minWidth: 80, position: "relative" }} onClick={handleSave} disabled={saving}>
                <span className="btn_text">{editing ? "Save" : "Create"}</span>
                {saving && <span className="btn_loader" style={{ width: 12, height: 12 }} />}
              </button>
            </div>
          </div>
        )}
        {loading ? <div className="page_loader" style={{ padding: 24 }}><div className="page_loader_spinner" /></div>
          : formulas.length === 0 && !showForm ? (
            <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>No formulas yet.</div>
          ) : formulas.map((f) => (
            <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 4 }}>{f.country}</div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {[{ l: "Vendor", v: f.vendorPercent, c: "#3b82f6" }, { l: "Nora", v: f.noraPercent, c: "var(--accent)" }, { l: "Owner", v: (100 - f.vendorPercent - f.noraPercent).toFixed(1), c: "#16a34a" }].map((x) => (
                    <span key={x.l} className="admin_meta_chip" style={{ color: x.c }}>{x.l} {x.v}%</span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button className="biz_icon_btn" onClick={() => openEdit(f)}><MdEdit size={13} /></button>
                <button className="biz_icon_btn biz_icon_btn_danger" onClick={() => handleDelete(f.id)} disabled={deleting === f.id} style={{ position: "relative" }}>
                  {deleting === f.id ? <span className="btn_loader" style={{ width: 12, height: 12, borderColor: "#ef4444", borderTopColor: "transparent" }} /> : <MdDelete size={13} />}
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CONCEPT RENTAL PANEL
═══════════════════════════════════════════════════════════════ */
const EMPTY_PAYMENT = { title: "", description: "", amount: "", refundable: false, recurring: false, intervalInDays: "" };
const EMPTY_RENTAL  = { country: "", currency: "", terms: "", payments: [{ ...EMPTY_PAYMENT }] };

function RentalPanel() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY_RENTAL);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);

  const fetch = async () => {
    try { const r = await api.get("/icart/concept-rental-settings"); setItems(r.data.data || []); }
    catch { toast.error("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm(EMPTY_RENTAL); setEditing(null); setOpen(true); };
  const openEdit   = (i)  => { setForm({ ...i, payments: i.payments || [{ ...EMPTY_PAYMENT }] }); setEditing(i); setOpen(true); };
  const set        = (k)  => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const updatePayment = (i, k, v) => setForm((p) => { const ps = [...p.payments]; ps[i] = { ...ps[i], [k]: v }; return { ...p, payments: ps }; });
  const addPayment    = ()        => setForm((p) => ({ ...p, payments: [...p.payments, { ...EMPTY_PAYMENT }] }));
  const removePayment = (i)       => setForm((p) => ({ ...p, payments: p.payments.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    if (!form.country || !form.currency) return toast.error("Country and currency required");
    if (!form.payments.length || form.payments.some((p) => !p.title || !p.amount)) return toast.error("Each payment needs title and amount");
    setSaving(true);
    try {
      const body = {
        country: form.country.trim(), currency: form.currency.trim(),
        ...(form.terms && { terms: form.terms }),
        payments: form.payments.map((p) => ({
          title: p.title, description: p.description || "",
          amount: Number(p.amount), refundable: Boolean(p.refundable), recurring: Boolean(p.recurring),
          ...(p.intervalInDays && { intervalInDays: Number(p.intervalInDays) }),
        })),
      };
      if (editing) await api.patch(`/icart/concept-rental-settings/${editing.id}`, body);
      else         await api.post("/icart/concept-rental-settings", body);
      toast.success(editing ? "Updated" : "Created");
      setOpen(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    setDeleting(id);
    try { await api.delete(`/icart/concept-rental-settings/${id}`); toast.success("Deleted"); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setDeleting(null); }
  };

  return (
    <>
      <div className="admin_settings_panel">
        <div className="admin_settings_panel_header">
          <span className="admin_settings_panel_title">Concept Rental Settings</span>
          <button className="app_btn app_btn_confirm biz_add_btn" onClick={openCreate}><LuPlus size={13} /> Add</button>
        </div>
        <div className="admin_settings_panel_body">
          {loading ? <div className="page_loader" style={{ padding: 24 }}><div className="page_loader_spinner" /></div>
            : items.length === 0 ? <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>No rental settings yet.</div>
            : items.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: 4 }}>{item.country} <span style={{ fontWeight: 500, color: "var(--text-muted)" }}>· {item.currency}</span></div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <span className="admin_meta_chip">{item.payments?.length || 0} payment{item.payments?.length !== 1 ? "s" : ""}</span>
                    {item.payments?.map((p, i) => (
                      <span key={i} className="admin_meta_chip" style={{ color: "var(--accent)" }}>{p.title}: {item.currency} {Number(p.amount).toLocaleString()}</span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="biz_icon_btn" onClick={() => openEdit(item)}><MdEdit size={13} /></button>
                  <button className="biz_icon_btn biz_icon_btn_danger" onClick={() => handleDelete(item.id)} disabled={deleting === item.id} style={{ position: "relative" }}>
                    {deleting === item.id ? <span className="btn_loader" style={{ width: 12, height: 12, borderColor: "#ef4444", borderTopColor: "transparent" }} /> : <MdDelete size={13} />}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Rental form drawer */}
      <Drawer isOpen={open} onClose={() => setOpen(false)} title={editing ? "Edit Rental Setting" : "New Rental Setting"} description="Define concept rental pricing per country" width={520}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="admin_form_grid">
            <div className="form-field"><label className="modal-label">Country *</label><input className="modal-input" placeholder="e.g. Nigeria" value={form.country} onChange={set("country")} /></div>
            <div className="form-field"><label className="modal-label">Currency *</label><input className="modal-input" placeholder="e.g. NGN" value={form.currency} onChange={set("currency")} /></div>
          </div>
          <div className="form-field">
            <label className="modal-label">Terms</label>
            <textarea className="modal-input" rows={2} style={{ resize: "none" }} placeholder="Optional terms…" value={form.terms} onChange={set("terms")} />
          </div>

          {/* Payments array */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label className="modal-label" style={{ margin: 0 }}>Payments * <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(min 1)</span></label>
              <button type="button" onClick={addPayment} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "var(--accent)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                <LuPlus size={13} /> Add Payment
              </button>
            </div>
            {form.payments.map((p, i) => (
              <div key={i} className="admin_payment_item">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Payment {i + 1}</span>
                  {form.payments.length > 1 && (
                    <button className="biz_icon_btn biz_icon_btn_danger" onClick={() => removePayment(i)} style={{ width: 22, height: 22 }}><LuTrash2 size={11} /></button>
                  )}
                </div>
                <div className="admin_form_grid" style={{ marginBottom: 8 }}>
                  <div className="form-field" style={{ marginBottom: 0 }}><label className="modal-label">Title *</label><input className="modal-input" placeholder="e.g. Base Fare" value={p.title} onChange={(e) => updatePayment(i, "title", e.target.value)} /></div>
                  <div className="form-field" style={{ marginBottom: 0 }}><label className="modal-label">Amount *</label><input className="modal-input" type="number" min="0" placeholder="e.g. 2000" value={p.amount} onChange={(e) => updatePayment(i, "amount", e.target.value)} /></div>
                </div>
                <div className="form-field" style={{ marginBottom: 8 }}><label className="modal-label">Description</label><input className="modal-input" placeholder="Brief description…" value={p.description} onChange={(e) => updatePayment(i, "description", e.target.value)} /></div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[{ k: "refundable", l: "Refundable" }, { k: "recurring", l: "Recurring" }].map(({ k, l }) => (
                    <button key={k} type="button" onClick={() => updatePayment(i, k, !p[k])}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 8, border: `1px solid ${p[k] ? "rgba(34,197,94,0.35)" : "var(--border)"}`, background: p[k] ? "rgba(34,197,94,0.08)" : "var(--bg-hover)", color: p[k] ? "#16a34a" : "var(--text-muted)", fontSize: "0.73rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: p[k] ? "#16a34a" : "var(--border)" }} />{l}
                    </button>
                  ))}
                  {p.recurring && (
                    <div className="form-field" style={{ marginBottom: 0, marginTop: 8, width: "100%" }}>
                      <label className="modal-label">Interval (days)</label>
                      <input className="modal-input" type="number" min="1" placeholder="e.g. 30" value={p.intervalInDays} onChange={(e) => updatePayment(i, "intervalInDays", e.target.value)} />
                    </div>
                  )}
                </div>
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

/* ══════════════════════════════════════════════════════════════
   CONTRACT SETTINGS PANEL
═══════════════════════════════════════════════════════════════ */
const DURATION_PRESETS = [
  { label: "1 Month", days: 30 }, { label: "3 Months", days: 90 },
  { label: "6 Months", days: 180 }, { label: "1 Year", days: 365 }, { label: "Custom", days: null },
];
const EMPTY_CS_PAYMENT = { title: "", description: "", amount: "", refundable: false, recurring: false, intervalInDays: "" };
const EMPTY_CS = { durationDays: "", country: "", currency: "", type: "LEASE", terms: "", length: "", breadth: "", unit: "m", payments: [{ ...EMPTY_CS_PAYMENT }] };

function ContractSettingsPanel() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY_CS);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [durationPreset, setDurationPreset] = useState(null);

  const fetch = async () => {
    try { const r = await api.get("/contract/settings"); setItems(r.data.data || []); }
    catch { toast.error("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm(EMPTY_CS); setEditing(null); setDurationPreset(null); setOpen(true); };
  const openEdit   = (i)  => {
    setForm({ ...i, length: i.kioskSize?.length || "", breadth: i.kioskSize?.breadth || "", unit: i.kioskSize?.unit || "m", payments: i.payments || [{ ...EMPTY_CS_PAYMENT }] });
    setEditing(i); setDurationPreset(null); setOpen(true);
  };
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const updatePayment = (i, k, v) => setForm((p) => { const ps = [...p.payments]; ps[i] = { ...ps[i], [k]: v }; return { ...p, payments: ps }; });
  const addPayment    = ()        => setForm((p) => ({ ...p, payments: [...p.payments, { ...EMPTY_CS_PAYMENT }] }));
  const removePayment = (i)       => setForm((p) => ({ ...p, payments: p.payments.filter((_, idx) => idx !== i) }));

  const selectPreset = (preset) => {
    setDurationPreset(preset.label);
    if (preset.days) setForm((p) => ({ ...p, durationDays: preset.days.toString() }));
  };

  const handleSave = async () => {
    if (!form.country || !form.currency || !form.durationDays || !form.length || !form.breadth) return toast.error("Fill all required fields");
    if (!form.payments.length || form.payments.some((p) => !p.title || !p.amount)) return toast.error("Each payment needs title and amount");
    setSaving(true);
    try {
      const body = {
        ...(editing?.id && { id: editing.id }),
        durationDays: Number(form.durationDays), country: form.country.trim(), currency: form.currency.trim(),
        type: form.type, length: Number(form.length), breadth: Number(form.breadth), unit: form.unit,
        ...(form.terms && { terms: form.terms }),
        payments: form.payments.map((p) => ({
          title: p.title, description: p.description || "", amount: Number(p.amount),
          refundable: Boolean(p.refundable), recurring: Boolean(p.recurring),
          ...(p.recurring && p.intervalInDays && { intervalInDays: Number(p.intervalInDays) }),
        })),
      };
      await api.post("/contract/settings", body);
      toast.success(editing ? "Updated" : "Created");
      setOpen(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete?")) return;
    setDeleting(id);
    try { await api.delete(`/contract/settings/${id}`); toast.success("Deleted"); fetch(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setDeleting(null); }
  };

  return (
    <>
      <div className="admin_settings_panel" style={{ gridColumn: "1 / -1" }}>
        <div className="admin_settings_panel_header">
          <span className="admin_settings_panel_title">Contract Settings</span>
          <button className="app_btn app_btn_confirm biz_add_btn" onClick={openCreate}><LuPlus size={13} /> Add</button>
        </div>
        <div className="admin_settings_panel_body">
          {loading ? <div className="page_loader" style={{ padding: 24 }}><div className="page_loader_spinner" /></div>
            : items.length === 0 ? <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem" }}>No contract settings yet.</div>
            : items.map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-heading)" }}>{item.type} — {item.country}</span>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <span className="admin_meta_chip">{item.currency}</span>
                    {item.durationDays && <span className="admin_meta_chip">{item.durationDays} days</span>}
                    {item.kioskSize && <span className="admin_meta_chip">{item.kioskSize.length}×{item.kioskSize.breadth}{item.kioskSize.unit}</span>}
                    <span className="admin_meta_chip">{item.payments?.length || 0} payment{item.payments?.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="biz_icon_btn" onClick={() => openEdit(item)}><MdEdit size={13} /></button>
                  <button className="biz_icon_btn biz_icon_btn_danger" onClick={() => handleDelete(item.id)} disabled={deleting === item.id} style={{ position: "relative" }}>
                    {deleting === item.id ? <span className="btn_loader" style={{ width: 12, height: 12, borderColor: "#ef4444", borderTopColor: "transparent" }} /> : <MdDelete size={13} />}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Contract form drawer */}
      <Drawer isOpen={open} onClose={() => setOpen(false)} title={editing ? "Edit Contract Setting" : "New Contract Setting"} description="Define lease or purchase plans for iCart contracts" width={540}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="admin_form_grid">
            <div className="form-field"><label className="modal-label">Country *</label><input className="modal-input" placeholder="e.g. Nigeria" value={form.country} onChange={set("country")} /></div>
            <div className="form-field"><label className="modal-label">Currency *</label><input className="modal-input" placeholder="e.g. NGN" value={form.currency} onChange={set("currency")} /></div>
            <div className="form-field">
              <label className="modal-label">Type *</label>
              <select className="modal-input" value={form.type} onChange={set("type")}>
                <option value="LEASE">LEASE</option>
                <option value="PURCHASE">PURCHASE</option>
              </select>
            </div>
            <div className="form-field"><label className="modal-label">Duration (days) *</label>
              <input className="modal-input" type="number" min="0" placeholder="e.g. 365" value={form.durationDays} onChange={set("durationDays")} />
            </div>
          </div>

          {/* Duration presets */}
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

          {/* Kiosk size */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: 12 }}>
            <div className="form-field" style={{ marginBottom: 0 }}><label className="modal-label">Length *</label><input className="modal-input" type="number" min="0" placeholder="2" value={form.length} onChange={set("length")} /></div>
            <div className="form-field" style={{ marginBottom: 0 }}><label className="modal-label">Breadth *</label><input className="modal-input" type="number" min="0" placeholder="1.5" value={form.breadth} onChange={set("breadth")} /></div>
            <div className="form-field" style={{ marginBottom: 0 }}><label className="modal-label">Unit *</label>
              <select className="modal-input" value={form.unit} onChange={set("unit")}><option value="m">m</option><option value="cm">cm</option></select>
            </div>
          </div>

          <div className="form-field"><label className="modal-label">Terms</label><textarea className="modal-input" rows={2} style={{ resize: "none" }} placeholder="Optional terms…" value={form.terms} onChange={set("terms")} /></div>

          {/* Payments */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label className="modal-label" style={{ margin: 0 }}>Payments * <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(min 1)</span></label>
              <button type="button" onClick={addPayment} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "var(--accent)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                <LuPlus size={13} /> Add Payment
              </button>
            </div>
            {form.payments.map((p, i) => (
              <div key={i} className="admin_payment_item">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Payment {i + 1}</span>
                  {form.payments.length > 1 && <button className="biz_icon_btn biz_icon_btn_danger" onClick={() => removePayment(i)} style={{ width: 22, height: 22 }}><LuTrash2 size={11} /></button>}
                </div>
                <div className="admin_form_grid" style={{ marginBottom: 8 }}>
                  <div className="form-field" style={{ marginBottom: 0 }}><label className="modal-label">Title *</label><input className="modal-input" placeholder="e.g. Security Deposit" value={p.title} onChange={(e) => updatePayment(i, "title", e.target.value)} /></div>
                  <div className="form-field" style={{ marginBottom: 0 }}><label className="modal-label">Amount *</label><input className="modal-input" type="number" min="0" placeholder="e.g. 100000" value={p.amount} onChange={(e) => updatePayment(i, "amount", e.target.value)} /></div>
                </div>
                <div className="form-field" style={{ marginBottom: 8 }}><label className="modal-label">Description</label><input className="modal-input" placeholder="Brief description…" value={p.description} onChange={(e) => updatePayment(i, "description", e.target.value)} /></div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "flex-start" }}>
                  {[{ k: "refundable", l: "Refundable" }, { k: "recurring", l: "Recurring" }].map(({ k, l }) => (
                    <button key={k} type="button" onClick={() => updatePayment(i, k, !p[k])}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 11px", borderRadius: 8, border: `1px solid ${p[k] ? "rgba(34,197,94,0.35)" : "var(--border)"}`, background: p[k] ? "rgba(34,197,94,0.08)" : "var(--bg-hover)", color: p[k] ? "#16a34a" : "var(--text-muted)", fontSize: "0.73rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: p[k] ? "#16a34a" : "var(--border)" }} />{l}
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

/* ══════════════════════════════════════════════════════════════
   ENTITY DRAWER (generic list + approve)
═══════════════════════════════════════════════════════════════ */
function EntityDrawer({ open, onClose, title, description, items, loading, onApprove, approving, renderRow, emptyText }) {
  return (
    <Drawer isOpen={open} onClose={onClose} title={title} description={description} width={520}>
      {loading ? (
        <div className="page_loader"><div className="page_loader_spinner" /></div>
      ) : items.length === 0 ? (
        <div className="admin_empty"><p style={{ margin: 0, fontSize: "0.82rem" }}>{emptyText || "Nothing here yet."}</p></div>
      ) : (
        <div className="admin_drawer_list">{items.map((item) => renderRow(item))}</div>
      )}
    </Drawer>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

  // Stats
  const [stats, setStats] = useState({ users: 0, vendors: 0, operators: 0, icarts: 0, suppliers: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Applications
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading]   = useState(true);
  const [approving, setApproving]       = useState(null);

  // Entity drawers
  const [drawer, setDrawer]         = useState(null); // "users"|"vendors"|"operators"|"suppliers"|"icarts"|"locations"
  const [drawerItems, setDrawerItems] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [entityApproving, setEntityApproving] = useState(null);

  // Location form
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationForm, setLocationForm] = useState({ name: "", country: "", code: "", currency: "" });
  const [savingLocation, setSavingLocation] = useState(false);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const [usersR, vendorsR, operatorsR, icartsR, suppliersR] = await Promise.allSettled([
        api.get("/users"),
        api.get("/vendor/profile"),
        api.get("/icart/operator/hirable"),
        api.get("/icart"),
        api.get("/supplier"),
      ]);
      const count = (r) => {
        if (r.status !== "fulfilled") return 0;
        const d = r.value.data.data;
        if (!d) return 0;
        if (typeof d.total === "number") return d.total;
        // named array key
        const k = ["vendors","operators","suppliers","users","icarts","states"].find((k) => Array.isArray(d[k]));
        if (k) return d[k].length;
        if (Array.isArray(d)) return d.length;
        return d.items?.length || 0;
      };
      setStats({ users: count(usersR), vendors: count(vendorsR), operators: count(operatorsR), icarts: count(icartsR), suppliers: count(suppliersR) });
    } catch { /* silent */ }
    finally { setStatsLoading(false); }
  };

  const fetchApplications = async () => {
    setAppsLoading(true);
    try {
      const r = await api.get("/contract/application/all");
      const d = r.data.data;
      setApplications(Array.isArray(d) ? d : d?.items || []);
    } catch { toast.error("Failed to load applications"); }
    finally { setAppsLoading(false); }
  };

  useEffect(() => { fetchStats(); fetchApplications(); }, []);

  const handleApproveApp = async (id) => {
    setApproving(id);
    try { await api.post(`/contract/application/${id}/approve`); toast.success("Approved"); fetchApplications(); fetchStats(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setApproving(null); }
  };

  const DRAWER_CONFIG = {
    users:     { url: "/users",                title: "All Users",      description: "Every registered user across all roles" },
    vendors:   { url: "/vendor/profile",      title: "Vendors",        description: "Food & brand vendors on the platform" },
    operators: { url: "/icart/operator",      title: "Operators",      description: "All iCart operators" },
    suppliers: { url: "/supplier",            title: "Suppliers",      description: "All inventory suppliers" },
    icarts:    { url: "/icart",               title: "iCart Fleet",    description: "Every iCart in the fleet" },
    locations: { url: "/config/state",        title: "Locations",      description: "States and regions" },
  };

  const openDrawer = async (key) => {
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
        const namedKey = ["vendors","operators","suppliers","users","icarts","states","data"].find((k) => Array.isArray(d?.[k]));
        if (namedKey) return d[namedKey];
        return d?.items || [];
      };
      setDrawerItems(extract(d));
    } catch { toast.error("Failed to load"); }
    finally { setDrawerLoading(false); }
  };

  const handleEntityApprove = async (id) => {
    const endpoints = {
      vendors:   `/vendor/${id}/approve`,
      operators: `/icart/operator/${id}/approve`,
      suppliers: `/supplier/${id}/approve`,
    };
    const url = endpoints[drawer];
    if (!url) return;
    setEntityApproving(id);
    try { await api.patch(url); toast.success("Approved"); openDrawer(drawer); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setEntityApproving(null); }
  };

  const handleSaveLocation = async () => {
    if (!locationForm.name.trim()) return toast.error("Name is required");
    setSavingLocation(true);
    try {
      await api.post("/config/state", { name: locationForm.name.trim(), ...(locationForm.country && { country: locationForm.country.trim() }), ...(locationForm.code && { code: locationForm.code.trim() }), ...(locationForm.currency && { currency: locationForm.currency.trim() }) });
      toast.success("State created");
      setShowLocationForm(false);
      setLocationForm({ name: "", country: "", code: "", currency: "" });
      if (drawer === "locations") openDrawer("locations");
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSavingLocation(false); }
  };

  const pending = {
    vendors:   drawerItems.filter((v) => !v.isApproved).length,
    operators: drawerItems.filter((o) => !o.isApproved).length,
    suppliers: drawerItems.filter((s) => !s.isApproved).length,
  };

  const appsPending = applications.filter((a) => a.status === "SUBMITTED").length;

  const STAT_CARDS = [
    { key: "users",     label: "Users",     icon: MdOutlinePeople,        color: "#3b82f6" },
    { key: "vendors",   label: "Vendors",   icon: MdOutlineStore,         color: "var(--accent)" },
    { key: "operators", label: "Operators", icon: MdOutlineBadge,         color: "#f59e0b" },
    { key: "icarts",    label: "iCarts",    icon: MdOutlineShoppingCart,  color: "#16a34a" },
    { key: "suppliers", label: "Suppliers", icon: MdOutlineLocalShipping, color: "#8b5cf6" },
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
      if (item.email) return item.email;
      if (item.user?.email) {
        const extra = item.state?.name ? ` · ${item.state.name}` : item.cartId ? " · Assigned" : " · Unassigned";
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

    const canApprove = ["vendors", "operators", "suppliers"].includes(drawer) && !approved;

    const statusLabel =
      item.membershipStatus ||
      (item.isApproved != null ? (item.isApproved ? "APPROVED" : "PENDING") : null) ||
      item.status || null;

    const statusStyle = approved
      ? { background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.25)" }
      : { background: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "1px solid rgba(234,179,8,0.25)" };

    return (
      <div key={item.id} className="admin_drawer_row">
        <div className="admin_drawer_avatar">{initials}</div>
        <div className="admin_drawer_info">
          <div className="admin_drawer_name">{name}</div>
          {sub && <div className="admin_drawer_sub">{sub}</div>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {statusLabel && (
            <span className="admin_status_badge" style={statusStyle}>
              <MdCircle size={5} />{statusLabel}
            </span>
          )}
          {canApprove && (
            <button
              className={`app_btn app_btn_confirm${entityApproving === item.id ? " btn_loading" : ""}`}
              style={{ height: 28, padding: "0 10px", fontSize: "0.72rem", position: "relative" }}
              onClick={() => handleEntityApprove(item.id)}
              disabled={!!entityApproving}
            >
              <span className="btn_text"><MdCheck size={12} /> Approve</span>
              {entityApproving === item.id && <span className="btn_loader" style={{ width: 11, height: 11 }} />}
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
          <p className="admin_page_sub">Platform overview, approvals, and configuration</p>
        </div>
        <button className="admin_back_link" onClick={() => navigate("/app")}>
          ← Back to App
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="admin_stats_grid">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="admin_stat_card" onClick={() => openDrawer(key)}>
            <div className="admin_stat_icon" style={{ color }}><Icon size={18} /></div>
            <div>
              <div className="admin_stat_value">{statsLoading ? "—" : (stats[key] || 0).toLocaleString()}</div>
              <div className="admin_stat_label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pending Approvals ── */}
      <div className="admin_section">
        <div className="admin_section_header">
          <span className="admin_section_title">Pending Approvals</span>
          {appsPending > 0 && <span className="admin_section_count" style={{ background: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "1px solid rgba(234,179,8,0.25)" }}>{appsPending} contracts</span>}
        </div>
        <div className="admin_approval_row">
          {[
            { key: "vendors",      label: "Vendors",    icon: MdOutlineStore,         color: "var(--accent)" },
            { key: "operators",    label: "Operators",  icon: MdOutlineBadge,         color: "#f59e0b" },
            { key: "suppliers",    label: "Suppliers",  icon: MdOutlineLocalShipping, color: "#8b5cf6" },
            { key: "applications", label: "Contracts",  icon: MdOutlineFactCheck,     color: "#3b82f6" },
            { key: "locations",    label: "Locations",  icon: MdOutlineLocationOn,    color: "#16a34a" },
          ].map(({ key, label, icon: Icon, color }) => (
            <button key={key} className="admin_approval_chip" onClick={() => key === "applications" ? document.getElementById("admin_apps_section")?.scrollIntoView({ behavior: "smooth" }) : openDrawer(key)}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}18`, color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} />
              </div>
              <span className="admin_approval_chip_label">{label}</span>
              <MdArrowForward size={14} style={{ color: "var(--text-muted)", marginLeft: "auto" }} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Contract Applications ── */}
      <div className="admin_section" id="admin_apps_section">
        <div className="admin_section_header">
          <span className="admin_section_title">Contract Applications</span>
          <span className="admin_section_count">{applications.length}</span>
          {appsPending > 0 && <span className="admin_section_count" style={{ background: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "1px solid rgba(234,179,8,0.25)" }}>{appsPending} pending</span>}
        </div>
        {appsLoading ? (
          <div className="page_loader"><div className="page_loader_spinner" /></div>
        ) : applications.length === 0 ? (
          <div className="admin_empty"><p style={{ margin: 0, fontSize: "0.82rem" }}>No applications yet.</p></div>
        ) : (
          <div className="admin_card_list">
            {applications.slice(0, 8).map((app) => {
              const s = getS(app.status);
              const user = app.user || app.owner;
              return (
                <div key={app.id} className="admin_card">
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: s.bg, border: `1px solid ${s.border}`, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MdOutlineFactCheck size={16} />
                  </div>
                  <div className="admin_card_body">
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-heading)", fontFamily: "monospace" }}>#{app.id.slice(0, 8).toUpperCase()}</span>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="admin_card_meta">
                      {user?.name && <span className="admin_meta_chip">{user.name}</span>}
                      {user?.email && <span className="admin_meta_chip">{user.email}</span>}
                      {app.type && <span className="admin_meta_chip">{app.type}</span>}
                      {app.numberOfCarts && <span className="admin_meta_chip">{app.numberOfCarts} iCart{app.numberOfCarts !== 1 ? "s" : ""}</span>}
                      <span className="admin_meta_chip">{fmtDate(app.createdAt)}</span>
                    </div>
                  </div>
                  {app.status === "SUBMITTED" && (
                    <button className={`app_btn app_btn_confirm${approving === app.id ? " btn_loading" : ""}`} style={{ height: 34, padding: "0 14px", fontSize: "0.75rem", position: "relative", display: "inline-flex", alignItems: "center", gap: 5, flexShrink: 0 }} onClick={() => handleApproveApp(app.id)} disabled={!!approving}>
                      <span className="btn_text"><MdCheck size={13} /> Approve</span>
                      {approving === app.id && <span className="btn_loader" style={{ width: 12, height: 12 }} />}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Settings quick panels ── */}
      <div className="admin_section">
        <div className="admin_section_header">
          <span className="admin_section_title">Platform Settings</span>
        </div>
        <div className="admin_two_col" style={{ marginBottom: 16 }}>
          <SalesFormulaPanel />
          <RentalPanel />
        </div>
        <ContractSettingsPanel />
      </div>

      {/* ── Entity drawer ── */}
      <Drawer
        isOpen={!!drawer}
        onClose={() => { setDrawer(null); setShowLocationForm(false); }}
        title={cfg.title || ""}
        description={cfg.description || ""}
        width={500}
      >
        {/* Location create form */}
        {drawer === "locations" && (
          <div style={{ marginBottom: 16 }}>
            {showLocationForm ? (
              <div className="admin_form_card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-heading)" }}>New State</span>
                  <button className="biz_icon_btn" onClick={() => setShowLocationForm(false)}><MdClose size={13} /></button>
                </div>
                <div className="admin_form_grid" style={{ marginBottom: 10 }}>
                  <div className="form-field" style={{ marginBottom: 0 }}><label className="modal-label">Name *</label><input className="modal-input" placeholder="e.g. Lagos" value={locationForm.name} onChange={(e) => setLocationForm((p) => ({ ...p, name: e.target.value }))} /></div>
                  <div className="form-field" style={{ marginBottom: 0 }}><label className="modal-label">Country</label><input className="modal-input" placeholder="e.g. Nigeria" value={locationForm.country} onChange={(e) => setLocationForm((p) => ({ ...p, country: e.target.value }))} /></div>
                  <div className="form-field" style={{ marginBottom: 0 }}><label className="modal-label">Code</label><input className="modal-input" placeholder="e.g. LAG" value={locationForm.code} onChange={(e) => setLocationForm((p) => ({ ...p, code: e.target.value }))} /></div>
                  <div className="form-field" style={{ marginBottom: 0 }}><label className="modal-label">Currency</label><input className="modal-input" placeholder="e.g. NGN" value={locationForm.currency} onChange={(e) => setLocationForm((p) => ({ ...p, currency: e.target.value }))} /></div>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button className="app_btn app_btn_cancel" style={{ height: 34 }} onClick={() => setShowLocationForm(false)}>Cancel</button>
                  <button className={`app_btn app_btn_confirm${savingLocation ? " btn_loading" : ""}`} style={{ height: 34, minWidth: 80, position: "relative" }} onClick={handleSaveLocation} disabled={savingLocation}>
                    <span className="btn_text">Create</span>
                    {savingLocation && <span className="btn_loader" style={{ width: 12, height: 12 }} />}
                  </button>
                </div>
              </div>
            ) : (
              <button className="app_btn app_btn_confirm biz_add_btn" style={{ marginBottom: 12 }} onClick={() => setShowLocationForm(true)}>
                <LuPlus size={13} /> New State
              </button>
            )}
          </div>
        )}

        {drawerLoading ? (
          <div className="page_loader"><div className="page_loader_spinner" /></div>
        ) : drawerItems.length === 0 ? (
          <div className="admin_empty"><p style={{ margin: 0, fontSize: "0.82rem" }}>Nothing here yet.</p></div>
        ) : (
          <div className="admin_drawer_list">{drawerItems.map((item) => renderEntityRow(item))}</div>
        )}
      </Drawer>
    </div>
  );
}