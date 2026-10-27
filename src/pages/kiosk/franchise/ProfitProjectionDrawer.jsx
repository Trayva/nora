import { useEffect, useState } from "react";
import { MdImage, MdTrendingUp, MdTrendingDown } from "react-icons/md";
import api from "../../../api/axios";
import Drawer from "../../../components/Drawer";
import { ExtraCostsSection, OperationalCostSection } from "./CostSections";
import { RoyaltyIcon } from "./RoyaltyBadge";
import { num } from "./useFranchisePlan";

const label = { fontSize: "0.68rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 };

function Stat({ k, v, color, big }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={label}>{k}</span>
      <strong style={{ fontSize: big ? "1.35rem" : "0.9rem", color: color || "var(--text-heading)" }}>{v}</strong>
    </div>
  );
}

function BreakRow({ k, v, color, bold, sign }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", padding: "4px 0" }}>
      <span style={{ color: "var(--text-body)" }}>{k}</span>
      <span style={{ color: color || "var(--text-heading)", fontWeight: bold ? 800 : 600 }}>
        {sign}
        {v}
      </span>
    </div>
  );
}

// Projection of monthly income and profit across all selected menus.
export default function ProfitProjectionDrawer({ isOpen, onClose, menus, stateId, currency, fmt, plan, royaltyPercent }) {
  const [costMap, setCostMap] = useState({}); // menuId -> cost | null
  const [loading, setLoading] = useState(false);
  const [showAssumptions, setShowAssumptions] = useState(false);

  const idsKey = menus.map((m) => m.id).join(",");

  useEffect(() => {
    if (!isOpen || menus.length === 0) return;
    let cancelled = false;
    setLoading(true);
    Promise.all(
      menus.map(async (m) => {
        try {
          const res = await api.get(`/library/calculation/menu/${m.id}/calc`, { params: { stateId, useAverage: true } });
          return [m.id, res.data.data?.cost ?? null];
        } catch {
          return [m.id, null];
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setCostMap(Object.fromEntries(entries));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, idsKey, stateId]);

  const {
    extraCosts, setExtraCosts, bills, setBills, dailyTarget, setDailyTarget,
    monthlyBills, monthlyOrders, operationalPerOrder, getMargin, setMargin, applyMarginToAll, defaultMargin, priceFor,
  } = plan;

  const royaltyRate = num(royaltyPercent) / 100;
  const ordersPerMenu = menus.length > 0 ? monthlyOrders / menus.length : 0; // target split across selected menus

  const rows = menus.map((m) => {
    const cost = costMap[m.id];
    const rawMargin = getMargin(m.id);
    const margin = num(rawMargin);
    if (cost == null) return { menu: m, margin, rawMargin, missing: true };
    const { totalCost, price } = priceFor(cost, margin);
    const royalty = price * royaltyRate;
    const profitPerSale = price - totalCost - royalty;
    return {
      menu: m, margin, rawMargin, cost, totalCost, price, royalty, profitPerSale,
      revenue: price * ordersPerMenu,
      totalCostMonthly: totalCost * ordersPerMenu,
      royaltyMonthly: royalty * ordersPerMenu,
      profitMonthly: profitPerSale * ordersPerMenu,
    };
  });

  const ok = rows.filter((r) => !r.missing);
  const sum = (key) => ok.reduce((s, r) => s + r[key], 0);
  const revenue = sum("revenue");
  const totalCostMonthly = sum("totalCostMonthly"); // includes operational share
  const royaltyMonthly = sum("royaltyMonthly");
  const profit = sum("profitMonthly");
  const operationalMonthly = operationalPerOrder * ordersPerMenu * ok.length;
  const productCostMonthly = totalCostMonthly - operationalMonthly;
  const profitable = profit >= 0;
  const profitMarginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Profit Projection" description={`${menus.length} menu item${menus.length === 1 ? "" : "s"} selected`} width={560}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Hero summary */}
        <div
          style={{
            borderRadius: 18,
            padding: 18,
            color: "var(--text-heading)",
            border: `1px solid ${profitable ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)"}`,
            background: profitable
              ? "linear-gradient(135deg, rgba(34,197,94,0.14), rgba(203,108,220,0.10))"
              : "linear-gradient(135deg, rgba(239,68,68,0.14), rgba(203,108,220,0.08))",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <Stat k="Projected monthly income" v={loading ? "…" : fmt(revenue, currency)} big />
            <div style={{ textAlign: "right" }}>
              <span style={label}>Net profit / month</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, color: profitable ? "#16a34a" : "#ef4444" }}>
                {profitable ? <MdTrendingUp size={20} /> : <MdTrendingDown size={20} />}
                <strong style={{ fontSize: "1.35rem" }}>{loading ? "…" : fmt(profit, currency)}</strong>
              </div>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{profitMarginPct.toFixed(1)}% of income</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--border)" }}>
            <Stat k="Daily income" v={fmt(revenue / 30, currency)} />
            <Stat k="Daily profit" v={fmt(profit / 30, currency)} color={profitable ? "#16a34a" : "#ef4444"} />
            <Stat k="Orders / month" v={monthlyOrders.toLocaleString()} />
          </div>
        </div>

        {/* Breakdown */}
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "12px 16px", background: "var(--bg-card)" }}>
          <span style={label}>Monthly breakdown</span>
          <div style={{ marginTop: 6 }}>
            <BreakRow k="Sales income" v={fmt(revenue, currency)} bold />
            <BreakRow k="Product costs (API + extra costs)" v={fmt(productCostMonthly, currency)} sign="− " color="#ef4444" />
            <BreakRow k={`Operational costs (${fmt(monthlyBills, currency)} bills)`} v={fmt(operationalMonthly, currency)} sign="− " color="#ef4444" />
            <BreakRow k={`Brand royalty (${num(royaltyPercent)}%)`} v={fmt(royaltyMonthly, currency)} sign="− " color="#ef4444" />
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 6 }}>
              <BreakRow k="Net profit" v={fmt(profit, currency)} bold color={profitable ? "#16a34a" : "#ef4444"} />
            </div>
          </div>
        </div>

        {/* Assumptions */}
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--bg-card)", padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <span style={label}>Daily target orders (all menus)</span>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                Split evenly: {Math.round(ordersPerMenu).toLocaleString()} orders / month per menu
              </div>
            </div>
            <input
              type="number"
              min={1}
              value={dailyTarget}
              onChange={(e) => setDailyTarget(e.target.value)}
              style={{ width: 90, height: 34, borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text-heading)", padding: "0 10px", fontWeight: 700 }}
            />
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setShowAssumptions((s) => !s)}
              style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--accent)", fontWeight: 700, fontSize: "0.74rem", cursor: "pointer" }}
            >
              {showAssumptions ? "Hide" : "Edit"} extra & operational costs
            </button>
          </div>
          {showAssumptions && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
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
            </div>
          )}
        </div>

        {/* Per-menu cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={label}>Per menu</span>
          {loading && ok.length === 0 && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Calculating costs…</div>}
          {rows.map((r) => (
            <div key={r.menu.id} style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--bg-card)", padding: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexShrink: 0 }}>
                  {r.menu.image ? <img src={r.menu.image} alt={r.menu.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <MdImage size={20} />}
                </div>
                <strong style={{ flex: 1, fontSize: "0.88rem", color: "var(--text-heading)" }}>{r.menu.name}</strong>
                {!r.missing && (
                  <strong style={{ color: r.profitMonthly >= 0 ? "#16a34a" : "#ef4444", fontSize: "0.9rem" }}>
                    {fmt(r.profitMonthly, currency)}
                    <span style={{ display: "block", fontSize: "0.62rem", color: "var(--text-muted)", fontWeight: 600, textAlign: "right" }}>profit / month</span>
                  </strong>
                )}
              </div>

              {r.missing ? (
                <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>Cost unavailable for this location — excluded from totals.</div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={label}>Margin</span>
                    <div style={{ position: "relative", width: 110 }}>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        placeholder="0"
                        value={r.rawMargin}
                        onChange={(e) => setMargin(r.menu.id, e.target.value)}
                        aria-label={`Margin percentage for ${r.menu.name}`}
                        style={{ width: "100%", height: 34, borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-hover)", color: "var(--text-heading)", padding: "0 28px 0 10px", fontSize: "0.84rem", fontWeight: 800, outline: "none" }}
                      />
                      <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 700 }}>%</span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))", gap: 10 }}>
                    <Stat k="Total cost" v={fmt(r.totalCost, currency)} />
                    <Stat k="Selling price" v={fmt(r.price, currency)} color="var(--accent)" />
                    <Stat
                      k={
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <RoyaltyIcon size={11} /> Royalty
                        </span>
                      }
                      v={fmt(r.royalty, currency)}
                    />
                    <Stat k="Profit / sale" v={fmt(r.profitPerSale, currency)} color={r.profitPerSale >= 0 ? "#16a34a" : "#ef4444"} />
                    <Stat k="Monthly income" v={fmt(r.revenue, currency)} />
                    <Stat k="Monthly orders" v={Math.round(ordersPerMenu).toLocaleString()} />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
}
