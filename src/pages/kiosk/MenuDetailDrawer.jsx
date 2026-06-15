import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdArrowBack,
  MdCheck,
  MdAdd,
  MdInfoOutline,
  MdSettings,
  MdAttachMoney,
  MdBuild,
  MdOutlineInventory2,
  MdRestaurantMenu,
  MdAccessTime,
  MdMenuBook,
  MdExpandLess,
  MdExpandMore,
  MdLocalShipping,
} from "react-icons/md";
import Tabs from "../../components/Tabs";
import api from "../../api/axios";
import { useAppState } from "../../contexts/StateContext";
import MachinerySupplyModal from "./MachinerySupplyModal";
import IngredientSupplyModal from "./IngredientSupplyModal";

const MAX_MENU_ITEMS = 5;

export function MenuDetailDrawer({
  menuId,
  menuName,
  isSelected,
  onToggleSelect,
  selectedCount,
  onClose,
  cart,
}) {
  const { selectedState, states } = useAppState();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [markup, setMarkup] = useState(30);
  const [useCache, setUseCache] = useState(true);

  const [analysisStateId, setAnalysisStateId] = useState(selectedState?.id || "");
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [menuAvailable, setMenuAvailable] = useState(true);
  const [availableVariants, setAvailableVariants] = useState([]);
  const [calculatedCosts, setCalculatedCosts] = useState({ base: null, variants: {} });
  const [calcLoading, setCalcLoading] = useState(false);
  const [expandedCombo, setExpandedCombo] = useState("base");

  useEffect(() => {
    if (selectedState?.id && !analysisStateId) {
      setAnalysisStateId(selectedState.id);
    }
  }, [selectedState?.id, analysisStateId]);

  const activeStateId = analysisStateId || selectedState?.id;

  const getCombinationsList = () => {
    const combos = [];
    combos.push({
      key: "base",
      variantId: null,
      extraId: null,
      name: `${menuName} (Base)`,
    });

    (summary?.extras || []).forEach(extra => {
      combos.push({
        key: `base_extra_${extra.id}`,
        variantId: null,
        extraId: extra.id,
        name: `${menuName} (Base) + ${extra.name}`,
      });
    });

    (summary?.variants || []).forEach(variant => {
      combos.push({
        key: `variant_${variant.id}`,
        variantId: variant.id,
        extraId: null,
        name: `${menuName} (${variant.name})`,
      });

      (summary?.extras || []).forEach(extra => {
        combos.push({
          key: `variant_${variant.id}_extra_${extra.id}`,
          variantId: variant.id,
          extraId: extra.id,
          name: `${menuName} (${variant.name}) + ${extra.name}`,
        });
      });
    });

    return combos;
  };

  const getComboData = (combo) => {
    const variant = summary?.variants?.find(v => v.id === combo.variantId) || null;
    const extra = summary?.extras?.find(e => e.id === combo.extraId) || null;

    let totalCost = null;
    if (variant) {
      if (variant.cost != null) {
        totalCost = (variant.cost * variant.quantity);
      }
    }

    if (extra) {
      totalCost += (extra.cost);
    }

    const ingMap = new Map();
    const addIngs = (sourcePrefix) => {
      (summary?.ingredients || []).forEach(ing => {
        const matchingUsedIn = ing.usedIn?.filter(u => u.source?.startsWith(sourcePrefix)) || [];
        if (matchingUsedIn.length > 0) {
          const qtySum = matchingUsedIn.reduce((sum, u) => sum + (u.quantity || 0), 0);
          if (qtySum > 0) {
            const existing = ingMap.get(ing.id);
            if (existing) {
              existing.qty += qtySum;
            } else {
              ingMap.set(ing.id, {
                id: ing.id,
                name: ing.name,
                unit: ing.unit,
                image: ing.image,
                costPerUnit: ing.cost || 0,
                qty: qtySum,
                type: "ingredient",
              });
            }
          }
        }
      });
    };

    addIngs("base");

    if (variant) {
      addIngs(`variant:${variant.name}`);
    }

    const ingredientsList = Array.from(ingMap.values()).map(ing => ({
      ...ing,
      totalCostVal: ing.qty * ing.costPerUnit,
    }));

    const extrasList = [];
    if (extra) {
      extrasList.push({
        id: extra.id,
        name: extra.name,
        unit: extra.prepItem?.unit || "unit",
        image: extra.prepItem?.image || null,
        costPerUnit: extra.cost || 0,
        qty: 1,
        totalCostVal: extra.cost || 0,
        type: "extra",
      });
    }
    if (variant) console.log(variant, variant.cost * variant.quantity)
    const allItems = [...ingredientsList, ...extrasList, ...(variant ? [{
      id: variant.id,
      name: variant?.prepItem?.name,
      unit: variant?.prepItem?.unit,
      image: variant?.prepItem?.image,
      costPerUnit: variant.cost || 0,
      qty: variant.quantity,
      totalCostVal: (variant.cost * variant.quantity) || 0,
      type: "variant",
    }] : [])]
      .filter(x => x.totalCostVal > 0)
      .sort((a, b) => b.totalCostVal - a.totalCostVal);
    console.log("COMBO DATA", combo, {
      totalCost,
      items: allItems,
      extraUsed: extra,
    }, "SUMMARY COST", summary.baseCost)
    return {
      totalCost: totalCost + summary.baseCost,
      items: allItems,
      extraUsed: extra,
    };
  };

  useEffect(() => {
    if (!menuId || !activeStateId) return;

    let active = true;
    const fetchCosts = async () => {
      setCalcLoading(true);
      try {
        // Fetch base cost
        const baseRes = await api.get(`/library/calculation/menu/${menuId}/calc`, {
          params: {
            stateId: activeStateId,
            useAverage: "true",
            returnCacheData: useCache ? "true" : "false",
          }
        });
        const baseCostVal = baseRes.data.data?.cost;

        // Fetch variants costs
        const varCostMap = {};
        const variantList = summary?.variants || [];
        for (const variant of variantList) {
          try {
            const varRes = await api.get(`/library/calculation/menu/${menuId}/calc`, {
              params: {
                stateId: cart ? null : activeStateId,
                useAverage: "true",
                variantId: variant.id,
                kioskId: cart?.id,
                returnCacheData: useCache ? "true" : "false",
              }
            });
            varCostMap[variant.id] = varRes.data.data?.cost;
          } catch {
            varCostMap[variant.id] = null;
          }
        }

        if (active) {
          setCalculatedCosts({
            base: baseCostVal,
            variants: varCostMap
          });
        }
      } catch (e) {
        console.error("Failed to calculate costs", e);
      } finally {
        if (active) setCalcLoading(false);
      }
    };

    fetchCosts();

    return () => {
      active = false;
    };
  }, [menuId, activeStateId, useCache, summary?.variants, cart]);

  const currency = selectedState?.currency || "NGN";
  const formatCost = (amount) =>
    amount != null
      ? new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
        amount,
      )
      : null;

  const calcSellingPrice = (cost) =>
    cost != null ? cost + (markup / 100) * cost : null;

  const calcProfit = (cost) =>
    cost != null ? calcSellingPrice(cost) - cost : null;

  const calcCostPct = (cost) =>
    cost != null && calcSellingPrice(cost) > 0
      ? ((cost / calcSellingPrice(cost)) * 100).toFixed(1)
      : null;

  // Machinery supply request state
  const [selectedMachIds, setSelectedMachIds] = useState([]); // { id, name, image }
  const [showMachSupply, setShowMachSupply] = useState(false);

  // Ingredient supply request state
  const [selectedIngIds, setSelectedIngIds] = useState([]); // { id, name, image, unit }
  const [showIngSupply, setShowIngSupply] = useState(false);

  const toggleIngSelection = (ing) => {
    setSelectedIngIds((prev) => {
      const exists = prev.find((m) => m.id === ing.id);
      if (exists) return prev.filter((m) => m.id !== ing.id);
      return [
        ...prev,
        { id: ing.id, name: ing.name, image: ing.image, unit: ing.unit },
      ];
    });
  };

  const toggleMachSelection = (mach) => {
    setSelectedMachIds((prev) => {
      const exists = prev.find((m) => m.id === mach.id);
      if (exists) return prev.filter((m) => m.id !== mach.id);
      return [...prev, { id: mach.id, name: mach.name, image: mach.image }];
    });
  };

  // Fix drawer scroll: lock body when open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!menuId) return;
    setLoading(true);
    setSummary(null);

    const params = {
      returnCacheData: useCache,
    };
    if (activeStateId && !cart) params.stateId = activeStateId;
    if (cart?.id) params.kioskId = cart.id;

    api
      .get(`/vendor/menu/${menuId}/summary`, { params })
      .then((r) => setSummary(r.data.data))
      .catch(() => toast.error("Failed to load menu details"))
      .finally(() => setLoading(false));
  }, [menuId, useCache, activeStateId, cart]);

  useEffect(() => {
    if (cart && menuId) {
      setSettingsLoading(true);
      api.get(`/kiosk/${cart.id}/menu/${menuId}/settings`)
        .then(r => {
          if (r.data.data) {
            setMenuAvailable(r.data.data.available);
            setAvailableVariants(r.data.data.availableVariants || []);
          } else {
            setMenuAvailable(true);
            setAvailableVariants((summary?.variants || []).map(v => v.id));
          }
        })
        .catch(() => { })
        .finally(() => setSettingsLoading(false));
    }
  }, [cart?.id, menuId, summary?.variants]);

  const fmt = (n) =>
    n != null
      ? Number(n).toLocaleString("en-NG", { maximumFractionDigits: 0 })
      : "—";

  const TABS = [
    { key: "overview", label: "Overview", icon: MdInfoOutline },
    ...(cart ? [{ key: "settings", label: "Kiosk Settings", icon: MdSettings }] : []),
    { key: "costing", label: "Live Costing", icon: MdAttachMoney },
    { key: "machinery", label: "Tools", icon: MdBuild },
    { key: "consumables", label: "Consumables", icon: MdOutlineInventory2 },
    { key: "ingredients", label: "Ingredients", icon: MdRestaurantMenu },
    { key: "preps", label: "Prep Items", icon: MdAccessTime },
    { key: "sops", label: "SOPs", icon: MdMenuBook },
  ];

  const item = summary?.menuItem || summary;
  const concept = summary?.concept || {};
  const machineries = summary?.machineries || [];
  const consumables = summary?.consumables || [];
  const ingredients = summary?.ingredients || [];
  const prepItems = summary?.prepItems || [];
  const sops = summary?.sops || item?.sops || [];
  const recipe = summary?.recipe || item?.recipe || [];
  const displayPackaging = item?.packaging || concept?.packaging;
  const displayPackagingImage = item?.packagingImage || concept?.packagingImage;
  const displayServeTo = item?.serveTo || concept?.serveTo;
  const displayOrigin = item?.origin || concept?.origin;
  const displayDescription = item?.description || concept?.description;
  const baseCost = summary?.baseCost;

  const atLimit = selectedCount >= MAX_MENU_ITEMS && !isSelected;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1400,
          display: "flex",
          alignItems: "stretch",
          justifyContent: "flex-end",
        }}
      >
        <div
          onClick={onClose}
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
            width: "min(680px, 100vw)",
            background: "var(--bg-card)",
            display: "flex",
            flexDirection: "column",
            boxShadow: "-8px 0 40px rgba(0,0,0,0.25)",
            height: "100vh",
            overflowY: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 2,
              background: "var(--bg-card)",
              borderBottom: "1px solid var(--border)",
              padding: "18px 24px",
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexShrink: 0,
            }}
          >
            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: "var(--bg-hover)",
                border: "1px solid var(--border)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                flexShrink: 0,
              }}
            >
              <MdArrowBack size={16} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "1rem",
                  fontWeight: 900,
                  color: "var(--text-heading)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {menuName}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Menu item details
              </div>
            </div>
            {onToggleSelect ? <button
              onClick={onToggleSelect}
              disabled={atLimit}
              style={{
                height: 38,
                padding: "0 18px",
                borderRadius: 10,
                cursor: atLimit ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                fontWeight: 800,
                fontSize: "0.82rem",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                transition: "all 0.15s",
                border: `1.5px solid ${isSelected ? "rgba(34,197,94,0.5)" : atLimit ? "var(--border)" : "rgba(203,108,220,0.4)"}`,
                background: isSelected
                  ? "rgba(34,197,94,0.1)"
                  : atLimit
                    ? "var(--bg-hover)"
                    : "var(--bg-active)",
                color: isSelected
                  ? "#16a34a"
                  : atLimit
                    ? "var(--text-muted)"
                    : "var(--accent)",
                opacity: atLimit ? 0.5 : 1,
              }}
            >
              {isSelected ? (
                <>
                  <MdCheck size={15} /> Selected
                </>
              ) : atLimit ? (
                "Limit reached"
              ) : (
                <>
                  <MdAdd size={15} /> Select
                </>
              )}
            </button> : null}
          </div>

          {/* Tab bar */}
          <Tabs
            tabs={TABS}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {/* Scrollable content */}
          <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: 24 }}>
                <div className="skeleton_shimmer skeleton_rect" style={{ height: 180, borderRadius: 12 }} />
              </div>
            ) : !summary ? (
              <div className="kiosk_empty_inline" style={{ padding: "48px 0" }}>
                <MdRestaurantMenu size={28} style={{ opacity: 0.25 }} />
                <span>No details available</span>
              </div>
            ) : (
              <>
                {activeTab === "settings" && (
                  <div>
                    <div
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        padding: "18px 20px",
                        marginBottom: 20,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-heading)" }}>
                            Menu Item Availability
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                            Turn this menu item on or off for this kiosk. When off, customers cannot order it.
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            const newVal = !menuAvailable;
                            setMenuAvailable(newVal);
                            try {
                              await api.patch(`/kiosk/${cart.id}/menu/${menuId}/available`, { available: newVal });
                              toast.success(`Menu is now ${newVal ? "available" : "unavailable"}`);
                            } catch (err) {
                              setMenuAvailable(!newVal);
                              toast.error("Failed to update availability");
                            }
                          }}
                          style={{
                            height: 32,
                            padding: "0 14px",
                            borderRadius: 8,
                            border: "1px solid var(--border)",
                            background: menuAvailable ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                            color: menuAvailable ? "#16a34a" : "#ef4444",
                            fontWeight: 800,
                            fontSize: "0.78rem",
                            cursor: "pointer",
                          }}
                        >
                          {menuAvailable ? "Available" : "Unavailable"}
                        </button>
                      </div>
                    </div>

                    {summary?.variants?.length > 0 && (
                      <div
                        style={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: 14,
                          padding: "18px 20px",
                        }}
                      >
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-heading)" }}>
                            Available Variants
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>
                            Enable or disable specific variants for this kiosk.
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {summary.variants.map((v) => {
                            const isEnabled = availableVariants.includes(v.id);
                            return (
                              <div
                                key={v.id}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  padding: "10px 12px",
                                  background: "var(--bg-hover)",
                                  border: "1px solid var(--border)",
                                  borderRadius: 10,
                                }}
                              >
                                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-body)" }}>
                                  {v.name || v.prepItem?.name}
                                </span>
                                <button
                                  onClick={async () => {
                                    let newVariants;
                                    if (isEnabled) {
                                      newVariants = availableVariants.filter(id => id !== v.id);
                                    } else {
                                      newVariants = [...availableVariants, v.id];
                                    }
                                    setAvailableVariants(newVariants);
                                    try {
                                      await api.patch(`/kiosk/${cart.id}/menu/${menuId}/variants`, {
                                        availableVariants: newVariants,
                                      });
                                      toast.success("Variants updated");
                                    } catch (err) {
                                      setAvailableVariants(availableVariants);
                                      toast.error("Failed to update variants");
                                    }
                                  }}
                                  style={{
                                    height: 28,
                                    padding: "0 10px",
                                    borderRadius: 6,
                                    border: "1px solid var(--border)",
                                    background: isEnabled ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                                    color: isEnabled ? "#16a34a" : "#ef4444",
                                    fontWeight: 700,
                                    fontSize: "0.74rem",
                                    cursor: "pointer",
                                  }}
                                >
                                  {isEnabled ? "Enabled" : "Disabled"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "costing" && (
                  <div>
                    {/* Controls Row (State Selector & Cache Toggle) */}
                    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                      {/* State Selector */}
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 6,
                          }}
                        >
                          State (Supplier Price Reference)
                        </label>
                        <select
                          value={analysisStateId}
                          onChange={(e) => setAnalysisStateId(e.target.value)}
                          style={{
                            width: "100%",
                            height: 38,
                            borderRadius: 8,
                            background: "var(--bg-hover)",
                            border: "1px solid var(--border)",
                            color: "var(--text-heading)",
                            padding: "0 10px",
                            fontFamily: "inherit",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            outline: "none",
                            cursor: "pointer",
                          }}
                        >
                          <option value="">Select State</option>
                          {states.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cache toggle */}
                      <div style={{ flex: "0 0 auto" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 6,
                          }}
                        >
                          Live Prices
                        </label>
                        <button
                          type="button"
                          className={`overview_cache_toggle ${!useCache ? "overview_cache_toggle_active" : ""}`}
                          onClick={() => setUseCache((v) => !v)}
                          style={{ height: 38, width: 64, display: "flex", alignItems: "center", justifyContent: "center" }}
                          title={
                            useCache
                              ? "Using cached prices — click for live"
                              : "Using live prices"
                          }
                        >
                          <span className="overview_cache_knob" />
                        </button>
                      </div>
                    </div>

                    {/* Markup slider */}
                    <div className="overview_markup_row" style={{ marginBottom: 20 }}>
                      <div className="overview_markup_header">
                        <span className="overview_markup_label">Markup</span>
                        <span className="overview_markup_value">{markup}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        step={10}
                        max={1000}
                        value={markup}
                        onChange={(e) => setMarkup(Number(e.target.value))}
                        className="overview_markup_slider"
                      />
                      <div className="overview_markup_hints">
                        <span>0%</span>
                        <span>500%</span>
                        <span>1000%</span>
                      </div>
                    </div>

                    {/* Comparative Analytics Chart */}
                    <div
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        padding: "16px 18px",
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          color: "var(--text-heading)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: 14,
                        }}
                      >
                        Cost vs. Selling Price Chart
                      </div>

                      {calcLoading ? (
                        <div style={{ padding: "20px 0", textAlign: "center" }}>
                          <div className="page_loader_spinner" style={{ margin: "0 auto", width: 24, height: 24 }} />
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8 }}>
                            Calculating recipe costs...
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          {/* Base Menu bar */}
                          {calculatedCosts.base != null && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem" }}>
                                <span style={{ fontWeight: 700, color: "var(--text-body)" }}>{menuName} (Base)</span>
                                <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                                  Cost: <strong style={{ color: "var(--text-heading)" }}>{formatCost(calculatedCosts.base)}</strong> · Price: <strong style={{ color: "var(--accent)" }}>{formatCost(calcSellingPrice(calculatedCosts.base))}</strong>
                                </span>
                              </div>
                              <div style={{ height: 16, background: "var(--bg-hover)", borderRadius: 8, overflow: "hidden", display: "flex" }}>
                                <div
                                  style={{
                                    height: "100%",
                                    background: "linear-gradient(90deg, #a855f7, #c084fc)",
                                    width: `${Math.min(100, (calculatedCosts.base / calcSellingPrice(calculatedCosts.base)) * 100)}%`,
                                    transition: "width 0.3s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    paddingRight: 6,
                                    fontSize: "0.58rem",
                                    fontWeight: 900,
                                    color: "#fff",
                                  }}
                                >
                                  {calcCostPct(calculatedCosts.base)}% Cost
                                </div>
                                <div
                                  style={{
                                    flex: 1,
                                    height: "100%",
                                    background: "rgba(34, 197, 94, 0.15)",
                                    display: "flex",
                                    alignItems: "center",
                                    paddingLeft: 6,
                                    fontSize: "0.58rem",
                                    fontWeight: 900,
                                    color: "#16a34a",
                                  }}
                                >
                                  +{markup}% Margin
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Variants bars */}
                          {(summary?.variants || []).map((variant) => {
                            const varCost = calculatedCosts.variants[variant.id];
                            if (varCost == null) return null;
                            const varSellingPrice = calcSellingPrice(varCost);
                            const varCostPct = calcCostPct(varCost);
                            return (
                              <div key={variant.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem" }}>
                                  <span style={{ fontWeight: 700, color: "var(--text-body)" }}>{menuName} ({variant.name})</span>
                                  <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>
                                    Cost: <strong style={{ color: "var(--text-heading)" }}>{formatCost(varCost)}</strong> · Price: <strong style={{ color: "var(--accent)" }}>{formatCost(varSellingPrice)}</strong>
                                  </span>
                                </div>
                                <div style={{ height: 16, background: "var(--bg-hover)", borderRadius: 8, overflow: "hidden", display: "flex" }}>
                                  <div
                                    style={{
                                      height: "100%",
                                      background: "linear-gradient(90deg, #a855f7, #c084fc)",
                                      width: `${Math.min(100, (varCost / varSellingPrice) * 100)}%`,
                                      transition: "width 0.3s ease",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "flex-end",
                                      paddingRight: 6,
                                      fontSize: "0.58rem",
                                      fontWeight: 900,
                                      color: "#fff",
                                    }}
                                  >
                                    {varCostPct}% Cost
                                  </div>
                                  <div
                                    style={{
                                      flex: 1,
                                      height: "100%",
                                      background: "rgba(34, 197, 94, 0.15)",
                                      display: "flex",
                                      alignItems: "center",
                                      paddingLeft: 6,
                                      fontSize: "0.58rem",
                                      fontWeight: 900,
                                      color: "#16a34a",
                                    }}
                                  >
                                    +{markup}% Margin
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {calculatedCosts.base == null && Object.keys(calculatedCosts.variants).length === 0 && (
                            <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)", padding: "10px 0" }}>
                              No calculated price data. Configure suppliers in {selectedState?.name || "the active state"}.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Prep Items Cost Contribution Bar Graph */}
                    <div
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 14,
                        padding: "16px 18px",
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          color: "var(--text-heading)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: 16,
                        }}
                      >
                        Prep Item Cost Contribution Graph
                      </div>
                      {(() => {
                        const prepContributions = (summary?.prepItems || [])
                          .map((prep) => {
                            const qty = prep.usedIn?.reduce((sum, u) => sum + (u.quantity || 0), 0) || 0;
                            const costPerUnit = prep.cost || 0;
                            const totalCostVal = qty * costPerUnit;
                            return { ...prep, qty, costPerUnit, totalCostVal };
                          })
                          .filter((x) => x.totalCostVal > 0)
                          .sort((a, b) => b.totalCostVal - a.totalCostVal);

                        if (prepContributions.length === 0) {
                          return (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "10px 0" }}>
                              No prep item cost data available to graph.
                            </div>
                          );
                        }

                        const maxCost = Math.max(...prepContributions.map((x) => x.totalCostVal), 1);

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {prepContributions.map((prep) => {
                              const pct = (prep.totalCostVal / maxCost) * 100;
                              return (
                                <div key={prep.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                                    <span style={{ fontWeight: 600, color: "var(--text-body)" }}>
                                      {prep.name} <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>({prep.qty.toFixed(3)} {prep.unit || "unit"})</span>
                                    </span>
                                    <span style={{ fontWeight: 700, color: "var(--text-heading)" }}>
                                      {formatCost(prep.totalCostVal)}
                                    </span>
                                  </div>
                                  <div style={{ height: 8, width: "100%", background: "var(--bg-hover)", borderRadius: 4, overflow: "hidden" }}>
                                    <div
                                      style={{
                                        height: "100%",
                                        background: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
                                        width: `${pct}%`,
                                        borderRadius: 4,
                                        transition: "width 0.3s ease",
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Ingredient & Extra Cost Contribution Graphs by Combination */}
                    <div style={{ marginBottom: 20 }}>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 800,
                          color: "var(--text-heading)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: 14,
                        }}
                      >
                        Ingredient & Extra Cost Contribution Graph
                      </div>
                      {(() => {
                        const combos = getCombinationsList();
                        console.log('ComBOS', combos)

                        if (combos.length === 0) {
                          return (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "10px 0" }}>
                              No ingredient cost data available to graph.
                            </div>
                          );
                        }

                        return (
                          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {combos.map((combo) => {
                              const comboData = getComboData(combo);
                              const isExpanded = expandedCombo === combo.key;
                              const sellingPrice = calcSellingPrice(comboData.totalCost);
                              const profit = calcProfit(comboData.totalCost);

                              return (
                                <div
                                  key={combo.key}
                                  style={{
                                    background: "var(--bg-card)",
                                    border: "1px solid var(--border)",
                                    borderRadius: 14,
                                    padding: "16px 18px",
                                    transition: "all 0.2s ease",
                                  }}
                                >
                                  {/* Header */}
                                  <div
                                    onClick={() => setExpandedCombo(isExpanded ? null : combo.key)}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      cursor: "pointer",
                                    }}
                                  >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div
                                        style={{
                                          fontSize: "0.82rem",
                                          fontWeight: 800,
                                          color: isExpanded ? "var(--accent)" : "var(--text-heading)",
                                          transition: "color 0.2s ease",
                                        }}
                                      >
                                        {combo.name}
                                      </div>

                                      {/* Mini summary row */}
                                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6, fontSize: "0.72rem", color: "var(--text-muted)", flexWrap: "wrap" }}>
                                        {comboData.totalCost != null ? (
                                          <>
                                            <span>
                                              Cost: <strong style={{ color: "var(--text-heading)", fontWeight: 700 }}>{formatCost(comboData.totalCost)}</strong>
                                            </span>
                                            <span style={{ opacity: 0.3 }}>•</span>
                                            <span>
                                              Price: <strong style={{ color: "var(--accent)", fontWeight: 700 }}>{formatCost(sellingPrice)}</strong>
                                            </span>
                                            <span style={{ opacity: 0.3 }}>•</span>
                                            <span>
                                              Profit: <strong style={{ color: "var(--text-success, #16a34a)", fontWeight: 700 }}>{formatCost(profit)}</strong>
                                            </span>
                                          </>
                                        ) : (
                                          <span style={{ color: "var(--text-warning, #eab308)", fontSize: "0.68rem", fontWeight: 700 }}>
                                            ⚠ Cost unavailable
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div
                                      style={{
                                        color: "var(--text-muted)",
                                        marginLeft: 12,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: 24,
                                        height: 24,
                                        borderRadius: "50%",
                                        background: "var(--bg-hover)",
                                      }}
                                    >
                                      {isExpanded ? <MdExpandLess size={18} /> : <MdExpandMore size={18} />}
                                    </div>
                                  </div>

                                  {/* Expanded content */}
                                  {isExpanded && (
                                    <div
                                      style={{
                                        marginTop: 16,
                                        paddingTop: 16,
                                        borderTop: "1px solid var(--border)",
                                      }}
                                    >
                                      {comboData.items.length === 0 ? (
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", padding: "10px 0" }}>
                                          No ingredient or extra cost data available for this combination.
                                        </div>
                                      ) : (
                                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                          {comboData.items.map((item) => {
                                            const pct = comboData.totalCost ? (item.totalCostVal / comboData.totalCost) * 100 : 0;
                                            return (
                                              <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                                                  <span style={{ fontWeight: 600, color: "var(--text-body)" }}>
                                                    {item.name}{" "}
                                                    <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                                                      ({item.qty.toFixed(2)} {item.unit})
                                                    </span>
                                                    {item.type === "extra" && (
                                                      <span
                                                        style={{
                                                          marginLeft: 6,
                                                          fontSize: "0.62rem",
                                                          fontWeight: 800,
                                                          padding: "1px 5px",
                                                          borderRadius: 4,
                                                          background: "var(--bg-active)",
                                                          color: "var(--accent)",
                                                          border: "1px solid rgba(203,108,220,0.2)",
                                                        }}
                                                      >
                                                        EXTRA
                                                      </span>
                                                    )}
                                                  </span>
                                                  <span style={{ fontWeight: 700, color: "var(--text-heading)" }}>
                                                    {formatCost(item.totalCostVal)}
                                                  </span>
                                                </div>
                                                <div style={{ height: 8, width: "100%", background: "var(--bg-hover)", borderRadius: 4, overflow: "hidden" }}>
                                                  <div
                                                    style={{
                                                      height: "100%",
                                                      background: item.type === "extra"
                                                        ? "linear-gradient(90deg, #ec4899 0%, #f472b6 100%)"
                                                        : "linear-gradient(90deg, #a855f7 0%, var(--accent) 100%)",
                                                      width: `${pct}%`,
                                                      borderRadius: 4,
                                                      transition: "width 0.3s ease",
                                                    }}
                                                  />
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Detailed Ingredients Cost Breakdown */}
                    <div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          marginBottom: 12,
                        }}
                      >
                        Recipe Ingredient Breakdown
                      </div>
                      {summary?.ingredients?.length === 0 ? (
                        <div style={{ padding: 14, background: "var(--bg-hover)", borderRadius: 12, fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center" }}>
                          No ingredients found in the menu recipe.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {summary.ingredients.map((ing) => {
                            const hasCost = ing.cost != null;
                            const totalIngCost = hasCost ? ing.totalQuantity * ing.cost : null;
                            return (
                              <div
                                key={ing.id}
                                style={{
                                  background: "var(--bg-hover)",
                                  border: "1px solid var(--border)",
                                  borderRadius: 12,
                                  padding: "12px 14px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                }}
                              >
                                {ing.image ? (
                                  <img
                                    src={ing.image}
                                    alt=""
                                    style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: 8,
                                      background: "var(--bg-card)",
                                      border: "1px solid var(--border)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "var(--text-muted)",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <MdOutlineInventory2 size={16} />
                                  </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-body)" }}>
                                    {ing.name}
                                  </div>
                                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                                    Qty: <strong style={{ color: "var(--text-heading)" }}>{ing.totalQuantity?.toFixed(3)} {ing.unit}</strong>
                                    {hasCost && (
                                      <>
                                        {" · "}Price: <strong>{formatCost(ing.cost)} / {ing.unit}</strong>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div style={{ textAlign: "right", flexShrink: 0 }}>
                                  {hasCost ? (
                                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--accent)" }}>
                                      {formatCost(totalIngCost)}
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                      Price missing
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "overview" && (
                  <div>
                    {item?.image && (
                      <div
                        style={{
                          position: "relative",
                          borderRadius: 16,
                          overflow: "hidden",
                          marginBottom: 20,
                        }}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: "100%",
                            height: 200,
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            inset: 0,
                            background:
                              "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7))",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            bottom: 16,
                            left: 18,
                            right: 18,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.2rem",
                              fontWeight: 900,
                              color: "#fff",
                              marginBottom: 4,
                            }}
                          >
                            {item.name}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            {item.ticketTime > 0 && (
                              <span
                                style={{
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 5,
                                  background: "rgba(0,0,0,0.5)",
                                  color: "rgba(255,255,255,0.9)",
                                }}
                              >
                                ⏱ {item.ticketTime} min
                              </span>
                            )}
                            {displayServeTo && (
                              <span
                                style={{
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: 5,
                                  background: "rgba(0,0,0,0.5)",
                                  color: "rgba(255,255,255,0.9)",
                                }}
                              >
                                👥 {displayServeTo}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {summary?.vendor?.businessName && (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginBottom: 14,
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "4px 11px",
                            borderRadius: 999,
                            background: "var(--bg-hover)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          🏷 {summary.vendor.businessName}
                        </span>
                      </div>
                    )}
                    {displayDescription && (
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--text-muted)",
                          lineHeight: 1.65,
                          marginBottom: 20,
                        }}
                      >
                        {displayDescription}
                      </p>
                    )}

                    {/* Professional Financial Overview Widget */}
                    {(baseCost != null || item?.recipeCost != null) && (() => {
                      const costVal = baseCost ?? item?.recipeCost;
                      const priceVal = calcSellingPrice(costVal);
                      const profitVal = calcProfit(costVal);
                      const marginPct = calcCostPct(costVal);
                      return (
                        <div
                          style={{
                            background: "linear-gradient(135deg, var(--bg-hover) 0%, var(--bg-card) 100%)",
                            border: "1px solid var(--border)",
                            borderRadius: 16,
                            padding: "16px 20px",
                            marginBottom: 20,
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                              Financial Overview ({markup}% Markup)
                            </span>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 999,
                                background: "rgba(34, 197, 94, 0.15)",
                                color: "#22c55e",
                                border: "1px solid rgba(34, 197, 94, 0.25)",
                              }}
                            >
                              Healthy Margin
                            </span>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                            {/* Cost */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                                Cost Price
                              </span>
                              <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--text-heading)" }}>
                                ₦{fmt(costVal)}
                              </span>
                            </div>

                            {/* Selling Price */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                                Selling Price
                              </span>
                              <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "var(--accent)" }}>
                                ₦{fmt(priceVal)}
                              </span>
                            </div>

                            {/* Profit */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                                Est. Profit
                              </span>
                              <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#22c55e" }}>
                                ₦{fmt(profitVal)}
                              </span>
                            </div>
                          </div>

                          {/* Progress visual bar */}
                          <div style={{ height: 6, width: "100%", background: "var(--bg-hover)", borderRadius: 3, overflow: "hidden", display: "flex", marginTop: 4 }}>
                            <div style={{ height: "100%", background: "#a855f7", width: `${marginPct}%` }} title={`Cost: ${marginPct}%`} />
                            <div style={{ flex: 1, height: "100%", background: "#22c55e" }} title={`Profit: ${100 - marginPct}%`} />
                          </div>
                        </div>
                      );
                    })()}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(130px, 1fr))",
                        gap: 10,
                        marginBottom: 20,
                      }}
                    >
                      {(() => {
                        const costValLocal = baseCost ?? item?.recipeCost;
                        return [
                          {
                            label: "Selling Price",
                            value:
                              costValLocal != null
                                ? `₦${fmt(calcSellingPrice(costValLocal))}`
                                : item?.sellingPrice > 0
                                  ? `₦${fmt(item.sellingPrice)}`
                                  : null,
                            accent: true,
                          },
                          {
                            label: "Recipe Cost",
                            value:
                              baseCost != null
                                ? `₦${fmt(baseCost)}`
                                : item?.recipeCost > 0
                                  ? `₦${fmt(item.recipeCost)}`
                                  : null,
                          },
                          {
                            label: "Ticket Time",
                            value:
                              item?.ticketTime > 0
                                ? `${item.ticketTime} min`
                                : null,
                          },
                          { label: "Serves", value: displayServeTo || null },
                          { label: "Origin", value: displayOrigin || null },
                          {
                            label: "Ingredients",
                            value:
                              ingredients.length > 0
                                ? String(ingredients.length)
                                : null,
                          },
                          {
                            label: "Prep Items",
                            value:
                              prepItems.length > 0
                                ? String(prepItems.length)
                                : null,
                          },
                          {
                            label: "Tools",
                            value:
                              machineries.length > 0
                                ? String(machineries.length)
                                : null,
                          },
                        ];
                      })()
                        .filter((s) => s.value)
                        .map((s) => (
                          <div
                            key={s.label}
                            style={{
                              background: s.accent
                                ? "var(--bg-active)"
                                : "var(--bg-hover)",
                              border: `1px solid ${s.accent ? "rgba(203,108,220,0.2)" : "var(--border)"}`,
                              borderRadius: 12,
                              padding: "12px 14px",
                            }}
                          >
                            <div
                              style={{
                                license: "MIT",
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                marginBottom: 4,
                              }}
                            >
                              {s.label}
                            </div>
                            <div
                              style={{
                                fontSize: "0.95rem",
                                fontWeight: 900,
                                color: s.accent
                                  ? "var(--accent)"
                                  : "var(--text-heading)",
                              }}
                            >
                              {s.value}
                            </div>
                          </div>
                        ))}
                    </div>

                    {displayPackaging && (
                      <div
                        style={{
                          background: "var(--bg-hover)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          padding: "14px 16px",
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 8,
                          }}
                        >
                          Packaging
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "flex-start",
                          }}
                        >
                          {displayPackagingImage && (
                            <img
                              src={displayPackagingImage}
                              alt=""
                              style={{
                                width: 52,
                                height: 52,
                                borderRadius: 8,
                                objectFit: "cover",
                                flexShrink: 0,
                              }}
                            />
                          )}
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.82rem",
                              color: "var(--text-body)",
                              lineHeight: 1.6,
                            }}
                          >
                            {displayPackaging}
                          </p>
                        </div>
                      </div>
                    )}

                    {item?.tutorialVideo && (
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 8,
                          }}
                        >
                          Tutorial Video
                        </div>
                        {(() => {
                          const src = item.tutorialVideo;
                          const vimeoMatch = src.match(/vimeo\.com\/(\d+)/);
                          const ytMatch = src.match(
                            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
                          );
                          const embedUrl = vimeoMatch
                            ? `https://player.vimeo.com/video/${vimeoMatch[1]}`
                            : ytMatch
                              ? `https://www.youtube.com/embed/${ytMatch[1]}`
                              : null;
                          return embedUrl ? (
                            <div
                              style={{
                                position: "relative",
                                width: "100%",
                                aspectRatio: "16/9",
                                borderRadius: 12,
                                overflow: "hidden",
                              }}
                            >
                              <iframe
                                src={embedUrl}
                                allow="autoplay; fullscreen"
                                allowFullScreen
                                style={{
                                  position: "absolute",
                                  inset: 0,
                                  width: "100%",
                                  height: "100%",
                                  border: "none",
                                }}
                                title="Tutorial Video"
                              />
                            </div>
                          ) : (
                            <video
                              src={src}
                              controls
                              style={{
                                width: "100%",
                                borderRadius: 12,
                                maxHeight: 260,
                              }}
                            />
                          );
                        })()}
                      </div>
                    )}

                    {(summary?.variants || item?.variants)?.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 10,
                          }}
                        >
                          Variants
                        </div>
                        <div
                          style={{ display: "flex", gap: 6, flexWrap: "wrap" }}
                        >
                          {(summary?.variants || item?.variants).map((v, i) => (
                            <span
                              key={v.id || i}
                              style={{
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                padding: "6px 14px",
                                borderRadius: 999,
                                background: "var(--bg-hover)",
                                border: "1px solid var(--border)",
                                color: "var(--text-body)",
                              }}
                            >
                              {v.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {recipe.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: "0.62rem",
                            fontWeight: 700,
                            color: "var(--text-muted)",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            marginBottom: 10,
                          }}
                        >
                          Recipe Steps
                        </div>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0,
                          }}
                        >
                          {recipe.map((step, i) => {
                            const ing = step.ingredient || step.prepItem;
                            return (
                              <div
                                key={step.id || i}
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  padding: "10px 0",
                                  borderBottom: "1px solid var(--border)",
                                  alignItems: "center",
                                }}
                              >
                                <div
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: "50%",
                                    background: "var(--bg-active)",
                                    border: "1px solid rgba(203,108,220,0.3)",
                                    color: "var(--accent)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.62rem",
                                    fontWeight: 900,
                                    flexShrink: 0,
                                  }}
                                >
                                  {i + 1}
                                </div>
                                {ing?.image ? (
                                  <img
                                    src={ing.image}
                                    alt=""
                                    style={{
                                      width: 32,
                                      height: 32,
                                      borderRadius: 7,
                                      objectFit: "cover",
                                      flexShrink: 0,
                                    }}
                                  />
                                ) : null}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      fontSize: "0.82rem",
                                      fontWeight: 700,
                                      color: "var(--text-body)",
                                    }}
                                  >
                                    {ing?.name || step.type}
                                  </div>
                                  {step.quantity != null && (
                                    <div
                                      style={{
                                        fontSize: "0.68rem",
                                        color: "var(--accent)",
                                        fontWeight: 700,
                                      }}
                                    >
                                      {step.quantity}
                                      {ing?.unit || ""}
                                    </div>
                                  )}
                                  {step.instruction && (
                                    <div
                                      style={{
                                        fontSize: "0.72rem",
                                        color: "var(--text-muted)",
                                        marginTop: 2,
                                      }}
                                    >
                                      {step.instruction}
                                    </div>
                                  )}
                                </div>
                                <span
                                  style={{
                                    fontSize: "0.65rem",
                                    fontWeight: 800,
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    background:
                                      step.type === "prep"
                                        ? "rgba(59,130,246,0.1)"
                                        : "rgba(34,197,94,0.1)",
                                    color:
                                      step.type === "prep"
                                        ? "#3b82f6"
                                        : "#16a34a",
                                    border: `1px solid ${step.type === "prep" ? "rgba(59,130,246,0.25)" : "rgba(34,197,94,0.25)"}`,
                                    flexShrink: 0,
                                  }}
                                >
                                  {step.type}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "machinery" && (
                  <div
                    style={{
                      paddingBottom: selectedMachIds.length > 0 ? 80 : 0,
                    }}
                  >
                    {machineries.length === 0 ? (
                      <div
                        className="kiosk_empty_inline"
                        style={{ padding: "40px 0" }}
                      >
                        <MdBuild size={26} style={{ opacity: 0.25 }} />
                        <span>No machineries listed</span>
                      </div>
                    ) : (
                      <>
                        {/* Hint text */}
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            marginBottom: 12,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <MdLocalShipping
                            size={13}
                            style={{ flexShrink: 0 }}
                          />
                          Tap the + on any item to add it to a supply request
                        </div>
                        {machineries.map((m, i) => {
                          const mach = m.machinery || m;
                          const isSel = selectedMachIds.some(
                            (s) => s.id === mach.id,
                          );
                          return (
                            <div
                              key={m.id || i}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                padding: "11px 12px",
                                borderRadius: 12,
                                marginBottom: 6,
                                background: isSel
                                  ? "var(--bg-active)"
                                  : "var(--bg-hover)",
                                border: `1.5px solid ${isSel ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                                transition: "all 0.12s",
                              }}
                            >
                              {mach.image ? (
                                <img
                                  src={mach.image}
                                  alt=""
                                  style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 10,
                                    objectFit: "cover",
                                    flexShrink: 0,
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 10,
                                    background: isSel
                                      ? "rgba(203,108,220,0.15)"
                                      : "var(--bg-card)",
                                    border: `1px solid ${isSel ? "rgba(203,108,220,0.3)" : "var(--border)"}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <MdBuild
                                    size={18}
                                    style={{
                                      color: isSel
                                        ? "var(--accent)"
                                        : "var(--text-muted)",
                                    }}
                                  />
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "0.88rem",
                                    fontWeight: 700,
                                    color: isSel
                                      ? "var(--accent)"
                                      : "var(--text-body)",
                                  }}
                                >
                                  {mach.name}
                                </div>
                                {mach.manufacturer && (
                                  <div
                                    style={{
                                      fontSize: "0.72rem",
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    {mach.manufacturer}
                                  </div>
                                )}
                              </div>
                              {m.quantity > 0 && (
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    color: "var(--text-muted)",
                                    flexShrink: 0,
                                  }}
                                >
                                  × {m.quantity}
                                </span>
                              )}
                              {/* Select for order button */}
                              {cart ? <button
                                onClick={() => toggleMachSelection(mach)}
                                title={
                                  isSel ? "Remove from order" : "Add to order"
                                }
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: `1px solid ${isSel ? "var(--accent)" : "var(--border)"}`,
                                  background: isSel
                                    ? "var(--accent)"
                                    : "var(--bg-card)",
                                  color: isSel ? "#fff" : "var(--text-muted)",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {isSel ? (
                                  <MdCheck size={15} />
                                ) : (
                                  <MdAdd size={15} />
                                )}
                              </button> : null}
                            </div>
                          );
                        })}
                      </>
                    )}

                    {/* Sticky bottom bar when items selected */}
                    {selectedMachIds.length > 0 && (
                      <div
                        style={{
                          position: "sticky",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: "12px 0 4px",
                          background:
                            "linear-gradient(to bottom, transparent, var(--bg-card) 30%)",
                        }}
                      >
                        <button
                          className="app_btn app_btn_confirm"
                          style={{
                            width: "100%",
                            height: 44,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            fontSize: "0.88rem",
                            fontWeight: 800,
                          }}
                          onClick={() => setShowMachSupply(true)}
                        >
                          <MdLocalShipping size={16} />
                          Request Supply · {selectedMachIds.length} item
                          {selectedMachIds.length !== 1 ? "s" : ""}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "consumables" && (
                  <div style={{ paddingBottom: selectedMachIds.length > 0 ? 80 : 0 }}>
                    {consumables.length === 0 ? (
                      <div className="kiosk_empty_inline" style={{ padding: "40px 0" }}>
                        <MdBuild size={26} style={{ opacity: 0.25 }} />
                        <span>No consumables listed</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                          <MdLocalShipping size={13} style={{ flexShrink: 0 }} />
                          Tap the + on any item to add it to a supply request
                        </div>
                        {consumables.map((c, i) => {
                          const mach = c.machinery || c;
                          const isSel = selectedMachIds.some((s) => s.id === mach.id);
                          return (
                            <div
                              key={c.id || i}
                              style={{
                                display: "flex", alignItems: "center", gap: 12,
                                padding: "11px 12px", borderRadius: 12, marginBottom: 6,
                                background: isSel ? "var(--bg-active)" : "var(--bg-hover)",
                                border: `1.5px solid ${isSel ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                                transition: "all 0.12s",
                              }}
                            >
                              {mach.image ? (
                                <img src={mach.image} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                              ) : (
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: isSel ? "rgba(203,108,220,0.15)" : "var(--bg-card)", border: `1px solid ${isSel ? "rgba(203,108,220,0.3)" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                  <MdBuild size={18} style={{ color: isSel ? "var(--accent)" : "var(--text-muted)" }} />
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: isSel ? "var(--accent)" : "var(--text-body)" }}>{mach.name}</div>
                                {mach.manufacturer && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{mach.manufacturer}</div>}
                              </div>
                              {c.quantity > 0 && (
                                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", flexShrink: 0 }}>
                                  x {c.quantity}
                                </span>
                              )}
                              {cart ? (
                                <button
                                  onClick={() => toggleMachSelection(mach)}
                                  title={isSel ? "Remove from order" : "Add to order"}
                                  style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${isSel ? "var(--accent)" : "var(--border)"}`, background: isSel ? "var(--accent)" : "var(--bg-card)", color: isSel ? "#fff" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                                >
                                  {isSel ? <MdCheck size={15} /> : <MdAdd size={15} />}
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </>
                    )}
                    {selectedMachIds.length > 0 && (
                      <div style={{ position: "sticky", bottom: 0, left: 0, right: 0, padding: "12px 0 4px", background: "linear-gradient(to bottom, transparent, var(--bg-card) 30%)" }}>
                        <button className="app_btn app_btn_confirm" style={{ width: "100%", height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: "0.88rem", fontWeight: 800 }} onClick={() => setShowMachSupply(true)}>
                          <MdLocalShipping size={16} />
                          Request Supply . {selectedMachIds.length} item{selectedMachIds.length !== 1 ? "s" : ""}
                        </button>
                      </div>
                    )}
                  </div>
                )}


                {activeTab === "ingredients" && (
                  <div
                    style={{
                      paddingBottom: selectedIngIds.length > 0 ? 80 : 0,
                    }}
                  >
                    {ingredients.length === 0 ? (
                      <div
                        className="kiosk_empty_inline"
                        style={{ padding: "40px 0" }}
                      >
                        <MdOutlineInventory2
                          size={26}
                          style={{ opacity: 0.25 }}
                        />
                        <span>No ingredients listed</span>
                      </div>
                    ) : (
                      <>
                        {/* Hint text */}
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            marginBottom: 12,
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <MdLocalShipping
                            size={13}
                            style={{ flexShrink: 0 }}
                          />
                          Tap the + on any item to add it to a supply request
                        </div>
                        {ingredients.map((ing, i) => {
                          const isSel = selectedIngIds.some(
                            (s) => s.id === ing.id,
                          );
                          return (
                            <div
                              key={ing.id || i}
                              style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: "11px 12px",
                                  borderRadius: 12,
                                  marginBottom: 6,
                                  background: isSel
                                    ? "var(--bg-active)"
                                    : "var(--bg-hover)",
                                  border: `1.5px solid ${isSel ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                                  transition: "all 0.12s",
                              }}
                            >
                              {ing.image ? (
                                <img
                                  src={ing.image}
                                  alt=""
                                  style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 10,
                                    objectFit: "cover",
                                    flexShrink: 0,
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 10,
                                    background: isSel
                                      ? "rgba(203,108,220,0.15)"
                                      : "var(--bg-card)",
                                    border: `1px solid ${isSel ? "rgba(203,108,220,0.3)" : "var(--border)"}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                  }}
                                >
                                  <MdOutlineInventory2
                                    size={18}
                                    style={{
                                      color: isSel
                                        ? "var(--accent)"
                                        : "var(--text-muted)",
                                    }}
                                  />
                                </div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "0.88rem",
                                    fontWeight: 700,
                                    color: isSel
                                      ? "var(--accent)"
                                      : "var(--text-body)",
                                  }}
                                >
                                  {ing.name}
                                </div>
                                {ing.unit && (
                                  <div
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    {ing.unit}
                                    {ing.totalQuantity != null &&
                                      ` · Total: ${ing.totalQuantity}${ing.unit}`}
                                  </div>
                                )}
                                {ing.usedIn?.length > 0 && (
                                  <div
                                    style={{
                                      fontSize: "0.68rem",
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    {ing.usedIn
                                      .map(
                                        (u) =>
                                          `${u.source}: ${u.quantity}${ing.unit || ""}`,
                                      )
                                      .join(" · ")}
                                  </div>
                                )}
                              </div>
                              {ing.cost != null && (
                                <div
                                  style={{ textAlign: "right", flexShrink: 0 }}
                                >
                                  <div
                                    style={{
                                      fontSize: "0.82rem",
                                      fontWeight: 800,
                                      color: "var(--text-heading)",
                                    }}
                                  >
                                    ₦{fmt(ing.cost)}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "0.65rem",
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    {ing.unit}
                                  </div>
                                </div>
                              )}
                              {/* Select for supply button */}
                              {cart ? <button
                                onClick={() => toggleIngSelection(ing)}
                                title={
                                  isSel ? "Remove from order" : "Add to order"
                                }
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  border: `1px solid ${isSel ? "var(--accent)" : "var(--border)"}`,
                                  background: isSel
                                    ? "var(--accent)"
                                    : "var(--bg-card)",
                                  color: isSel ? "#fff" : "var(--text-muted)",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                }}
                              >
                                {isSel ? (
                                  <MdCheck size={15} />
                                ) : (
                                  <MdAdd size={15} />
                                )}
                              </button> : null}
                            </div>
                          );
                        })}
                      </>
                    )}

                    {/* Sticky bottom bar when items selected */}
                    {selectedIngIds.length > 0 && (
                      <div
                        style={{
                          position: "sticky",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: "12px 0 4px",
                          background:
                            "linear-gradient(to bottom, transparent, var(--bg-card) 30%)",
                        }}
                      >
                        <button
                          className="app_btn app_btn_confirm"
                          style={{
                            width: "100%",
                            height: 44,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            fontSize: "0.88rem",
                            fontWeight: 800,
                          }}
                          onClick={() => setShowIngSupply(true)}
                        >
                          <MdLocalShipping size={16} />
                          Request Supply · {selectedIngIds.length} item
                          {selectedIngIds.length !== 1 ? "s" : ""}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "preps" && (
                  <div>
                    {prepItems.length === 0 ? (
                      <div
                        className="kiosk_empty_inline"
                        style={{ padding: "40px 0" }}
                      >
                        <MdRestaurantMenu size={26} style={{ opacity: 0.25 }} />
                        <span>No prep items listed</span>
                      </div>
                    ) : (
                      prepItems.map((prep, i) => (
                        <div
                          key={prep.id || i}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            padding: "12px 0",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          <div
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 10,
                              background:
                                "linear-gradient(135deg, rgba(203,108,220,0.15), rgba(203,108,220,0.05))",
                              border: "1px solid rgba(203,108,220,0.2)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {prep.image ? (
                              <img
                                src={prep.image}
                                alt={prep.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                  borderRadius: "inherit",
                                }}
                              />
                            ) : (
                              <MdRestaurantMenu
                                size={18}
                                style={{ color: "var(--accent)" }}
                              />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "0.88rem",
                                fontWeight: 700,
                                color: "var(--text-body)",
                              }}
                            >
                              {prep.name}
                            </div>
                            {prep.usedIn?.length > 0 && (
                              <div
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 4,
                                  marginTop: 4,
                                }}
                              >
                                {prep.usedIn.map((u, j) => (
                                  <span
                                    key={j}
                                    style={{
                                      fontSize: "0.62rem",
                                      padding: "1px 6px",
                                      borderRadius: 4,
                                      background:
                                        u.source === "extra"
                                          ? "rgba(168,85,247,0.1)"
                                          : "var(--bg-hover)",
                                      border: `1px solid ${u.source === "extra" ? "rgba(168,85,247,0.25)" : "var(--border)"}`,
                                      color:
                                        u.source === "extra"
                                          ? "#a855f7"
                                          : "var(--text-muted)",
                                    }}
                                  >
                                    {u.source} · {u.quantity}
                                    {prep.unit || ""}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {prep.cost != null && (
                            <div
                              style={{
                                fontSize: "0.82rem",
                                fontWeight: 800,
                                color: "var(--text-heading)",
                                flexShrink: 0,
                              }}
                            >
                              ₦{fmt(prep.cost)}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "sops" && (
                  <div>
                    {sops.length === 0 ? (
                      <div
                        className="kiosk_empty_inline"
                        style={{ padding: "40px 0" }}
                      >
                        <MdMenuBook size={26} style={{ opacity: 0.25 }} />
                        <span>No SOPs defined</span>
                      </div>
                    ) : (
                      sops.map((sop, i) => (
                        <div
                          key={sop.id || i}
                          style={{
                            background: "var(--bg-hover)",
                            border: "1px solid var(--border)",
                            borderRadius: 12,
                            padding: "14px 16px",
                            marginBottom: 10,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.88rem",
                              fontWeight: 800,
                              color: "var(--text-heading)",
                              marginBottom: 6,
                            }}
                          >
                            {sop.title || sop.name || `Step ${i + 1}`}
                          </div>
                          {sop.description && (
                            <p
                              style={{
                                margin: 0,
                                fontSize: "0.82rem",
                                color: "var(--text-muted)",
                                lineHeight: 1.65,
                              }}
                            >
                              {sop.description}
                            </p>
                          )}
                          {sop.steps?.length > 0 && (
                            <ol style={{ margin: "10px 0 0", paddingLeft: 20 }}>
                              {sop.steps.map((step, j) => (
                                <li
                                  key={j}
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "var(--text-body)",
                                    lineHeight: 1.6,
                                    marginBottom: 4,
                                  }}
                                >
                                  {step}
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Machinery Supply Request Drawer ── */}
      <MachinerySupplyModal
        isOpen={showMachSupply}
        cart={cart}
        selectedMachItems={selectedMachIds}
        onClose={() => setShowMachSupply(false)}
        onSubmitted={() => {
          setShowMachSupply(false);
          setSelectedMachIds([]);
          toast.success("Supply request created!");
        }}
      />

      {/* ── Ingredient Supply Request Drawer ── */}
      <IngredientSupplyModal
        isOpen={showIngSupply}
        cart={cart}
        selectedIngItems={selectedIngIds}
        onClose={() => setShowIngSupply(false)}
        onSubmitted={() => {
          setShowIngSupply(false);
          setSelectedIngIds([]);
          toast.success("Ingredient supply request created!");
        }}
      />
    </>
  );
}
