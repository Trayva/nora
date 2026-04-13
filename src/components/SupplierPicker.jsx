/**
 * SupplierPicker.jsx
 * Place at: src/components/SupplierPicker.jsx
 *
 * Exports:
 *   default         SupplierPicker   — card-based supplier selector UI
 *   useIngredientPrice               — hook: fetches supplier price for one ingredient
 *   useMachinerySupplierPrices       — hook: fetches all machinery prices for a supplier (Map)
 *   PriceTag                         — display component: unit price + subtotal chip
 */

import { useState, useEffect, useRef } from "react";
import { MdSearch, MdClose, MdVerified, MdBusiness, MdExpandMore, MdExpandLess } from "react-icons/md";
import api from "../api/axios";

/* ═══════════════════════════════════════════════════════════
   Hooks
   ═══════════════════════════════════════════════════════════ */

/**
 * Fetch a specific supplier's price for one ingredient.
 * API: GET /library/ingredient/:ingredientId/supplier-price?supplierId=&stateId=
 */
export function useIngredientPrice(ingredientId, supplierId, stateId) {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ingredientId || !supplierId) {
      setPrice(null);
      return;
    }
    setLoading(true);
    let url = `/library/ingredient/${ingredientId}/supplier-price?supplierId=${supplierId}`;
    if (stateId) url += `&stateId=${stateId}`;
    api.get(url)
      .then((r) => {
        const d = r.data?.data;
        // Response shape varies: { price } or { data: { price } } or direct number
        const raw = d?.price ?? d?.data?.price ?? (typeof d === "number" ? d : null);
        setPrice(raw != null ? Number(raw) : null);
      })
      .catch(() => setPrice(null))
      .finally(() => setLoading(false));
  }, [ingredientId, supplierId, stateId]);

  return { price, loading };
}

/**
 * Fetch all machinery prices for a supplier (returns a Map<machineryId, price>).
 * API: GET /library/machinery/prices/supplier/:supplierId?stateId=
 */
export function useMachinerySupplierPrices(supplierId, stateId) {
  const [prices, setPrices] = useState(new Map());
  const [loading, setLoading] = useState(false);
  const prevKey = useRef(null);

  useEffect(() => {
    const key = `${supplierId}|${stateId}`;
    if (!supplierId || key === prevKey.current) return;
    prevKey.current = key;
    setLoading(true);
    let url = `/library/machinery/prices/supplier/${supplierId}`;
    if (stateId) url += `?stateId=${stateId}`;
    api.get(url)
      .then((r) => {
        const d = r.data?.data;
        const list = Array.isArray(d) ? d : d?.data || d?.items || [];
        const map = new Map();
        list.forEach((entry) => {
          const id = entry.machineryId || entry.machinery?.id;
          const p = entry.price ?? entry.pricePerUnit;
          if (id != null && p != null) map.set(id, Number(p));
        });
        setPrices(map);
      })
      .catch(() => setPrices(new Map()))
      .finally(() => setLoading(false));
  }, [supplierId, stateId]);

  // Reset when supplier changes
  useEffect(() => {
    if (!supplierId) { setPrices(new Map()); prevKey.current = null; }
  }, [supplierId]);

  return { prices, loading };
}

/* ═══════════════════════════════════════════════════════════
   PriceTag — inline price + subtotal display
   ═══════════════════════════════════════════════════════════ */
