import { useEffect, useState } from "react";
import { MdImage } from "react-icons/md";
import api from "../../../api/axios";
import Drawer from "../../../components/Drawer";
import MarginSlider from "./MarginSlider";
import { ExtraCostsSection, OperationalCostSection } from "./CostSections";

const num = (v) => parseFloat(v) || 0;

// Drawer showing basic menu details and the average cost (per variant + base) in the chosen state.
export default function FranchiseMenuDrawer({ menu, stateId, currency, fmt, locationBills = [], onClose }) {
  const [details, setDetails] = useState(null);
  const [costs, setCosts] = useState([]); // [{ key, label, cost, error }]
  const [loading, setLoading] = useState(false);
  const [margin, setMargin] = useState(30);
  const [extraCosts, setExtraCosts] = useState([]);
  const [bills, setBills] = useState([]);
  const [dailyTarget, setDailyTarget] = useState(50);

  // Prefill monthly bills from the chosen location (editable)
  const billsKey = JSON.stringify(locationBills);
  useEffect(() => {
    setBills(locationBills.map((b, i) => ({ id: `loc-${i}`, name: b.name || b.title || "", amount: b.amount ?? "" })));
  }, [billsKey]);

  const monthlyBills = bills.reduce((s, b) => s + num(b.amount), 0);
  const monthlyOrders = num(dailyTarget) * 30;
  const operationalPerOrder = monthlyOrders > 0 ? monthlyBills / monthlyOrders : 0;

  // p = cost + (margin/100) * cost, where cost includes extra costs + operational cost
  const priceFor = (ingredientCost) => {
    let before = ingredientCost + operationalPerOrder;
    let after = 0;
    extraCosts.forEach((ac) => {
      const val = ac.type === "percentage" ? (num(ac.amount) / 100) * ingredientCost : num(ac.amount);
      if (ac.target === "price") after += val;
      else before += val;
    });
    return { totalCost: before + after, price: before + (margin / 100) * before + after };
  };

  useEffect(() => {
    if (!menu) {
      setDetails(null);
      setCosts([]);
      return;
    }
    let cancelled = false;

    const calc = async (variantId) => {
      try {
        const res = await api.get(`/library/calculation/menu/${menu.id}/calc`, {
          params: { stateId, useAverage: true, ...(variantId ? { variantId } : {}) },
        });
        return { cost: res.data.data?.cost ?? null };
      } catch (err) {
        return { cost: null, error: err.response?.data?.message || "Unavailable" };
      }
    };

    (async () => {
      setLoading(true);
      setDetails(menu);
      let full = menu;
      try {
        const res = await api.get(`/vendor/menu/${menu.id}`);
        full = res.data.data || menu;
        if (!cancelled) setDetails(full);
      } catch {
        /* fall back to list data */
      }
      const variants = Array.isArray(full.variants) ? full.variants : [];
      const rows = [{ key: "base", label: "Base menu", variantId: null }, ...variants.map((v) => ({ key: v.id, label: v.name, variantId: v.id }))];
      const results = await Promise.all(rows.map((r) => calc(r.variantId)));
      if (!cancelled) {
        setCosts(rows.map((r, i) => ({ key: r.key, label: r.label, ...results[i] })));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [menu?.id, stateId]);

  const d = details || menu;

  return (
    <Drawer isOpen={!!menu} onClose={onClose} title={d?.name || "Menu"} description={d?.concept?.name} width={460}>
      {d && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              width: "100%",
              height: 200,
              borderRadius: 12,
              overflow: "hidden",
              background: "var(--bg-hover)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
            }}
          >
            {d.image ? <img src={d.image} alt={d.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <MdImage size={40} />}
          </div>

          {d.description && <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-body)", lineHeight: 1.5 }}>{d.description}</p>}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              d.origin && ["Origin", d.origin],
              d.serveTo && ["Serves", d.serveTo],
              d.ticketTime ? ["Ticket time", `${d.ticketTime} min`] : null,
              d.packaging && ["Packaging", d.packaging],
            ]
              .filter(Boolean)
              .map(([k, v]) => (
                <span key={k} style={{ fontSize: "0.72rem", padding: "4px 10px", borderRadius: 999, background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-body)" }}>
                  <span style={{ color: "var(--text-muted)" }}>{k}: </span>
                  <strong>{v}</strong>
                </span>
              ))}
          </div>

          <div>
            <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Pricing in Your Location (average costs)
            </span>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <MarginSlider value={margin} onChange={setMargin} />
              <ExtraCostsSection items={extraCosts} onChange={setExtraCosts} />
              <OperationalCostSection
                bills={bills}
                onBillsChange={setBills}
                dailyTarget={dailyTarget}
                onTargetChange={setDailyTarget}
                fmt={fmt}
                currency={currency}
                perOrder={operationalPerOrder}
              />

              <div style={{ border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 8, padding: "8px 14px", background: "var(--bg-hover)", fontSize: "0.66rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                  <span>Variant</span>
                  <span style={{ textAlign: "right" }}>Total cost</span>
                  <span style={{ textAlign: "right" }}>Selling price</span>
                </div>
                {loading && costs.length === 0 ? (
                  <div style={{ padding: 14, fontSize: "0.8rem", color: "var(--text-muted)" }}>Calculating costs…</div>
                ) : (
                  costs.map((c) => {
                    const p = c.cost != null ? priceFor(c.cost) : null;
                    return (
                      <div key={c.key} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 8, padding: "10px 14px", fontSize: "0.84rem", borderTop: "1px solid var(--border)", alignItems: "center" }}>
                        <span style={{ color: "var(--text-body)" }}>
                          {c.label}
                          {c.cost != null && (
                            <span style={{ display: "block", fontSize: "0.66rem", color: "var(--text-muted)" }}>Ingredients {fmt(c.cost, currency)}</span>
                          )}
                        </span>
                        {p ? (
                          <>
                            <span style={{ textAlign: "right", color: "var(--text-body)" }}>{fmt(p.totalCost, currency)}</span>
                            <strong style={{ textAlign: "right", color: "var(--accent)", fontSize: "0.95rem" }}>{fmt(p.price, currency)}</strong>
                          </>
                        ) : (
                          <span style={{ gridColumn: "2 / 4", textAlign: "right", color: "var(--text-muted)", fontSize: "0.76rem" }} title={c.error}>
                            N/A
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </Drawer>
  );
}
