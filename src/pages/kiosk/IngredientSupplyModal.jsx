import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdClose, MdLocalShipping, MdOutlineInventory2 } from "react-icons/md";
import api from "../../api/axios";
import { SupplierPicker } from "../../components/SupplierPicker";

export default function IngredientSupplyModal({
  isOpen,
  cart,
  selectedIngItems,
  onClose,
  onSubmitted,
}) {
  const [suppliers, setSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [supplierId, setSupplierId] = useState("");
  const [quantities, setQuantities] = useState({});
  const [units, setUnits] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setQuantities(
        Object.fromEntries(
          (selectedIngItems || []).map((m) => [m.id, String(m.menuQty || 1)]),
        ),
      );
      setUnits(
        Object.fromEntries(
          (selectedIngItems || []).map((m) => [
            m.id,
            m.unit?.toLowerCase() === "ml" || m.unit?.toLowerCase() === "l"
              ? "ml"
              : "g",
          ]),
        ),
      );
      setSupplierId("");
    }
  }, [isOpen, selectedIngItems]);

  useEffect(() => {
    const stateId = cart?.location?.stateId || cart?.location?.state?.id || "";
    const url = stateId ? `/supplier?stateId=${stateId}` : "/supplier";
    api
      .get(url)
      .then((r) => {
        const d = r.data.data;
        setSuppliers(Array.isArray(d) ? d : d?.items || d?.suppliers || []);
      })
      .catch(() => toast.error("Failed to load suppliers"))
      .finally(() => setSuppliersLoading(false));
  }, [cart]);

  const toBaseQty = (val, unit) => {
    const n = Number(val);
    if (unit === "kg") return n * 1000;
    if (unit === "L") return n * 1000;
    return n;
  };
  const getUnitOpts = (baseUnit) => {
    if (!baseUnit) return ["g", "kg"];
    const u = baseUnit.toLowerCase();
    if (u === "g" || u === "kg") return ["g", "kg"];
    if (u === "ml" || u === "l") return ["ml", "L"];
    return ["unit"];
  };

  const handleSubmit = async () => {
    if (!supplierId) return toast.error("Select a supplier");
    const valid = (selectedIngItems || []).filter(
      (m) => quantities[m.id] && Number(quantities[m.id]) > 0,
    );
    if (!valid.length)
      return toast.error("Enter quantity for at least one item");
    setSubmitting(true);
    try {
      await api.post("/kiosk/supply", {
        kioskId: cart?.id,
        supplierId,
        items: valid.map((m) => ({
          ingredientId: m.id,
          quantity: toBaseQty(quantities[m.id], units[m.id] || "g"),
        })),
      });
      onSubmitted();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to create supply request",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1600,
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={!submitting ? onClose : undefined}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(3px)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "min(560px, 100vw)",
          background: "var(--bg-card)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.25)",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            flexShrink: 0,
            borderBottom: "1px solid var(--border)",
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MdLocalShipping size={17} style={{ color: "#16a34a" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "0.95rem",
                fontWeight: 900,
                color: "var(--text-heading)",
              }}
            >
              Request Ingredient Supply
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              {(selectedIngItems || []).length} ingredient
              {(selectedIngItems || []).length !== 1 ? "s" : ""} selected
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 7,
              background: "var(--bg-hover)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
            }}
          >
            <MdClose size={14} />
          </button>
        </div>
        {/* Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div className="form-field">
            <label className="modal-label">Supplier *</label>
            <SupplierPicker
              suppliers={suppliers}
              suppliersLoading={suppliersLoading}
              value={supplierId}
              onChange={setSupplierId}
            />
          </div>
          <div>
            <label
              className="modal-label"
              style={{ marginBottom: 10, display: "block" }}
            >
              Items & Quantities *
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(selectedIngItems || []).map((m) => {
                const uOpts = getUnitOpts(m.unit);
                return (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border)",
                      borderRadius: 11,
                    }}
                  >
                    {m.image ? (
                      <img
                        src={m.image}
                        alt=""
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: "rgba(34,197,94,0.08)",
                          border: "1px solid rgba(34,197,94,0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <MdOutlineInventory2
                          size={16}
                          style={{ color: "#16a34a" }}
                        />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "0.86rem",
                          fontWeight: 700,
                          color: "var(--text-body)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {m.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.65rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Ingredient{m.unit ? ` · ${m.unit}` : ""}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 5,
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          border: "1px solid var(--border)",
                          borderRadius: 9,
                          overflow: "hidden",
                          height: 34,
                        }}
                      >
                        <button
                          onClick={() =>
                            setQuantities((p) => ({
                              ...p,
                              [m.id]: String(
                                Math.max(1, Number(p[m.id] || 1) - 1),
                              ),
                            }))
                          }
                          style={{
                            width: 30,
                            height: 34,
                            background: "var(--bg-card)",
                            border: "none",
                            borderRight: "1px solid var(--border)",
                            cursor: "pointer",
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          −
                        </button>
                        <input
                          className="modal-input"
                          type="number"
                          min="1"
                          value={quantities[m.id] ?? "1"}
                          onChange={(e) =>
                            setQuantities((p) => ({
                              ...p,
                              [m.id]: e.target.value,
                            }))
                          }
                          style={{
                            width: 70,
                            height: 34,
                            textAlign: "center",
                            marginBottom: 0,
                            fontSize: "0.88rem",
                            fontWeight: 700,
                            border: "none",
                            borderRadius: 0,
                          }}
                        />
                        <button
                          onClick={() =>
                            setQuantities((p) => ({
                              ...p,
                              [m.id]: String(Number(p[m.id] || 1) + 1),
                            }))
                          }
                          style={{
                            width: 30,
                            height: 34,
                            background: "var(--bg-card)",
                            border: "none",
                            borderLeft: "1px solid var(--border)",
                            cursor: "pointer",
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          +
                        </button>
                      </div>
                      {uOpts.length > 1 && (
                        <div style={{ display: "flex", gap: 4 }}>
                          {uOpts.map((u) => (
                            <button
                              key={u}
                              onClick={() =>
                                setUnits((p) => ({ ...p, [m.id]: u }))
                              }
                              style={{
                                height: 24,
                                padding: "0 8px",
                                borderRadius: 6,
                                border: `1px solid ${(units[m.id] || uOpts[0]) === u ? "var(--accent)" : "var(--border)"}`,
                                background:
                                  (units[m.id] || uOpts[0]) === u
                                    ? "var(--bg-active)"
                                    : "var(--bg-hover)",
                                color:
                                  (units[m.id] || uOpts[0]) === u
                                    ? "var(--accent)"
                                    : "var(--text-muted)",
                                cursor: "pointer",
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                fontFamily: "inherit",
                              }}
                            >
                              {u}
                            </button>
                          ))}
                        </div>
                      )}
                      {uOpts.length === 1 && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                            fontWeight: 600,
                          }}
                        >
                          {uOpts[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Footer */}
        <div
          style={{
            flexShrink: 0,
            borderTop: "1px solid var(--border)",
            padding: "14px 22px 20px",
            display: "flex",
            gap: 8,
          }}
        >
          <button
            className="app_btn app_btn_cancel"
            style={{ flex: 1, height: 44 }}
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className={`app_btn app_btn_confirm${submitting ? " btn_loading" : ""}`}
            style={{
              flex: 2,
              height: 44,
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            onClick={handleSubmit}
            disabled={submitting || !supplierId}
          >
            <span className="btn_text">
              <MdLocalShipping size={15} /> Submit Request
            </span>
            {submitting && (
              <span className="btn_loader" style={{ width: 14, height: 14 }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