export function PriceTag({ price, loading, qty, unit }) {
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <div className="page_loader_spinner" style={{ width: 11, height: 11 }} />
        <span style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>price…</span>
      </div>
    );
  }

  if (price == null) {
    return (
      <span style={{
        fontSize: "0.64rem", fontWeight: 700, padding: "2px 7px", borderRadius: 999, flexShrink: 0,
        background: "rgba(107,114,128,0.08)", color: "var(--text-muted)", border: "1px solid var(--border)",
      }}>
        No price set
      </span>
    );
  }

  const numQty = qty ? Number(qty) : null;
  const subtotal = numQty && numQty > 0 ? price * numQty : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, gap: 2 }}>
      <span style={{
        fontSize: "0.68rem", fontWeight: 800, padding: "2px 8px", borderRadius: 999,
        background: "rgba(34,197,94,0.1)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.25)",
      }}>
        ₦{Number(price).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}/{unit || "unit"}
      </span>
      {subtotal != null && (
        <span style={{
          fontSize: "0.64rem", fontWeight: 700, color: "var(--accent)",
          padding: "1px 6px", borderRadius: 5,
          background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.2)",
        }}>
          = ₦{subtotal.toLocaleString("en-NG", { maximumFractionDigits: 2 })}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SupplierPicker — card-based supplier selector
   ═══════════════════════════════════════════════════════════ */
export function SupplierPicker({ suppliers = [], suppliersLoading, value, onChange }) {

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropRef = useRef(null);

  const selected = suppliers.find((s) => s.id === value) || null;

  const filtered = suppliers.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.businessName?.toLowerCase().includes(q) ||
      s.state?.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    );
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (id) => { onChange(id); setOpen(false); setSearch(""); };
  const handleClear = (e) => { e.stopPropagation(); onChange(""); };

  return (
    <div ref={dropRef} style={{ position: "relative" }}>
      {/* Trigger */}
      <div
        onClick={() => !suppliersLoading && suppliers.length > 0 && setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          minHeight: 48,
          padding: "8px 12px",
          background: "var(--bg-hover)",
          border: `1.5px solid ${open ? "rgba(203,108,220,0.5)" : "var(--border)"}`,
          borderRadius: 10,
          cursor: suppliersLoading || suppliers.length === 0 ? "default" : "pointer",
          transition: "border-color 0.15s",
          userSelect: "none",
        }}
      >
        {suppliersLoading ? (
          <>
            <div className="page_loader_spinner" style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Loading suppliers…</span>
          </>
        ) : selected ? (
          <>
            {selected.branding?.logo ? (
              <img src={selected.branding.logo} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }} />
            ) : (
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MdBusiness size={16} style={{ color: "var(--accent)" }} />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {selected.businessName}
                </span>
                {selected.isApproved && <MdVerified size={13} style={{ color: "#16a34a", flexShrink: 0 }} />}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                {selected.state?.name && (
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>📍 {selected.state.name}</span>
                )}
                {selected.email && (
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{selected.email}</span>
                )}
              </div>
            </div>
            <button onClick={handleClear} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 0, flexShrink: 0 }}>
              <MdClose size={14} />
            </button>
            {open ? <MdExpandLess size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} /> : <MdExpandMore size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />}
          </>
        ) : (
          <>
            <MdBusiness size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {suppliers.length === 0 ? "No suppliers available" : "Select a supplier…"}
            </span>
            {suppliers.length > 0 && (
              open
                ? <MdExpandLess size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                : <MdExpandMore size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            )}
          </>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          right: 0,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          zIndex: 120,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}>
          {/* Search */}
          <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ position: "relative" }}>
              <MdSearch size={14} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              <input
                className="modal-input"
                autoFocus
                style={{ paddingLeft: 28, height: 34, marginBottom: 0, fontSize: "0.8rem" }}
                placeholder="Search suppliers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "14px 12px", fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>No results</div>
            ) : (
              filtered.map((s) => {
                const isSel = s.id === value;
                return (
                  <div
                    key={s.id}
                    onClick={() => handleSelect(s.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      cursor: "pointer",
                      background: isSel ? "var(--bg-active)" : "transparent",
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "var(--bg-hover)"; }}
                    onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                  >
                    {s.branding?.logo ? (
                      <img src={s.branding.logo} alt="" style={{ width: 38, height: 38, borderRadius: 9, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }} />
                    ) : (
                      <div style={{ width: 38, height: 38, borderRadius: 9, background: isSel ? "rgba(203,108,220,0.15)" : "var(--bg-hover)", border: `1px solid ${isSel ? "rgba(203,108,220,0.3)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <MdBusiness size={17} style={{ color: isSel ? "var(--accent)" : "var(--text-muted)" }} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: "0.84rem", fontWeight: 700, color: isSel ? "var(--accent)" : "var(--text-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.businessName}
                        </span>
                        {s.isApproved && <MdVerified size={12} style={{ color: "#16a34a", flexShrink: 0 }} />}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 2, flexWrap: "wrap" }}>
                        {s.state?.name && (
                          <span style={{ fontSize: "0.67rem", color: "var(--text-muted)" }}>📍 {s.state.name}</span>
                        )}
                        {s.email && (
                          <span style={{ fontSize: "0.67rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                            {s.email}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
                      {!s.isApproved && (
                        <span style={{ fontSize: "0.58rem", fontWeight: 800, padding: "1px 6px", borderRadius: 999, background: "rgba(234,179,8,0.1)", color: "#ca8a04", border: "1px solid rgba(234,179,8,0.25)" }}>
                          PENDING
                        </span>
                      )}
                      {isSel && (
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default SupplierPicker;