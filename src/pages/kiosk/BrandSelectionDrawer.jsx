import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { MdClose, MdSignalCellularAlt, MdArrowForward } from "react-icons/md";
import api from "../../api/axios";
import ESignDrawer from "../../components/ESignDrawer";
import InvoicePayModal from "./InvoicePayModal";
import { MenuDetailDrawer } from "./MenuDetailDrawer";

const MAX_MENU_ITEMS = 5;

const DEFAULT_VENDOR_AGREEMENT = `
<h2 style="text-align: center; margin-bottom: 20px;">NORA AI PLATFORM<br/>KIOSK VENDOR LICENSE AGREEMENT</h2>
 
<p>This License Agreement is entered into on the <strong>{{ date }}</strong> between NORA AI LTD., hereinafter referred to as "the Licensor" on the one part and <strong>{{ buyer_name }}</strong>, hereinafter referred to as "the Licensee" (collectively, the "Parties") for the operation of brand concept menus on Kiosk Unit <strong>{{ kiosk_serial }}</strong> located at <strong>{{ buyer_address }}</strong>.</p>

<h3>1. LICENSE AND KIOSK DEPLOYMENT</h3>
<p>The Licensor grants to the Licensee a limited, non-exclusive, non-transferable license to deploy and operate the selected food brand concepts on the designated Kiosk unit.</p>

<h3>2. FEES AND PAYMENTS</h3>
<p>The Licensee shall pay the fees described in the vendor application settings: total initialization of {{ currency }} {{ purchase_price }}. All payments are non-refundable unless specified otherwise.</p>

<h3>3. COMPLIANCE</h3>
<p>The Licensee shall ensure that operation complies with all local food safety regulations and platform operating standards.</p>

<h3>4. TERMINATION</h3>
<p>Either party may terminate this license with 30 days written notice. Upon termination, the Licensee's rights to operate the food concepts on the Kiosk shall cease.</p>
`;

