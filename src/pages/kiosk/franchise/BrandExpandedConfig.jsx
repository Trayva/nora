import { useState } from "react";
import { MdCheck, MdImage, MdTrendingUp, MdArrowForward } from "react-icons/md";
import { ExtraCostsSection, OperationalCostSection } from "./CostSections";
import { num } from "./useFranchisePlan";

export default function BrandExpandedConfig({
  brand,
  menuItems = [],
  loadingMenu = false,
  selectedMenuIds = [],
  onToggleMenu,
  onToggleAll,
  onOpenMenuDrawer,
  costMap = {},
  loadingCosts = false,
  currency,
  fmt,
  plan,
  royaltyPercent,
  onRunAnalysis,
  onProceed,
}) {
  const {
    extraCosts,
    setExtraCosts,
    bills,
    setBills,
    dailyTarget,
    setDailyTarget,
    monthlyBills,
    monthlyOrders,
    operationalPerOrder,
    getMargin,
    setMargin,
    priceFor,
  } = plan;

  const allSelected = menuItems.length > 0 && selectedMenuIds.length === menuItems.length;
  const selectedCount = selectedMenuIds.length;

  return (
    <div
      onClick={(e) => e.stopPropagation() /* Prevent card collapse on click */}
      style={{
        marginTop: 18,
        paddingTop: 18,
        borderTop: "1.5px dashed var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* ── 1. Recipes & Pricing Section ──────────────────────── */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text-heading)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
              1. Brand Recipes &amp; Markup
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              Select recipes to deploy and enter desired markup percentage for each item.
            </span>
          </div>
          {menuItems.length > 0 && (
            <button
              type="button"
              onClick={onToggleAll}
              style={{
                background: "none",
                border: "none",
                color: "var(--accent)",
                fontSize: "0.74rem",
                fontWeight: 700,
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              {allSelected ? "Unselect all" : "Select all"}
            </button>
          )}
        </div>

        {loadingMenu ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.82rem" }}>
            Loading brand recipes...
          </div>
        ) : menuItems.length === 0 ? (
          <div style={{ padding: "16px", borderRadius: 10, background: "var(--bg-hover)", textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            No recipes published for this brand yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {menuItems.map((item) => {
              const isSelected = selectedMenuIds.includes(item.id);
              const cost = costMap[item.id];
              const rawMargin = getMargin(item.id);
              const margin = num(rawMargin);
              const pricing = cost != null ? priceFor(cost, margin) : null;

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: isSelected ? "var(--bg-hover)" : "rgba(0,0,0,0.02)",
                    border: `1.5px solid ${isSelected ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                    opacity: isSelected ? 1 : 0.55,
                    transition: "all 0.15s ease",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    aria-label={isSelected ? `Unselect ${item.name}` : `Select ${item.name}`}
                    onClick={() => onToggleMenu(item.id)}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                      background: isSelected ? "var(--accent)" : "var(--bg-card)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      padding: 0,
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <MdCheck size={14} />}
                  </button>

                  {/* Thumbnail */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      overflow: "hidden",
                      background: "var(--bg-card)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-muted)",
                      flexShrink: 0,
                      border: "1px solid var(--border)",
                    }}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <MdImage size={20} />
                    )}
                  </div>

                  {/* Name & Details link */}
                  <div style={{ flex: "1 1 140px", minWidth: 120 }}>
                    <strong style={{ fontSize: "0.84rem", color: "var(--text-heading)", display: "block" }}>
                      {item.name}
                    </strong>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: "0.68rem",
                        color: "var(--text-muted)",
                        fontWeight: 600,
                        marginTop: 2,
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        style={{ opacity: 0.75, flexShrink: 0 }}
                      >
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{item.ticketTime ? `${item.ticketTime} min` : "—"}</span>
                    </span>
                  </div>

                  {/* Cost in Location */}
                  <div style={{ textAlign: "right", minWidth: 85 }}>
                    <span style={{ fontSize: "0.64rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                      Cost
                    </span>
                    <strong style={{ fontSize: "0.84rem", color: "var(--text-heading)" }}>
                      {loadingCosts && cost === undefined
                        ? "…"
                        : cost != null
                          ? fmt(cost.toFixed(2), currency)
                          : "N/A"}
                    </strong>
                  </div>

                  {/* Markup Input */}
                  {/* <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ position: "relative", width: 88 }}>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        placeholder="0"
                        value={rawMargin}
                        disabled={!isSelected}
                        onChange={(e) => setMargin(item.id, e.target.value)}
                        aria-label={`Markup percentage for ${item.name}`}
                        style={{
                          width: "100%",
                          height: 32,
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "var(--bg-card)",
                          color: "var(--text-heading)",
                          padding: "0 24px 0 8px",
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          outline: "none",
                        }}
                      />
                      <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 700 }}>
                        %
                      </span>
                    </div>
                  </div> */}

                  {/* Selling Price */}
                  {/* <div style={{ textAlign: "right", minWidth: 95 }}>
                    <span style={{ fontSize: "0.64rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                      Selling Price
                    </span>
                    <strong style={{ fontSize: "0.92rem", color: "var(--accent)" }}>
                      {pricing ? fmt(pricing.price, currency) : "—"}
                    </strong>
                  </div> */}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 2. Operating Target & Extra Expenses ─────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", background: "var(--bg-card)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "var(--text-heading)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                Daily Sales Target
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Expected daily customer orders. Monthly projection = target × 30 days ({monthlyOrders.toLocaleString()} total orders/month, ~{selectedCount > 0 ? Math.round(monthlyOrders / selectedCount).toLocaleString() : 0} per selected menu).
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="number"
                min={1}
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                style={{
                  width: 90,
                  height: 34,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-hover)",
                  color: "var(--text-heading)",
                  padding: "0 10px",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  textAlign: "center",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 700 }}>orders / day</span>
            </div>
          </div>
        </div>

        {/* Extra Costs Section */}
        <ExtraCostsSection items={extraCosts} onChange={setExtraCosts} />

        {/* Operational Costs Section */}
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

      {/* ── 3. Bottom Actions: Break-Even & Continue ─────────── */}
      <div
        style={{
          display: "flex",
          gap: 12,
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          paddingTop: 8,
          borderTop: "1px solid var(--border)",
        }}
      >
        <button
          type="button"
          onClick={onRunAnalysis}
          disabled={selectedCount === 0}
          className="app_btn app_btn_cancel"
          style={{
            height: 40,
            padding: "0 18px",
            fontSize: "0.82rem",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            color: "var(--accent)",
            borderColor: "rgba(203,108,220,0.35)",
            background: "rgba(203,108,220,0.08)",
          }}
        >
          Break-Even Analysis
        </button>

        <button
          type="button"
          onClick={onProceed}
          disabled={selectedCount === 0}
          className="app_btn app_btn_confirm"
          style={{
            height: 40,
            padding: "0 22px",
            fontSize: "0.82rem",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Review &amp; Sign <MdArrowForward size={16} />
        </button>
      </div>
    </div>
  );
}
