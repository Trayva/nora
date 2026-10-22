import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LuPlus, LuTrash2, LuStore, LuCloud, LuMapPin } from "react-icons/lu";
import api from "../../../api/axios";
import { updateBusiness } from "../../../api/vendor";

const EMPTY_PAYMENT = {
  title: "",
  description: "",
  amount: "",
  refundable: false,
  recurring: false,
  intervalInDays: 30,
};

export default function SettingsTab({ vendor, onUpdate }) {
  const [form, setForm] = useState({
    slotRadius: 30,
    maxSlots: 0,
    isPublic: true,
  });
  const [outletSupport, setOutletSupport] = useState(["KIOSK"]);
  const [supportedStates, setSupportedStates] = useState([]);
  const [availableStates, setAvailableStates] = useState([]);
  const [loadingStates, setLoadingStates] = useState(true);
  const [payments, setPayments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get("/config/state")
      .then((res) => setAvailableStates(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingStates(false));
  }, []);

  useEffect(() => {
    if (vendor) {
      setForm({
        slotRadius: vendor.slotRadius ?? 30,
        maxSlots: vendor.maxSlots ?? 0,
        isPublic: vendor.isPublic ?? true,
      });
      setOutletSupport(vendor.outletSupport && vendor.outletSupport.length > 0 ? vendor.outletSupport : ["KIOSK"]);
      setSupportedStates(Array.isArray(vendor.supportedStates) ? vendor.supportedStates : []);
      setPayments(vendor.franchisePayments || []);
    }
  }, [vendor]);

  const toggleOutletSupport = (type) => {
    setOutletSupport((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) {
          toast.warning("At least one outlet type must be supported.");
          return prev;
        }
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const toggleSupportedState = (stateId) => {
    setSupportedStates((prev) =>
      prev.includes(stateId) ? prev.filter((id) => id !== stateId) : [...prev, stateId]
    );
  };

  const selectAllStates = () => {
    setSupportedStates(availableStates.map((s) => s.id));
  };

  const clearAllStates = () => {
    setSupportedStates([]);
  };

  const addPayment = () => {
    setPayments((prev) => [...prev, { ...EMPTY_PAYMENT }]);
  };

  const removePayment = (index) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePayment = (index, key, val) => {
    setPayments((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [key]: val } : p))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Validate payments
      for (const p of payments) {
        if (!p.title?.trim()) {
          toast.error("All franchise payments must have a title.");
          setSubmitting(false);
          return;
        }
        if (p.amount === "" || parseFloat(p.amount) < 0) {
          toast.error("All franchise payments must have a valid amount.");
          setSubmitting(false);
          return;
        }
      }

      const fd = new FormData();
      // Required by backend schema validation
      fd.append("businessName", vendor.businessName);

      fd.append("slotRadius", String(form.slotRadius));
      fd.append("maxSlots", String(form.maxSlots));
      fd.append("isPublic", String(form.isPublic));
      fd.append("outletSupport", JSON.stringify(outletSupport));
      fd.append("supportedStates", JSON.stringify(supportedStates));
      fd.append("franchisePayments", JSON.stringify(payments.map(p => ({
        ...p,
        amount: parseFloat(p.amount),
        intervalInDays: p.intervalInDays ? parseInt(p.intervalInDays) : 30
      }))));

      await updateBusiness(fd);
      toast.success("Settings updated successfully!");
      onUpdate?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 680, padding: "20px 24px" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Slot Configuration */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-heading)", margin: "0 0 16px" }}>
            Deployment Configuration
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Slot Radius (km)</label>
              <input
                className="modal-input"
                type="number"
                min="1"
                value={form.slotRadius}
                onChange={(e) => setForm((prev) => ({ ...prev, slotRadius: parseFloat(e.target.value) || 0 }))}
              />
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                Range in km where kiosks will conflict
              </span>
            </div>
            <div className="form-field" style={{ marginBottom: 0 }}>
              <label className="modal-label">Max Slots</label>
              <input
                className="modal-input"
                type="number"
                min="0"
                value={form.maxSlots}
                onChange={(e) => setForm((prev) => ({ ...prev, maxSlots: parseInt(e.target.value) || 0 }))}
              />
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                Max active kiosks allowed per radius (0 for unlimited)
              </span>
            </div>
          </div>
        </div>

        {/* Brand Visibility */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-heading)", margin: "0 0 8px" }}>
            Brand Visibility
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 16px" }}>
            Set if your brand concept profile is listed publicly for franchise rentals or remains private.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              className={`app_btn ${form.isPublic ? "app_btn_confirm" : "app_btn_cancel"}`}
              style={{ flex: 1, height: 40, border: "1px solid var(--border)" }}
              onClick={() => setForm((prev) => ({ ...prev, isPublic: true }))}
            >
              Public
            </button>
            <button
              type="button"
              className={`app_btn ${!form.isPublic ? "app_btn_confirm" : "app_btn_cancel"}`}
              style={{ flex: 1, height: 40, border: "1px solid var(--border)" }}
              onClick={() => setForm((prev) => ({ ...prev, isPublic: false }))}
            >
              Private (Hidden)
            </button>
          </div>
        </div>

        {/* Supported Outlet Types */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-heading)", margin: "0 0 8px" }}>
            Supported Outlet Types
          </h3>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 16px" }}>
            Select the types of physical and virtual outlets your brand operates or supports for franchise.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {[
              { id: "KIOSK", label: "Physical Kiosk", desc: "Modular food cart / stand", icon: LuStore },
              { id: "CLOUD_KITCHEN", label: "Cloud Kitchen", desc: "Ghost / delivery-only kitchen", icon: LuCloud },
            ].map((type) => {
              const isSelected = outletSupport.includes(type.id);
              const Icon = type.icon;
              return (
                <div
                  key={type.id}
                  onClick={() => toggleOutletSupport(type.id)}
                  style={{
                    background: isSelected ? "rgba(203,108,220,0.08)" : "var(--bg-hover)",
                    border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: 12,
                    padding: "14px 16px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: isSelected ? "rgba(203,108,220,0.15)" : "var(--bg-card)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: isSelected ? "var(--accent)" : "var(--text-muted)",
                      }}
                    >
                      <Icon size={18} />
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => { }} // handled by div onClick
                      style={{ cursor: "pointer", accentColor: "var(--accent)" }}
                    />
                  </div>
                  <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--text-heading)", marginTop: 6 }}>
                    {type.label}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                    {type.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Supported States / Operating Regions */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-heading)", margin: "0 0 4px" }}>
                Supported States / Operating Regions
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                Specify which states your brand allows franchise outlets to be deployed in.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={selectAllStates}
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--bg-hover)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                }}
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAllStates}
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  padding: "4px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--bg-hover)",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                Clear All
              </button>
            </div>
          </div>

          {supportedStates.length === 0 && (
            <div style={{
              padding: "8px 12px",
              borderRadius: 8,
              background: "rgba(234,179,8,0.08)",
              border: "1px solid rgba(234,179,8,0.25)",
              color: "#eab308",
              fontSize: "0.75rem",
              marginBottom: 12,
            }}>
              No states currently selected. Select at least one state to allow franchisees to select your brand in their location.
            </div>
          )}

          {loadingStates ? (
            <div style={{ padding: "16px 0", textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Loading states...
            </div>
          ) : availableStates.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              No states configured in system.
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(135px, 1fr))",
              gap: 8,
              maxHeight: 220,
              overflowY: "auto",
              paddingRight: 4,
            }}>
              {availableStates.map((st) => {
                const isChecked = supportedStates.includes(st.id);
                return (
                  <label
                    key={st.id}
                    onClick={() => toggleSupportedState(st.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 10px",
                      borderRadius: 8,
                      background: isChecked ? "rgba(203,108,220,0.08)" : "var(--bg-hover)",
                      border: `1px solid ${isChecked ? "var(--accent)" : "var(--border)"}`,
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      style={{ accentColor: "var(--accent)", cursor: "pointer", margin: 0 }}
                    />
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{
                        fontSize: "0.78rem",
                        fontWeight: isChecked ? 700 : 500,
                        color: isChecked ? "var(--text-heading)" : "var(--text-primary)",
                      }}>
                        {st.name}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Franchise Payments */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-heading)", margin: 0 }}>
              Custom Franchise Payments
            </h3>
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
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
                padding: 0,
              }}
            >
              <LuPlus size={14} /> Add Payment
            </button>
          </div>

          {payments.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", border: "1px dashed var(--border)", borderRadius: 12 }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                No custom payments configured. Global franchise fees will apply.
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {payments.map((p, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--bg-hover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-muted)" }}>
                      PAYMENT ITEM #{i + 1}
                    </span>
                    <button
                      type="button"
                      className="biz_icon_btn biz_icon_btn_danger"
                      onClick={() => removePayment(i)}
                      style={{ width: 26, height: 26, borderRadius: 6 }}
                    >
                      <LuTrash2 size={12} />
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="modal-label">Title *</label>
                      <input
                        className="modal-input"
                        placeholder="e.g. Technology Fee"
                        value={p.title}
                        onChange={(e) => updatePayment(i, "title", e.target.value)}
                      />
                    </div>
                    <div className="form-field" style={{ marginBottom: 0 }}>
                      <label className="modal-label">Amount *</label>
                      <input
                        className="modal-input"
                        type="number"
                        min="0"
                        placeholder="e.g. 50000"
                        value={p.amount}
                        onChange={(e) => updatePayment(i, "amount", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-field" style={{ marginBottom: 12 }}>
                    <label className="modal-label">Description</label>
                    <input
                      className="modal-input"
                      placeholder="Brief details about the charge…"
                      value={p.description}
                      onChange={(e) => updatePayment(i, "description", e.target.value)}
                    />
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    {[
                      { key: "refundable", label: "Refundable" },
                      { key: "recurring", label: "Recurring" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => updatePayment(i, key, !p[key])}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "5px 12px",
                          borderRadius: 8,
                          border: `1px solid ${p[key] ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                          background: p[key] ? "rgba(34,197,94,0.08)" : "var(--bg-hover)",
                          color: p[key] ? "#16a34a" : "var(--text-body)",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: p[key] ? "#16a34a" : "var(--border)",
                          }}
                        />
                        {label}
                      </button>
                    ))}

                    {p.recurring && (
                      <div className="form-field" style={{ marginBottom: 0, flex: "1 0 120px" }}>
                        <input
                          className="modal-input"
                          type="number"
                          min="1"
                          placeholder="e.g. 30 (days)"
                          value={p.intervalInDays}
                          onChange={(e) => updatePayment(i, "intervalInDays", e.target.value)}
                          style={{ height: 28, fontSize: "0.75rem", padding: "0 8px" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={`app_btn app_btn_confirm ${submitting ? "btn_loading" : ""}`}
          style={{ width: "100%", height: 46, fontSize: "0.9rem", fontWeight: 700, position: "relative" }}
          disabled={submitting}
        >
          <span className="btn_text">Save Settings</span>
          {submitting && <span className="btn_loader" style={{ width: 18, height: 18 }} />}
        </button>
      </form>
    </div>
  );
}
