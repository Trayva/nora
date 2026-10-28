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
  profitMarginMap = {},
  priceMap = {},
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
        gap: 16,
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
      }}
    >
      {/* ── 1. Recipes & Pricing Section ──────────────────────── */}
      <div style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12, flexWrap: "wrap", width: "100%" }}>
          <div style={{ flex: "1 1 200px", minWidth: 0 }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--text-heading)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
              1. Brand Recipes &amp; Deployment
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginTop: 2 }}>
              Select recipes to deploy for this location.
            </span>
          </div>
          {menuItems.length > 0 && (
            <button
              type="button"
              onClick={onToggleAll}
              style={{
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                color: "var(--accent)",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer",
                padding: "3px 9px",
                flexShrink: 0,
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
            {menuItems.map((item) => {
              const isSelected = selectedMenuIds.includes(item.id);
              const cost = costMap[item.id];
              const profitMargin = profitMarginMap[item.id];
              const price = priceMap[item.id] ?? item.price ?? item.sellingPrice ?? null;

              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 12,
                    background: isSelected ? "var(--bg-hover)" : "rgba(0,0,0,0.02)",
                    border: `1.5px solid ${isSelected ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                    opacity: isSelected ? 1 : 0.55,
                    transition: "all 0.15s ease",
                    width: "100%",
                    maxWidth: "100%",
                    boxSizing: "border-box",
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
                      width: 40,
                      height: 40,
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
                      <MdImage size={18} />
                    )}
                  </div>

                  {/* Name & Ticket time / Profit Margin */}
                  <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                    <strong style={{ fontSize: "0.82rem", color: "var(--text-heading)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.name}
                    </strong>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 2 }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: "0.66rem",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                        }}
                      >
                        <svg
                          width="11"
                          height="11"
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

                      {profitMargin != null && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            fontSize: "0.66rem",
                            color: "#16a34a",
                            fontWeight: 700,
                          }}
                          title="Calculated Profit Margin"
                        >
                          <svg
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#16a34a"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                            style={{ flexShrink: 0 }}
                          >
                            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                            <polyline points="16 7 22 7 22 13" />
                          </svg>
                          <span>{profitMargin.toFixed(1)}%</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price in Location */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.62rem", color: "var(--text-muted)", textTransform: "uppercase", display: "block" }}>
                      Price
                    </span>
                    <strong style={{ fontSize: "0.82rem", color: "var(--text-heading)" }}>
                      {loadingCosts && price === undefined
                        ? "…"
                        : price != null
                          ? fmt(Number(price).toFixed(2), currency)
                          : "N/A"}
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 2. Operating Target & Extra Expenses ─────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
        <div style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px", background: "var(--bg-card)", width: "100%", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", width: "100%" }}>
            <div style={{ flex: "1 1 180px", minWidth: 0 }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "var(--text-heading)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                Daily Sales Target
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block", marginTop: 2 }}>
                Target daily orders ({monthlyOrders.toLocaleString()}/mo, ~{selectedCount > 0 ? Math.round(monthlyOrders / selectedCount).toLocaleString() : 0}/menu).
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <input
                type="number"
                min={1}
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                style={{
                  width: 75,
                  height: 34,
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--bg-hover)",
                  color: "var(--text-heading)",
                  padding: "0 8px",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  textAlign: "center",
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontWeight: 700 }}>orders / day</span>
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
          gap: 10,
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          paddingTop: 10,
          borderTop: "1px solid var(--border)",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <button
          type="button"
          onClick={onRunAnalysis}
          disabled={selectedCount === 0}
          className="app_btn app_btn_cancel"
          style={{
            height: 40,
            padding: "0 14px",
            fontSize: "0.8rem",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            color: "var(--accent)",
            borderColor: "rgba(203,108,220,0.35)",
            background: "rgba(203,108,220,0.08)",
            flex: "1 1 140px",
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
            padding: "0 18px",
            fontSize: "0.8rem",
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            flex: "1 1 140px",
          }}
        >
          Review &amp; Sign <MdArrowForward size={16} />
        </button>
      </div>
    </div>
  );
}
