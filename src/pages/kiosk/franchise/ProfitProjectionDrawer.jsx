import { useEffect, useState } from "react";
import { MdImage, MdTrendingUp, MdTrendingDown } from "react-icons/md";
import api from "../../../api/axios";
import Drawer from "../../../components/Drawer";
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

// Projection of monthly income and profit across all selected menus (Analysis view only).
export default function ProfitProjectionDrawer({
  isOpen,
  onClose,
  menus,
  stateId,
  currency,
  fmt,
  plan,
  royaltyPercent,
  externalCostMap,
}) {
  const [internalCostMap, setInternalCostMap] = useState({});
  const [loading, setLoading] = useState(false);

  const costMap = externalCostMap || internalCostMap;
  const idsKey = menus.map((m) => m.id).join(",");

  useEffect(() => {
    if (!isOpen || menus.length === 0 || externalCostMap) return;
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
      setInternalCostMap(Object.fromEntries(entries));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen, idsKey, stateId, externalCostMap]);

  const {
    monthlyBills,
    monthlyOrders,
    operationalPerOrder,
    dailyTarget,
    getMargin,
    priceFor,
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
      menu: m,
      margin,
      rawMargin,
      cost,
      totalCost,
      price,
      royalty,
      profitPerSale,
      revenue: price * ordersPerMenu,
      totalCostMonthly: totalCost * ordersPerMenu,
      royaltyMonthly: royalty * ordersPerMenu,
      profitMonthly: profitPerSale * ordersPerMenu,
    };
  });

  const ok = rows.filter((r) => !r.missing);
  const sum = (key) => ok.reduce((s, r) => s + r[key], 0);
  const revenue = sum("revenue");
  const totalCostMonthly = sum("totalCostMonthly");
  const royaltyMonthly = sum("royaltyMonthly");
  const profit = sum("profitMonthly");
  const operationalMonthly = operationalPerOrder * ordersPerMenu * ok.length;
  const productCostMonthly = totalCostMonthly - operationalMonthly;
  const profitable = profit >= 0;
  const profitMarginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Break-Even & Profit Projection" description={`${menus.length} menu item${menus.length === 1 ? "" : "s"} evaluated`} width={560}>
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
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{profitMarginPct.toFixed(1)}% profit margin</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--border)" }}>
            <Stat k="Daily income" v={fmt(revenue / 30, currency)} />
            <Stat k="Daily profit" v={fmt(profit / 30, currency)} color={profitable ? "#16a34a" : "#ef4444"} />
            <Stat k="Orders / month" v={monthlyOrders.toLocaleString()} />
          </div>
        </div>

        {/* Breakdown Card */}
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "12px 16px", background: "var(--bg-card)" }}>
          <span style={label}>Monthly Financial Breakdown</span>
          <div style={{ marginTop: 6 }}>
            <BreakRow k="Sales Income (Gross)" v={fmt(revenue, currency)} bold />
            <BreakRow k="Product Costs (Ingredients + Extra Costs)" v={fmt(productCostMonthly, currency)} sign="− " color="#ef4444" />
            <BreakRow k={`Operational Costs (${fmt(monthlyBills, currency)} monthly bills)`} v={fmt(operationalMonthly, currency)} sign="− " color="#ef4444" />
            <BreakRow k={`Brand Royalty (${num(royaltyPercent)}%)`} v={fmt(royaltyMonthly, currency)} sign="− " color="#ef4444" />
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 6 }}>
              <BreakRow k="Net Projected Profit" v={fmt(profit, currency)} bold color={profitable ? "#16a34a" : "#ef4444"} />
            </div>
          </div>
        </div>

        {/* Operating Parameters Summary (Read-Only) */}
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--bg-card)", padding: "12px 16px" }}>
          <span style={label}>Operating Parameters</span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginTop: 8 }}>
            <div style={{ background: "var(--bg-hover)", padding: "8px 10px", borderRadius: 8 }}>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>Daily Target</span>
              <strong style={{ fontSize: "0.86rem", color: "var(--text-heading)" }}>{dailyTarget} orders / day</strong>
              <span style={{ fontSize: "0.64rem", color: "var(--text-muted)", display: "block" }}>
                (~{Math.round(ordersPerMenu).toLocaleString()}/menu/mo)
              </span>
            </div>
            <div style={{ background: "var(--bg-hover)", padding: "8px 10px", borderRadius: 8 }}>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>Total Monthly Bills</span>
              <strong style={{ fontSize: "0.86rem", color: "var(--text-heading)" }}>{fmt(monthlyBills, currency)}</strong>
            </div>
            <div style={{ background: "var(--bg-hover)", padding: "8px 10px", borderRadius: 8 }}>
              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", display: "block" }}>Operational Cost / Order</span>
              <strong style={{ fontSize: "0.86rem", color: "var(--text-heading)" }}>{fmt(operationalPerOrder, currency)}</strong>
            </div>
          </div>
        </div>

        {/* Per-menu breakdown cards (Read-Only Analysis) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={label}>Per Menu Financial Analysis</span>
          {loading && ok.length === 0 && <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Calculating costs…</div>}
          {rows.map((r) => (
            <div key={r.menu.id} style={{ border: "1px solid var(--border)", borderRadius: 14, background: "var(--bg-card)", padding: 12 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", flexShrink: 0 }}>
                  {r.menu.image ? <img src={r.menu.image} alt={r.menu.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <MdImage size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: "0.88rem", color: "var(--text-heading)", display: "block" }}>{r.menu.name}</strong>
                  <span style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 700 }}>
                    Markup: {r.margin}%
                  </span>
                </div>
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(105px, 1fr))", gap: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                  <Stat k="Total Cost" v={fmt(r.totalCost, currency)} />
                  <Stat k="Selling Price" v={fmt(r.price, currency)} color="var(--accent)" />
                  <Stat
                    k={
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <RoyaltyIcon size={11} /> Royalty
                      </span>
                    }
                    v={fmt(r.royalty, currency)}
                  />
                  <Stat k="Profit / Sale" v={fmt(r.profitPerSale, currency)} color={r.profitPerSale >= 0 ? "#16a34a" : "#ef4444"} />
                  <Stat k="Monthly Income" v={fmt(r.revenue, currency)} />
                  <Stat k="Monthly Orders" v={Math.round(ordersPerMenu).toLocaleString()} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  );
}
