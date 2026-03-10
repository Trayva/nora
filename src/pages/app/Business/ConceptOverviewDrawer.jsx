import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  MdOutlineFastfood,
  MdOutlineSettings,
  MdOutlineScience,
  MdOutlineBlender,
} from "react-icons/md";
import { LuChevronDown, LuChevronRight } from "react-icons/lu";
import Drawer from "../../../components/Drawer";
import { getConceptSummary } from "../../../api/vendor";
import { useAppState } from "../../../contexts/StateContext";

function CollapsibleSection({ title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="drawer_section">
      <div
        className="drawer_collapsible_header"
        onClick={() => setOpen((v) => !v)}
        style={{ cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {open ? (
            <LuChevronDown size={14} style={{ color: "var(--text-muted)" }} />
          ) : (
            <LuChevronRight size={14} style={{ color: "var(--text-muted)" }} />
          )}
          <span className="wallet_section_title">{title}</span>
          {count !== undefined && (
            <span className="drawer_section_count">{count}</span>
          )}
        </div>
      </div>
      {open && <div className="drawer_section_body">{children}</div>}
    </div>
  );
}

export default function ConceptOverviewDrawer({ concept, onClose }) {
  const { selectedState } = useAppState();
  const currency = selectedState?.currency || "NGN";
  const formatCost = (amount) =>
    amount != null
      ? new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
          amount,
        )
      : null;
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!concept) {
      setSummary(null);
      return;
    }
    const loadSummary = async () => {
      setLoading(true);
      console.log("Fetching summary for:", concept.id);
      try {
        const res = await getConceptSummary(concept.id, {
          ...(selectedState?.id && { stateId: selectedState.id }),
        });
        console.log("Summary response:", res.data);
        setSummary(res.data.data);
      } catch (err) {
        console.log(
          "Summary error:",
          err?.response?.status,
          err?.response?.data,
        );
        toast.error("Failed to load concept overview");
      } finally {
        setLoading(false);
      }
    };
    loadSummary(); // ← was fetch()
  }, [concept?.id]);

  return (
    <Drawer
      isOpen={!!concept}
      onClose={onClose}
      title={concept?.name || ""}
      description="Concept overview"
      width={560}
    >
      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : summary ? (
        <>
          {/* Stats row */}
          <div className="overview_stats_row">
            {[
              { label: "Menu Items", value: summary.stats.totalMenuItems },
              { label: "Machineries", value: summary.stats.totalMachineries },
              {
                label: "Ingredients",
                value: summary.stats.totalUniqueIngredients,
              },
              {
                label: "Prep Items",
                value: summary.stats.totalUniquePrepItems,
              },
            ].map((s) => (
              <div key={s.label} className="overview_stat_card">
                <span className="overview_stat_value">{s.value}</span>
                <span className="overview_stat_label">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Menu Items */}
          <CollapsibleSection
            title="Menu Items"
            count={summary.menuItems?.length}
          >
            {summary.menuItems?.length === 0 ? (
              <div className="biz_empty" style={{ padding: "16px 0" }}>
                <p>No menu items.</p>
              </div>
            ) : (
              <div className="overview_menu_list">
                {summary.menuItems.map((item) => (
                  <div key={item.id} className="overview_menu_card">
                    {/* Header */}
                    <div className="overview_menu_card_header">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="overview_menu_img"
                        />
                      ) : (
                        <div className="overview_menu_img overview_menu_img_placeholder">
                          <MdOutlineFastfood size={18} />
                        </div>
                      )}
                      <div className="overview_menu_title_block">
                        <span className="overview_menu_name">{item.name}</span>
                        <div className="overview_menu_badges">
                          {item.variant && (
                            <span className="overview_badge overview_badge_variant">
                              ⚡ {item.variant.name}
                            </span>
                          )}
                          {item.extras?.map((ex) => (
                            <span
                              key={ex.id}
                              className="overview_badge overview_badge_extra"
                            >
                              + {ex.prepItem?.name}
                            </span>
                          ))}
                        </div>

                        <div className="overview_menu_cost_row">
                          {item.recipeCost != null ? (
                            <span className="overview_cost_chip overview_cost_chip_green">
                              {formatCost(item.recipeCost)}
                            </span>
                          ) : item.costError ? (
                            <span
                              className="overview_cost_chip overview_cost_chip_warn"
                              title={item.costError}
                            >
                              ⚠ Cost unavailable
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Recipe steps */}
                    {item.recipe?.length > 0 && (
                      <div className="overview_recipe_block">
                        <span className="overview_recipe_label">Recipe</span>
                        <div className="overview_recipe_steps_grid">
                          {item.recipe.map((step, i) => (
                            <div key={step.id} className="overview_recipe_chip">
                              <span className="overview_recipe_chip_num">
                                {i + 1}
                              </span>
                              <div className="overview_recipe_chip_body">
                                <span className="overview_recipe_chip_name">
                                  {step.ingredient?.name ||
                                    step.prepItem?.name ||
                                    step.type}
                                </span>
                                <span className="overview_recipe_chip_qty">
                                  {step.quantity}{" "}
                                  {step.ingredient?.unit ||
                                    step.prepItem?.unit ||
                                    ""}
                                  {step.instruction
                                    ? ` · ${step.instruction}`
                                    : ""}
                                </span>
                              </div>
                              <span
                                className={`overview_recipe_chip_type overview_recipe_type_${step.type}`}
                              >
                                {step.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Machineries */}
          <CollapsibleSection
            title="Machineries"
            count={summary.machineries?.length}
            defaultOpen={false}
          >
            {summary.machineries?.length === 0 ? (
              <div className="biz_empty" style={{ padding: "16px 0" }}>
                <p>No machineries.</p>
              </div>
            ) : (
              <div className="drawer_items_list">
                {summary.machineries.map((m) => (
                  <div key={m.id} className="recipe_step_row">
                    {m.machinery?.image ? (
                      <img
                        src={m.machinery.image}
                        alt={m.machinery.name}
                        className="ing_option_img"
                        style={{ borderRadius: 8 }}
                      />
                    ) : (
                      <div className="ing_option_img ing_option_img_placeholder">
                        <MdOutlineSettings size={12} />
                      </div>
                    )}
                    <div className="recipe_step_info">
                      <span className="recipe_step_id">
                        {m.machinery?.name}
                      </span>
                      {m.machinery?.manufacturer && (
                        <span className="recipe_step_instruction">
                          {m.machinery.manufacturer}
                        </span>
                      )}
                    </div>
                    {m.quantity > 1 && (
                      <span className="recipe_step_qty">× {m.quantity}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Ingredients */}
          <CollapsibleSection
            title="Ingredients"
            count={summary.ingredients?.length}
            defaultOpen={false}
          >
            {summary.ingredients?.length === 0 ? (
              <div className="biz_empty" style={{ padding: "16px 0" }}>
                <p>No ingredients.</p>
              </div>
            ) : (
              <div className="drawer_items_list">
                {summary.ingredients.map((ing) => (
                  <div key={ing.id} className="recipe_step_row">
                    {ing.image ? (
                      <img
                        src={ing.image}
                        alt={ing.name}
                        className="ing_option_img"
                        style={{ borderRadius: 8 }}
                      />
                    ) : (
                      <div className="ing_option_img ing_option_img_placeholder">
                        <MdOutlineScience size={12} />
                      </div>
                    )}
                    <div className="recipe_step_info">
                      <span className="recipe_step_id">{ing.name}</span>
                      <span className="recipe_step_instruction">
                        Total: {ing.totalQuantity} {ing.unit}
                        {ing.usedIn?.length > 0 &&
                          ` · used in ${ing.usedIn.map((u) => u.menuItem).join(", ")}`}
                      </span>
                    </div>
                    {formatCost(ing.cost) ? (
                      <span className="overview_cost_chip">
                        {formatCost(ing.cost)}
                      </span>
                    ) : (
                      <span className="recipe_step_qty">{ing.unit}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>

          {/* Prep Items */}
          <CollapsibleSection
            title="Prep Items"
            count={summary.prepItems?.length}
            defaultOpen={false}
          >
            {summary.prepItems?.length === 0 ? (
              <div className="biz_empty" style={{ padding: "16px 0" }}>
                <p>No prep items.</p>
              </div>
            ) : (
              <div className="drawer_items_list">
                {summary.prepItems.map((prep) => (
                  <div key={prep.id} className="recipe_step_row">
                    <div className="ing_option_img ing_option_img_placeholder ing_option_img_prep">
                      <MdOutlineBlender size={12} />
                    </div>
                    <div className="recipe_step_info">
                      <span className="recipe_step_id">{prep.name}</span>
                      <span className="recipe_step_instruction">
                        {prep.usedIn
                          ?.map((u) =>
                            u.source === "variant"
                              ? `variant: ${u.variant}`
                              : u.source,
                          )
                          .join(" · ")}
                      </span>
                    </div>
                    {formatCost(prep.cost) ? (
                      <span className="overview_cost_chip">
                        {formatCost(prep.cost)}
                      </span>
                    ) : (
                      <span className="recipe_step_qty">{prep.unit}</span>
                    )}
                    <span className="recipe_step_qty">{prep.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleSection>
        </>
      ) : null}
    </Drawer>
  );
}
