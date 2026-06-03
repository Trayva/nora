import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MdOutlineFastfood,
  MdArrowForward,
  MdStorefront,
  MdClose,
} from "react-icons/md";
import { LuChevronDown, LuChevronRight, LuStar } from "react-icons/lu";
import Drawer from "../../components/Drawer";
import api from "../../api/axios";
import { useAppState } from "../../contexts/StateContext";
import { useAuth } from "../../contexts/AuthContext";
import ESignDrawer from "../../components/ESignDrawer";
import { calcMenu } from "../../api/library";
import "./PublicConcepts.css";
const PREVIEW_COUNT = 6;

// ── List Drawer (all concepts) ──────────────────────────────────────────────
function AllConceptsDrawer({ isOpen, onClose, concepts, onSelect }) {
  const [search, setSearch] = useState("");

  const filtered = concepts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.vendor?.businessName?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Public Concepts"
      description={`${concepts.length} concept${concepts.length !== 1 ? "s" : ""} available for rental`}
      width={520}
    >
      {/* Search */}
      <div className="pub_concept_search_wrap">
        <input
          className="modal-input"
          placeholder="Search concepts or vendors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />
      </div>

      <div className="pub_concept_list">
        {filtered.length === 0 ? (
          <div className="pub_concept_empty">
            <MdStorefront size={28} style={{ opacity: 0.3 }} />
            <p>No concepts match your search.</p>
          </div>
        ) : (
          filtered.map((concept) => (
            <div
              key={concept.id}
              className="pub_concept_list_row"
              onClick={() => onSelect(concept)}
            >
              {concept.banner ? (
                <img
                  src={concept.banner}
                  alt={concept.name}
                  className="pub_concept_list_img"
                />
              ) : (
                <div className="pub_concept_list_img pub_concept_list_img_placeholder">
                  <MdOutlineFastfood size={16} />
                </div>
              )}
              <div className="pub_concept_list_info">
                <span className="pub_concept_list_name">{concept.name}</span>
                <span className="pub_concept_list_vendor">
                  {concept.vendor?.businessName}
                </span>
                <div className="pub_concept_list_meta">
                  {concept.origin && <span>{concept.origin}</span>}
                  {concept.origin && concept.menuItems?.length > 0 && (
                    <span className="pub_concept_dot">·</span>
                  )}
                  {concept.menuItems?.length > 0 && (
                    <span>{concept.menuItems.length} items</span>
                  )}
                </div>
              </div>
              <MdArrowForward
                size={16}
                style={{ color: "var(--text-muted)", flexShrink: 0 }}
              />
            </div>
          ))
        )}
      </div>
    </Drawer>
  );
}

