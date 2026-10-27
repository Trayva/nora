import { MdAdd, MdClose } from "react-icons/md";

const inputStyle = {
  height: 34,
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--bg-hover)",
  color: "var(--text-heading)",
  padding: "0 10px",
  fontSize: "0.78rem",
  fontWeight: 700,
  outline: "none",
  minWidth: 0,
};

const cardStyle = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: "14px 16px",
};

const titleStyle = {
  fontSize: "0.74rem",
  fontWeight: 800,
  color: "var(--text-heading)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: 28,
        padding: "0 10px",
        borderRadius: 6,
        border: "1px solid var(--border)",
        background: "var(--bg-hover)",
        color: "var(--accent)",
        fontSize: "0.72rem",
        fontWeight: 800,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <MdAdd size={14} /> {children}
    </button>
  );
}

function RemoveButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove"
      style={{
        height: 34,
        width: 34,
        flexShrink: 0,
        borderRadius: 6,
        border: "1px solid rgba(239,68,68,0.2)",
        background: "rgba(239,68,68,0.08)",
        color: "#ef4444",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MdClose size={16} />
    </button>
  );
}

// Extra costs applied on top of ingredient cost (flat or % of cost; added to cost or to price)
export function ExtraCostsSection({ items, onChange }) {
  const update = (id, patch) => onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={titleStyle}>Extra Costs</span>
        <AddButton onClick={() => onChange([...items, { id: Date.now(), title: "", amount: "", type: "fixed", target: "cost" }])}>
          Add Cost
        </AddButton>
      </div>
      {items.length === 0 ? (
        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center" }}>No extra costs added.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((ac) => (
            <div key={ac.id} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <input
                placeholder="Title (e.g. Labor)"
                value={ac.title}
                onChange={(e) => update(ac.id, { title: e.target.value })}
                style={{ ...inputStyle, flex: "1 1 120px" }}
              />
              <select value={ac.type} onChange={(e) => update(ac.id, { type: e.target.value })} style={{ ...inputStyle, width: 82, padding: "0 4px" }}>
                <option value="fixed">Flat</option>
                <option value="percentage">Percent</option>
              </select>
              <input
                type="number"
                placeholder={ac.type === "percentage" ? "%" : "Amount"}
                value={ac.amount}
                onChange={(e) => update(ac.id, { amount: e.target.value })}
                style={{ ...inputStyle, width: 80 }}
              />
              <select value={ac.target} onChange={(e) => update(ac.id, { target: e.target.value })} style={{ ...inputStyle, width: 106, padding: "0 4px" }}>
                <option value="cost">Add to Cost</option>
                <option value="price">Add to Price</option>
              </select>
              <RemoveButton onClick={() => onChange(items.filter((i) => i.id !== ac.id))} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Operational cost per order = total monthly bills / (daily target orders * 30)
export function OperationalCostSection({ bills, onBillsChange, dailyTarget, onTargetChange, fmt, currency, perOrder }) {
  const update = (id, patch) => onBillsChange(bills.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const total = bills.reduce((s, b) => s + (parseFloat(b.amount) || 0), 0);
  const monthlyOrders = (parseFloat(dailyTarget) || 0) * 30;

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={titleStyle}>Operational Cost</span>
        <AddButton onClick={() => onBillsChange([...bills, { id: Date.now(), name: "", amount: "" }])}>Add Bill</AddButton>
      </div>

      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Monthly bills</span>
      {bills.length === 0 ? (
        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: 10 }}>No monthly bills listed.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {bills.map((b) => (
            <div key={b.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <input
                placeholder="Bill (e.g. Rent)"
                value={b.name}
                onChange={(e) => update(b.id, { name: e.target.value })}
                style={{ ...inputStyle, flex: 1 }}
              />
              <input
                type="number"
                placeholder="Amount"
                value={b.amount}
                onChange={(e) => update(b.id, { amount: e.target.value })}
                style={{ ...inputStyle, width: 110 }}
              />
              <RemoveButton onClick={() => onBillsChange(bills.filter((x) => x.id !== b.id))} />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: "0.78rem", color: "var(--text-body)", flex: 1 }}>Daily target orders</span>
        <input
          type="number"
          min={1}
          value={dailyTarget}
          onChange={(e) => onTargetChange(e.target.value)}
          style={{ ...inputStyle, width: 90 }}
        />
      </div>

      <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem" }}>
        <Row k="Total monthly bills" v={fmt(total, currency)} />
        <Row k="Monthly orders (target × 30)" v={monthlyOrders.toLocaleString()} />
        <Row k="Operational cost / order" v={fmt(perOrder, currency)} strong />
      </div>
    </div>
  );
}

function Row({ k, v, strong }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: "var(--text-muted)" }}>{k}</span>
      <span style={{ color: "var(--text-heading)", fontWeight: strong ? 800 : 600 }}>{v}</span>
    </div>
  );
}
