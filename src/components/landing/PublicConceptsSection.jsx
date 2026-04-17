import { useState, useEffect } from "react";
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
  const currency = selectedState?.currency || "NGN";
  const [markup, setMarkup] = useState(30);
  const [costs, setCosts] = useState({});
  const [loadingCosts, setLoadingCosts] = useState(false);
  const [itemsOpen, setItemsOpen] = useState(true);

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

  if (!concept) return null;

  const vendorColor = concept.vendor?.brandColor;

  return (
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
    </Drawer>
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