// ── Detail Drawer (single concept) ─────────────────────────────────────────
function ConceptDetailDrawer({ concept, onClose, onBack }) {
  const { selectedState } = useAppState();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currency = selectedState?.currency || "NGN";
  const [markup, setMarkup] = useState(30);
  const [costs, setCosts] = useState({});
  const [loadingCosts, setLoadingCosts] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(true);

  // Concept Rental fields
  const [kiosks, setKiosks] = useState([]);
  const [loadingKiosks, setLoadingKiosks] = useState(false);
  const [selectedKioskId, setSelectedKioskId] = useState("");
  const [rentalSettings, setRentalSettings] = useState([]);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [showSignDrawer, setShowSignDrawer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const formatCost = (amount) =>
    amount != null
      ? new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
          amount,
        )
      : null;

  const calcSelling = (cost) =>
    cost != null ? cost + (markup / 100) * cost : null;
  const calcProfit = (cost) => (cost != null ? calcSelling(cost) - cost : null);

  useEffect(() => {
    if (!concept) return;
    const fetchCosts = async () => {
      setLoadingCosts(true);
      const results = {};
      await Promise.allSettled(
        (concept.menuItems || []).map(async (item) => {
          try {
            const res = await calcMenu(item.id, selectedState?.id);
            results[item.id] = res.data?.data?.recipeCost ?? null;
          } catch {
            results[item.id] = null;
          }
        }),
      );
      setCosts(results);
      setLoadingCosts(false);
    };
    fetchCosts();
  }, [concept?.id, selectedState?.id]);

  useEffect(() => {
    if (!concept || !user) return;
    const fetchKiosksAndSettings = async () => {
      setLoadingKiosks(true);
      setLoadingSettings(true);
      try {
        const [kiosksRes, settingsRes] = await Promise.all([
          api.get("/kiosk/vendor"),
          api.get("/kiosk/concept-rental-settings"),
        ]);
        const activeKiosks = (kiosksRes.data?.data?.items || []).filter(
          (k) => k.status !== "INACTIVE"
        );
        setKiosks(activeKiosks);
        setRentalSettings(settingsRes.data?.data || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load kiosk or settings data");
      } finally {
        setLoadingKiosks(false);
        setLoadingSettings(false);
      }
    };
    fetchKiosksAndSettings();
  }, [concept, user]);

  if (!concept) return null;

  const vendorColor = concept.vendor?.brandColor;

  const selectedKiosk = kiosks.find((k) => k.id === selectedKioskId);
  const kioskCountry = selectedKiosk?.location?.country || "Nigeria";
  const matchedSetting = rentalSettings.find(
    (s) => s.country.toLowerCase() === kioskCountry.toLowerCase()
  );

  const handleSignSubmit = async ({ signatureName, terms, isSigned }) => {
    if (!selectedKioskId) return;
    setSubmitting(true);
    try {
      await api.post(`/kiosk/${selectedKioskId}/rent-concept`, {
        conceptId: concept.id,
        markup: Number(markup),
        signatureName,
        terms,
        isSigned,
      });
      toast.success("Concept rental application submitted successfully!");
      setShowSignDrawer(false);
      onClose();
      navigate("/app/invoices", { state: { openLatest: true } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit rental application");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Drawer
        isOpen={!!concept}
        onClose={onClose}
        title={concept.name}
        description={concept.vendor?.businessName}
        width={540}
      >
        {/* Back */}
        <button className="pub_detail_back" onClick={onBack}>
          ← Back to all concepts
        </button>

        {/* Banner */}
        {concept.banner && (
          <img
            src={concept.banner}
            alt={concept.name}
            className="pub_detail_banner"
          />
        )}

        {/* Vendor card */}
        <div className="pub_detail_vendor_card">
          {concept.vendor?.brandLogo ? (
            <img
              src={concept.vendor.brandLogo}
              alt={concept.vendor.businessName}
              className="pub_detail_vendor_logo"
            />
          ) : (
            <div
              className="pub_detail_vendor_logo pub_detail_vendor_logo_placeholder"
              style={{
                background: vendorColor ? `${vendorColor}22` : "var(--bg-hover)",
                borderColor: vendorColor || "var(--border)",
              }}
            >
              <MdStorefront
                size={16}
                style={{ color: vendorColor || "var(--text-muted)" }}
              />
            </div>
          )}
          <div className="pub_detail_vendor_info">
            <span className="pub_detail_vendor_name">
              {concept.vendor?.businessName}
            </span>
            {concept.vendor?.brandTagline && (
              <span className="pub_detail_vendor_tagline">
                {concept.vendor.brandTagline}
              </span>
            )}
          </div>
          {concept.vendor?.membershipStatus === "ACTIVE" && (
            <span className="pub_detail_verified">
              <LuStar size={10} /> Active
            </span>
          )}
        </div>

        {/* Meta chips */}
        <div className="pub_detail_meta_row">
          {concept.origin && (
            <span className="pub_detail_chip">{concept.origin}</span>
          )}
          {concept.serveTo && (
            <span className="pub_detail_chip">{concept.serveTo}</span>
          )}
          {concept.status && (
            <span
              className="pub_detail_chip"
              style={
                concept.status === "APPROVED"
                  ? {
                      background: "rgba(34,197,94,0.1)",
                      color: "#16a34a",
                      borderColor: "rgba(34,197,94,0.25)",
                    }
                  : {}
              }
            >
              {concept.status}
            </span>
          )}
        </div>

        {concept.description && (
          <p className="pub_detail_desc">{concept.description}</p>
        )}

        {/* Markup slider */}
        <div className="pub_detail_markup_block">
          <div className="pub_detail_markup_header">
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

        {/* Menu items */}
        <div className="drawer_section">
          <div
            className="drawer_collapsible_header"
            onClick={() => setItemsOpen((v) => !v)}
            style={{ cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {itemsOpen ? (
                <LuChevronDown size={14} style={{ color: "var(--text-muted)" }} />
              ) : (
                <LuChevronRight
                  size={14}
                  style={{ color: "var(--text-muted)" }}
                />
              )}
              <span className="wallet_section_title">Menu Items</span>
              <span className="drawer_section_count">
                {concept.menuItems?.length || 0}
              </span>
            </div>
          </div>

          {itemsOpen && (
            <div className="drawer_section_body">
              {loadingCosts && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginBottom: 10,
                  }}
                >
                  Calculating costs for {selectedState?.name || "selected state"}…
                </div>
              )}
              {!concept.menuItems?.length ? (
                <div className="pub_concept_empty">
                  <MdOutlineFastfood size={22} style={{ opacity: 0.3 }} />
                  <p>No menu items yet.</p>
                </div>
              ) : (
                <div className="drawer_items_list">
                  {concept.menuItems.map((item) => {
                    const cost = costs[item.id];
                    return (
                      <div
                        key={item.id}
                        className="drawer_item_row"
                        style={{ cursor: "default" }}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="drawer_item_img"
                          />
                        ) : (
                          <div className="drawer_item_img drawer_item_img_placeholder">
                            <MdOutlineFastfood size={14} />
                          </div>
                        )}
                        <div className="drawer_item_info">
                          <span className="concept_item_name">{item.name}</span>
                          {item.description && (
                            <span className="concept_item_desc">
                              {item.description}
                            </span>
                          )}
                          {cost != null && (
                            <div className="drawer_item_prices">
                              <span className="drawer_price_chip drawer_price_chip_muted">
                                Cost {formatCost(cost)}
                              </span>
                              {calcSelling(cost) != null && (
                                <span className="drawer_price_chip">
                                  Sell {formatCost(calcSelling(cost))}
                                </span>
                              )}
                              {calcProfit(cost) != null && (
                                <span
                                  className="drawer_price_chip"
                                  style={{
                                    color: "#16a34a",
                                    background: "rgba(34,197,94,0.08)",
                                    borderColor: "rgba(34,197,94,0.2)",
                                  }}
                                >
                                  +{formatCost(calcProfit(cost))}
                                </span>
                              )}
                            </div>
                          )}
                          {cost == null && !loadingCosts && (
                            <span
                              className="concept_item_desc"
                              style={{ fontStyle: "italic" }}
                            >
                              Cost not mapped for this state
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rent this Concept Section */}
        <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
          <h3 className="wallet_section_title" style={{ marginBottom: 12 }}>Rent this Concept</h3>
          
          {!user ? (
            <div style={{ padding: 16, background: "var(--bg-hover)", border: "1px dashed var(--border)", borderRadius: 12, textAlign: "center" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 10px" }}>Log in as a vendor to rent this concept for your kiosk.</p>
              <a href="/auth/login" className="app_btn app_btn_confirm" style={{ display: "inline-flex", textDecoration: "none", alignItems: "center", justifyContent: "center", height: 36, padding: "0 16px" }}>Log In</a>
            </div>
          ) : loadingKiosks ? (
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Loading your kiosks...</div>
          ) : kiosks.length === 0 ? (
            <div style={{ padding: 16, background: "var(--bg-hover)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0 0 12px" }}>
                You do not have any active kiosks to rent this concept for.
              </p>
              <button className="app_btn app_btn_confirm" style={{ height: 36 }} onClick={() => navigate("/app/purchase-kiosk")}>
                Purchase a Kiosk
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label" style={{ fontSize: "0.72rem" }}>Select Kiosk *</label>
                <select
                  className="modal-input"
                  value={selectedKioskId}
                  onChange={(e) => setSelectedKioskId(e.target.value)}
                  style={{ height: 40, padding: "0 10px" }}
                >
                  <option value="">-- Choose a Kiosk --</option>
                  {kiosks.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name || `Kiosk ${k.serialNumber}`} ({k.location?.name || k.location?.address || "No Location"}) - {k.location?.country || "Nigeria"}
                    </option>
                  ))}
                </select>
              </div>

              {selectedKiosk && (
                <>
                  {loadingSettings ? (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Loading rental terms...</div>
                  ) : !matchedSetting ? (
                    <div style={{ fontSize: "0.78rem", color: "var(--warning)", padding: 10, background: "rgba(234,179,8,0.1)", borderRadius: 8, border: "1px solid rgba(234,179,8,0.2)" }}>
                      Concept rental is not available/configured for country: {kioskCountry}.
                    </div>
                  ) : (
                    <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-heading)" }}>Rental Fees Schedule</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)" }}>{matchedSetting.currency}</span>
                      </div>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {(matchedSetting.payments || []).map((p, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-body)" }}>{p.title}</span>
                              <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{p.description}</span>
                            </div>
                            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-heading)" }}>
                              {matchedSetting.currency} {p.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-heading)" }}>Total Initial Rental Cost</span>
                        <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--accent)" }}>
                          {matchedSetting.currency} {(matchedSetting.payments || []).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                        </span>
                      </div>

                      <button
                        className="app_btn app_btn_confirm"
                        style={{ width: "100%", height: 40, marginTop: 14 }}
                        onClick={() => setShowSignDrawer(true)}
                      >
                        Review &amp; Rent Concept
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Drawer>

      {showSignDrawer && matchedSetting && (
        <ESignDrawer
          isOpen={showSignDrawer}
          onClose={() => setShowSignDrawer(false)}
          title="Concept Rental Agreement"
          description="Please review and sign the concept rental agreement to initiate your application."
          templateText={matchedSetting.terms || DEFAULT_RENTAL_AGREEMENT}
          variables={{
            buyer_name: user?.fullName || user?.email || "Vendor Kiosk Operator",
            buyer_address: selectedKiosk?.location?.address || selectedKiosk?.location?.name || "Kiosk Location",
            concept_name: concept.name,
            concept_owner: concept.vendor?.businessName || "Concept Owner",
            kiosk_serial: selectedKiosk?.serialNumber || selectedKiosk?.name || "Kiosk Unit",
            currency: matchedSetting.currency || "NGN",
            purchase_price: (matchedSetting.payments || []).reduce((sum, p) => sum + p.amount, 0).toLocaleString(),
          }}
          submitting={submitting}
          onSubmit={handleSignSubmit}
        />
      )}
    </>
  );
}

// ── Main Section ────────────────────────────────────────────────────────────
export default function PublicConceptsSection() {
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/vendor/concept/public-rental");
        setConcepts(res.data.data || []);
      } catch {
        toast.error("Failed to load public concepts");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const preview = concepts.slice(0, PREVIEW_COUNT);

  const handleSelectConcept = (concept) => {
    setShowAll(false);
    setSelectedConcept(concept);
  };

  return (
    <section className="pub_concepts_section">
      <div className="pub_concepts_inner">
        <div className="pub_concepts_header">
          <div>
            <h2 className="pub_concepts_title">Rent a Concept</h2>
            <p className="pub_concepts_sub">
              Browse vendor concepts available for Kiosk rental — complete with
              menus, costs, and markup projections.
            </p>
          </div>
          {concepts.length > PREVIEW_COUNT && (
            <button
              className="app_btn app_btn_cancel pub_concepts_view_all"
              onClick={() => setShowAll(true)}
            >
              View all ({concepts.length})
            </button>
          )}
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "48px 0",
            }}
          >
            <div className="page_loader_spinner" />
          </div>
        ) : concepts.length === 0 ? (
          <div className="pub_concept_empty">
            <MdStorefront size={32} style={{ opacity: 0.25 }} />
            <p>No public concepts available yet.</p>
          </div>
        ) : (
          <div className="pub_concepts_grid">
            {preview.map((concept) => (
              <div
                key={concept.id}
                className="pub_concept_card"
                onClick={() => setSelectedConcept(concept)}
              >
                {/* Banner */}
                <div className="pub_concept_card_banner">
                  {concept.banner ? (
                    <img
                      src={concept.banner}
                      alt={concept.name}
                      className="pub_concept_card_banner_img"
                    />
                  ) : (
                    <div className="pub_concept_card_banner_placeholder">
                      <MdOutlineFastfood size={32} style={{ opacity: 0.3 }} />
                    </div>
                  )}
                  <span className="pub_concept_card_items_badge">
                    {concept.menuItems?.length || 0} items
                  </span>
                </div>

                {/* Body */}
                <div className="pub_concept_card_body">
                  <div className="pub_concept_card_vendor_row">
                    {concept.vendor?.brandLogo ? (
                      <img
                        src={concept.vendor.brandLogo}
                        alt={concept.vendor.businessName}
                        className="pub_concept_card_vendor_logo"
                      />
                    ) : (
                      <div className="pub_concept_card_vendor_logo pub_concept_card_vendor_logo_placeholder">
                        <MdStorefront size={10} />
                      </div>
                    )}
                    <span className="pub_concept_card_vendor_name">
                      {concept.vendor?.businessName}
                    </span>
                  </div>

                  <h3 className="pub_concept_card_name">{concept.name}</h3>

                  {concept.description && (
                    <p className="pub_concept_card_desc">
                      {concept.description}
                    </p>
                  )}

                  <div className="pub_concept_card_footer">
                    {concept.origin && (
                      <span className="pub_concept_chip">{concept.origin}</span>
                    )}
                    {concept.serveTo && (
                      <span className="pub_concept_chip">
                        {concept.serveTo}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* All concepts drawer */}
        <AllConceptsDrawer
          isOpen={showAll}
          onClose={() => setShowAll(false)}
          concepts={concepts}
          onSelect={handleSelectConcept}
        />

        {/* Concept detail drawer */}
        <ConceptDetailDrawer
          concept={selectedConcept}
          onClose={() => setSelectedConcept(null)}
          onBack={() => {
            setSelectedConcept(null);
            setShowAll(true);
          }}
        />
      </div>
    </section>
  );
}