export default function BrandSelectionDrawer({ cart, onClose, onDone }) {
  const [view, setView] = useState("brands");

  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandSearch, setBrandSearch] = useState("");

  const [expandedBrandId, setExpandedBrandId] = useState(null);
  const [brandMenus, setBrandMenus] = useState({});

  const [selectedBrandId, setSelectedBrandId] = useState(null);
  const [selectedMenuIds, setSelectedMenuIds] = useState([]);

  const [detailMenuId, setDetailMenuId] = useState(null);
  const [detailMenuName, setDetailMenuName] = useState("");

  // Available slots state
  const [availableSlots, setAvailableSlots] = useState(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [termsData, setTermsData] = useState(null);
  const [termsLoading, setTermsLoading] = useState(false);
  const [showSignDrawer, setShowSignDrawer] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  // Fix drawer scroll: lock body when open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const fmt = (n) =>
    Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 });

  // Per-brand slot counts
  const [brandSlots, setBrandSlots] = useState({});

  // Fetch slots for all loaded brands
  useEffect(() => {
    const lat = cart.location?.latitude;
    const lng = cart.location?.longitude;
    const stateId = cart.location?.stateId || cart.location?.state?.id;
    if (!lat || !lng || brands.length === 0) return;

    setSlotsLoading(true);
    const baseParams = [`lat=${lat}`, `lng=${lng}`];
    if (stateId) baseParams.push(`stateId=${stateId}`);

    // Fetch global slots
    api
      .get(`/kiosk/available-slots?${baseParams.join("&")}`)
      .then((r) => {
        const slots = r.data?.data?.slots;
        setAvailableSlots(slots != null ? Number(slots) : null);
      })
      .catch(() => setAvailableSlots(null))
      .finally(() => setSlotsLoading(false));

    // Fetch per-brand slots
    Promise.allSettled(
      brands.map((brand) =>
        api
          .get(
            `/kiosk/available-slots?${baseParams.join("&")}&vendorId=${brand.id}`,
          )
          .then((r) => ({ id: brand.id, slots: r.data?.data?.slots }))
          .catch(() => ({ id: brand.id, slots: null })),
      ),
    ).then((results) => {
      const map = {};
      results.forEach((r) => {
        if (r.status === "fulfilled")
          map[r.value.id] =
            r.value.slots != null ? Number(r.value.slots) : null;
      });
      setBrandSlots(map);
    });
  }, [brands, cart.location]);

  useEffect(() => {
    api
      .get("/vendor/profile")
      .then((r) => {
        const d = r.data.data;
        setBrands(d?.vendors || (Array.isArray(d) ? d : []));
      })
      .catch(() => toast.error("Failed to load brands"))
      .finally(() => setBrandsLoading(false));
  }, []);

  const loadBrandMenus = async (brandId) => {
    if (brandMenus[brandId]) return;
    setBrandMenus((p) => ({ ...p, [brandId]: { loading: true, items: [] } }));
    try {
      const r = await api.get(
        `/vendor/menu?vendorId=${brandId}&page=1&limit=100`,
      );
      const d = r.data.data;
      const items =
        d?.items || (Array.isArray(d) ? d : d?.menuItems || d?.data || []);
      setBrandMenus((p) => ({ ...p, [brandId]: { loading: false, items } }));
    } catch {
      setBrandMenus((p) => ({
        ...p,
        [brandId]: { loading: false, items: [] },
      }));
    }
  };

  const toggleBrand = (brandId) => {
    if (expandedBrandId === brandId) {
      setExpandedBrandId(null);
      return;
    }
    setExpandedBrandId(brandId);
    loadBrandMenus(brandId);
  };

  const toggleMenu = (menuId, brandId) => {
    if (selectedBrandId && selectedBrandId !== brandId) {
      setSelectedBrandId(brandId);
      setSelectedMenuIds([menuId]);
      return;
    }
    setSelectedBrandId(brandId);
    setSelectedMenuIds((prev) => {
      if (prev.includes(menuId)) return prev.filter((id) => id !== menuId);
      if (prev.length >= MAX_MENU_ITEMS) {
        toast.error(`Max ${MAX_MENU_ITEMS} items`);
        return prev;
      }
      return [...prev, menuId];
    });
  };

  useEffect(() => {
    if (view !== "financials") return;
    const country = cart.location?.country || "";
    if (!country) return;
    setTermsLoading(true);
    api
      .get(
        `/kioskVendorApplication/settings/country/${encodeURIComponent(country)}`,
      )
      .then((r) => setTermsData(r.data.data))
      .catch((err) =>
        toast.error(err.response?.data?.message || "No brand settings found"),
      )
      .finally(() => setTermsLoading(false));
  }, [view, cart.location]);

  const handleConfirm = async () => {
    if (!selectedBrandId) {
      toast.error("Select a brand first");
      return;
    }
    setShowSignDrawer(true);
  };

  const handleSignSubmit = async ({ signatureName, terms, isSigned }) => {
    setConfirming(true);
    setShowSignDrawer(false);
    try {
      const res = await api.post(`/kiosk/${cart.id}/change-vendor`, {
        vendorId: selectedBrandId,
        menuIds: selectedMenuIds,
        signatureName,
        terms,
        isSigned,
      });
      const data = res.data.data;
      if (data?.invoice) {
        setInvoiceData({
          invoice: data.invoice,
          application: data.application,
        });
      } else {
        toast.success("Brand and menu items set!");
        onDone();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set brand");
    } finally {
      setConfirming(false);
    }
  };

  const handlePaid = async () => {
    if (selectedMenuIds.length > 0) {
      try {
        await api.post(`/kiosk/${cart.id}/menu-items`, {
          items: selectedMenuIds.map((id) => ({ id, markup: 0 })),
        });
      } catch {
        /* silent */
      }
    }
    setInvoiceData(null);
    toast.success("Brand confirmed!");
    onDone();
  };

  const filteredBrands = brands.filter(
    (b) =>
      !brandSearch.trim() ||
      b.businessName?.toLowerCase().includes(brandSearch.toLowerCase()) ||
      (b.brandTagline || b.branding?.tagline)
        ?.toLowerCase()
        .includes(brandSearch.toLowerCase()),
  );

  const selectedBrand = brands.find((b) => b.id === selectedBrandId);

  if (invoiceData) {
    return (
      <InvoicePayModal
        invoice={invoiceData.invoice}
        application={invoiceData.application}
        onPaid={handlePaid}
        onClose={() => setInvoiceData(null)}
      />
    );
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1300,
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
            width: "min(720px, 100vw)",
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
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <button
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
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
              <MdClose size={16} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 900,
                  color: "var(--text-heading)",
                }}
              >
                {view === "financials" ? "Financials & Terms" : "Choose Brand"}
              </div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                {view === "financials"
                  ? `${selectedBrand?.businessName} · ${selectedMenuIds.length} item${selectedMenuIds.length !== 1 ? "s" : ""} selected`
                  : `${selectedMenuIds.length}/${MAX_MENU_ITEMS} menus selected${selectedBrand ? ` from ${selectedBrand.businessName}` : ""}`}
              </div>
            </div>

            {/* Available slots indicator */}
            {view === "brands" && cart.location?.latitude && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: 8,
                  background:
                    availableSlots === 0
                      ? "rgba(239,68,68,0.08)"
                      : availableSlots != null && availableSlots <= 2
                        ? "rgba(234,179,8,0.08)"
                        : "rgba(34,197,94,0.08)",
                  border: `1px solid ${availableSlots === 0
                    ? "rgba(239,68,68,0.2)"
                    : availableSlots != null && availableSlots <= 2
                      ? "rgba(234,179,8,0.2)"
                      : "rgba(34,197,94,0.2)"
                    }`,
                  flexShrink: 0,
                }}
              >
                {slotsLoading ? (
                  <div
                    className="page_loader_spinner"
                    style={{ width: 11, height: 11 }}
                  />
                ) : (
                  <MdSignalCellularAlt
                    size={12}
                    style={{
                      color:
                        availableSlots === 0
                          ? "#ef4444"
                          : availableSlots != null && availableSlots <= 2
                            ? "#ca8a04"
                            : "#16a34a",
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color:
                      availableSlots === 0
                        ? "#ef4444"
                        : availableSlots != null && availableSlots <= 2
                          ? "#ca8a04"
                          : "#16a34a",
                  }}
                >
                  {slotsLoading
                    ? "Slots…"
                    : availableSlots != null
                      ? `${availableSlots} slot${availableSlots !== 1 ? "s" : ""}`
                      : "—"}
                </span>
              </div>
            )}

            {view === "brands" && selectedMenuIds.length > 0 && (
              <button
                className="app_btn app_btn_confirm"
                style={{
                  height: 40,
                  padding: "0 20px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  flexShrink: 0,
                  fontSize: "0.84rem",
                }}
                onClick={() => setView("financials")}
              >
                Continue <MdArrowForward size={15} />
              </button>
            )}
            {view === "financials" && (
              <button
                onClick={() => setView("brands")}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  fontSize: "0.78rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "inherit",
                  flexShrink: 0,
                }}
              >
                Go Back
              </button>
            )}
          </div>

          {view === "brands" ? (
            <>
              {/* Search input */}
              <div
                style={{
                  padding: "16px 24px 0",
                  flexShrink: 0,
                }}
              >
                <div className="overview_search_container">
                  <input
                    className="overview_search_input"
                    placeholder="Search by brand name or tagline…"
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Brands list */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "16px 24px",
                }}
              >
                {brandsLoading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="skeleton_shimmer skeleton_rect"
                        style={{ height: 100, borderRadius: 16 }}
                      />
                    ))}
                  </div>
                ) : filteredBrands.length === 0 ? (
                  <div
                    style={{
                      padding: "48px 0",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontSize: "0.86rem",
                    }}
                  >
                    No brands found matching your search.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {filteredBrands.map((brand) => {
                      const isExpanded = expandedBrandId === brand.id;
                      const isAssigned = selectedBrandId === brand.id;
                      const hasMenusSelected = isAssigned && selectedMenuIds.length > 0;
                      const slots = brandSlots[brand.id];

                      return (
                        <div
                          key={brand.id}
                          style={{
                            background: "var(--bg-hover)",
                            border: `1.5px solid ${isExpanded ? "var(--accent)" : "var(--border)"}`,
                            borderRadius: 16,
                            overflow: "hidden",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {/* Brand Info Row */}
                          <div
                            onClick={() => toggleBrand(brand.id)}
                            style={{
                              padding: "16px 18px",
                              display: "flex",
                              alignItems: "center",
                              gap: 14,
                              cursor: "pointer",
                            }}
                          >
                            <div
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                background: "var(--bg-card)",
                                border: "1px solid var(--border)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                overflow: "hidden",
                              }}
                            >
                              {(brand.branding?.logo || brand.businessLogo) ? (
                                <img
                                  src={brand.branding?.logo || brand.businessLogo}
                                  alt=""
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <span style={{ fontSize: "1.2rem" }}>🍔</span>
                              )}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: "0.92rem",
                                  fontWeight: 800,
                                  color: "var(--text-heading)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                {brand.businessName}
                                {hasMenusSelected && (
                                  <span
                                    style={{
                                      fontSize: "0.64rem",
                                      fontWeight: 800,
                                      padding: "1px 6px",
                                      borderRadius: 999,
                                      background: "var(--accent)",
                                      color: "#fff",
                                    }}
                                  >
                                    {selectedMenuIds.length} Selected
                                  </span>
                                )}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.72rem",
                                  color: "var(--text-muted)",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  marginTop: 2,
                                }}
                              >
                                {brand.brandTagline || brand.branding?.tagline || "Artisanal Concept"}
                              </div>
                            </div>

                            {/* Slot limit flag */}
                            {slots != null && (
                              <div
                                style={{
                                  fontSize: "0.65rem",
                                  fontWeight: 800,
                                  padding: "3px 8px",
                                  borderRadius: 6,
                                  background:
                                    slots === 0
                                      ? "rgba(239,68,68,0.08)"
                                      : "rgba(34,197,94,0.08)",
                                  color: slots === 0 ? "#ef4444" : "#16a34a",
                                  border: `1px solid ${slots === 0 ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
                                  marginRight: 6,
                                }}
                              >
                                {slots === 0 ? "No Slots" : `${slots} Slot${slots !== 1 ? "s" : ""}`}
                              </div>
                            )}

                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontSize: "0.9rem",
                              }}
                            >
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>

                          {/* Expanded Menus List */}
                          {isExpanded && (
                            <div
                              style={{
                                padding: "0 18px 18px",
                                borderTop: "1px solid var(--border)",
                                background: "var(--bg-card)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  color: "var(--text-muted)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.05em",
                                  margin: "14px 0 10px",
                                }}
                              >
                                Select Menu Items
                              </div>

                              {brandMenus[brand.id]?.loading ? (
                                <div style={{ padding: "10px 0" }}>
                                  <div
                                    className="page_loader_spinner"
                                    style={{ width: 18, height: 18 }}
                                  />
                                </div>
                              ) : (brandMenus[brand.id]?.items || []).length === 0 ? (
                                <div
                                  style={{
                                    fontSize: "0.76rem",
                                    color: "var(--text-muted)",
                                    fontStyle: "italic",
                                  }}
                                >
                                  No menu items published by this brand concept.
                                </div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                  {(brandMenus[brand.id]?.items || []).map((m) => {
                                    const isSel = selectedMenuIds.includes(m.id) && isAssigned;
                                    return (
                                      <div
                                        key={m.id}
                                        style={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 12,
                                          padding: "8px 10px",
                                          borderRadius: 10,
                                          background: isSel ? "var(--bg-active)" : "var(--bg-hover)",
                                          border: `1px solid ${isSel ? "rgba(203,108,220,0.4)" : "var(--border)"}`,
                                          transition: "all 0.12s",
                                        }}
                                      >
                                        {m.image ? (
                                          <img
                                            src={m.image}
                                            alt=""
                                            style={{
                                              width: 38,
                                              height: 38,
                                              borderRadius: 8,
                                              objectFit: "cover",
                                              flexShrink: 0,
                                            }}
                                          />
                                        ) : (
                                          <div
                                            style={{
                                              width: 38,
                                              height: 38,
                                              borderRadius: 8,
                                              background: "var(--bg-card)",
                                              border: "1px solid var(--border)",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontSize: "0.9rem",
                                              flexShrink: 0,
                                            }}
                                          >
                                            🍽
                                          </div>
                                        )}

                                        <div
                                          onClick={() => {
                                            setDetailMenuId(m.id);
                                            setDetailMenuName(m.name);
                                          }}
                                          style={{
                                            flex: 1,
                                            minWidth: 0,
                                            cursor: "pointer",
                                          }}
                                        >
                                          <div
                                            style={{
                                              fontSize: "0.82rem",
                                              fontWeight: 700,
                                              color: isSel ? "var(--accent)" : "var(--text-heading)",
                                            }}
                                          >
                                            {m.name}
                                          </div>
                                          {m.ticketTime > 0 && (
                                            <div
                                              style={{
                                                fontSize: "0.66rem",
                                                color: "var(--text-muted)",
                                                marginTop: 1,
                                              }}
                                            >
                                              ⏱ {m.ticketTime} min
                                            </div>
                                          )}
                                        </div>

                                        <button
                                          onClick={() => toggleMenu(m.id, brand.id)}
                                          style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 6,
                                            border: `1px solid ${isSel ? "var(--accent)" : "var(--border)"}`,
                                            background: isSel ? "var(--accent)" : "var(--bg-card)",
                                            color: isSel ? "#fff" : "var(--text-muted)",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                          }}
                                        >
                                          {isSel ? "✓" : "+"}
                                        </button>
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
                )}
              </div>
            </>
          ) : (
            /* FINANCIALS VIEW */
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {termsLoading ? (
                <div style={{ padding: 48, textAlign: "center" }}>
                  <div
                    className="page_loader_spinner"
                    style={{ margin: "0 auto", width: 24, height: 24 }}
                  />
                  <div style={{ marginTop: 12, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    Loading agreement settings…
                  </div>
                </div>
              ) : !termsData ? (
                <div
                  style={{
                    padding: "48px 0",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  Failed to load billing terms for this brand concept.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {/* Financials Summary */}
                  <div
                    style={{
                      background: "var(--bg-hover)",
                      border: "1px solid var(--border)",
                      borderRadius: 16,
                      padding: "18px 20px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 14,
                      }}
                    >
                      INITIALIZATION FEES
                    </div>

                    {(termsData.payments || []).map((p, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "10px 0",
                          borderTop: i > 0 ? "1px solid var(--border)" : "none",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-heading)" }}>
                            {p.title}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 1 }}>
                            {p.frequency}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "0.95rem",
                            fontWeight: 800,
                            color: "var(--accent)",
                            flexShrink: 0,
                          }}
                        >
                          {termsData.currency} {fmt(p.amount)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "rgba(203,108,220,0.06)",
                      border: "1px dashed rgba(203,108,220,0.3)",
                      borderRadius: 12,
                      padding: "10px 14px",
                      color: "var(--accent)",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      marginTop: 10,
                    }}
                  >
                    <span>ℹ️ E-Signing of terms is required upon confirmation.</span>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 24 }}>
                <button
                  className={`app_btn app_btn_confirm${confirming ? " btn_loading" : ""}`}
                  style={{
                    width: "100%",
                    height: 48,
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    fontSize: "0.92rem",
                    fontWeight: 800,
                  }}
                  onClick={handleConfirm}
                  disabled={confirming || !selectedBrandId}
                >
                  <span className="btn_text">
                    Confirm — {selectedBrand?.businessName}
                  </span>
                  {confirming && (
                    <span
                      className="btn_loader"
                      style={{ width: 16, height: 16 }}
                    />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        {showSignDrawer && (
          <ESignDrawer
            isOpen={showSignDrawer}
            onClose={() => setShowSignDrawer(false)}
            title="Tripartite Franchise Agreement"
            description="Sign the franchise agreement to link this brand to the kiosk."
            templateText={termsData?.terms || DEFAULT_VENDOR_AGREEMENT}
            variables={{
              buyer_name: selectedBrand?.businessName || "Vendor Operator",
              buyer_address: cart.location?.address || "Kiosk Location Address",
              kiosk_serial: cart.serialNumber || "Kiosk Unit",
              currency: termsData?.currency || "NGN",
              purchase_price: (termsData?.payments || []).reduce((sum, p) => sum + p.amount, 0).toLocaleString(),
            }}
            submitting={confirming}
            onSubmit={handleSignSubmit}
          />
        )}
      </div>

      {detailMenuId && (
        <MenuDetailDrawer
          menuId={detailMenuId}
          menuName={detailMenuName}
          cart={cart}
          isSelected={
            selectedMenuIds.includes(detailMenuId) &&
            selectedBrandId === expandedBrandId
          }
          onToggleSelect={() => {
            const brandId = expandedBrandId;
            if (brandId) toggleMenu(detailMenuId, brandId);
          }}
          selectedCount={selectedMenuIds.length}
          onClose={() => {
            setDetailMenuId(null);
            setDetailMenuName("");
          }}
        />)}
    </>
  );
}
