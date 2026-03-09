import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LuTrash2, LuPlus } from "react-icons/lu";
import { MdOutlineFastfood } from "react-icons/md";
import Modal from "../../../components/Modal";
import { getMenuItem, addMenuRecipe, deleteMenuRecipe, updateMenuItem } from "../../../api/vendor";

export default function MenuItemDetail({ item, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingRecipe, setAddingRecipe] = useState(false);
  const [recipeForm, setRecipeForm] = useState({ type: "ingredient", itemId: "", quantity: "", instruction: "" });
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [deletingRecipe, setDeletingRecipe] = useState(null);

  const fetchDetail = async () => {
    try {
      const res = await getMenuItem(item.id);
      setDetail(res.data.data);
    } catch {
      toast.error("Failed to load item details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetail(); }, [item.id]);

  const handleAddRecipe = async (e) => {
    e.preventDefault();
    setSavingRecipe(true);
    try {
      await addMenuRecipe(item.id, {
        type: recipeForm.type,
        itemId: recipeForm.itemId,
        quantity: Number(recipeForm.quantity),
        instruction: recipeForm.instruction || undefined,
      });
      toast.success("Recipe step added");
      setRecipeForm({ type: "ingredient", itemId: "", quantity: "", instruction: "" });
      setAddingRecipe(false);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add recipe step");
    } finally {
      setSavingRecipe(false);
    }
  };

  const handleDeleteRecipe = async (stepId) => {
    setDeletingRecipe(stepId);
    try {
      await deleteMenuRecipe(stepId);
      toast.success("Step removed");
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove step");
    } finally {
      setDeletingRecipe(null);
    }
  };

  const rf = (key) => (e) => setRecipeForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={item.name}
      description={item.description || "Menu item details and recipe"}
    >
      {loading ? (
        <div className="modal-body">
          <div className="page_loader"><div className="page_loader_spinner" /></div>
        </div>
      ) : (
        <div className="modal-body">

          {/* Item header */}
          <div className="menuitem_header">
            {detail.image ? (
              <img src={detail.image} alt={detail.name} className="menuitem_hero_img" />
            ) : (
              <div className="menuitem_hero_img menuitem_hero_placeholder">
                <MdOutlineFastfood size={28} />
              </div>
            )}
            <div className="menuitem_hero_info">
              <h3 className="menuitem_hero_name">{detail.name}</h3>
              {detail.description && <p className="menuitem_hero_desc">{detail.description}</p>}
              <div className="menuitem_price_row">
                <div className="concept_detail_meta_item">
                  <span className="wallet_info_label">Selling Price</span>
                  <span className="wallet_info_value" style={{ color: "#22c55e" }}>
                    ₦{Number(detail.sellingPrice || 0).toLocaleString()}
                  </span>
                </div>
                <div className="concept_detail_meta_item">
                  <span className="wallet_info_label">Recipe Cost</span>
                  <span className="wallet_info_value">
                    ₦{Number(detail.recipeCost || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recipe steps */}
          <div className="concept_detail_section">
            <div className="concept_detail_section_header">
              <span className="wallet_section_title">Recipe Steps</span>
              <button
                className="app_btn app_btn_confirm biz_add_btn"
                onClick={() => setAddingRecipe((v) => !v)}
              >
                <LuPlus size={14} />
                Add Step
              </button>
            </div>

            {/* Add recipe form */}
            {addingRecipe && (
              <form onSubmit={handleAddRecipe} className="recipe_add_form">
                <div className="register_row">
                  <div className="form-field">
                    <label className="modal-label">Type *</label>
                    <select className="modal-input" value={recipeForm.type} onChange={rf("type")}>
                      <option value="ingredient">Ingredient</option>
                      <option value="prep">Prep</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label className="modal-label">Quantity *</label>
                    <input
                      className="modal-input"
                      type="number"
                      placeholder="e.g. 2"
                      value={recipeForm.quantity}
                      onChange={rf("quantity")}
                      required
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label className="modal-label">Item ID *</label>
                  <input
                    className="modal-input"
                    placeholder="Ingredient or prep item ID"
                    value={recipeForm.itemId}
                    onChange={rf("itemId")}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="modal-label">Instruction</label>
                  <input
                    className="modal-input"
                    placeholder="e.g. Chop finely"
                    value={recipeForm.instruction}
                    onChange={rf("instruction")}
                  />
                </div>
                <div className="recipe_add_actions">
                  <button className="app_btn app_btn_cancel" type="button" onClick={() => setAddingRecipe(false)}>
                    Cancel
                  </button>
                  <button
                    className={`app_btn app_btn_confirm ${savingRecipe ? "btn_loading" : ""}`}
                    type="submit" disabled={savingRecipe}
                    style={{ position: "relative", minWidth: 100 }}
                  >
                    <span className="btn_text">Save Step</span>
                    {savingRecipe && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
                  </button>
                </div>
              </form>
            )}

            {/* Recipe list */}
            {!detail.menuRecipes || detail.menuRecipes.length === 0 ? (
              <div className="biz_empty" style={{ padding: "20px 0" }}>
                <p>No recipe steps yet.</p>
              </div>
            ) : (
              <div className="recipe_steps_list">
                {detail.menuRecipes.map((step, i) => (
                  <div key={step.id} className="recipe_step_row">
                    <div className="recipe_step_num">{i + 1}</div>
                    <div className="recipe_step_info">
                      <span className="recipe_step_type">{step.type}</span>
                      <span className="recipe_step_id">{step.itemId}</span>
                      {step.instruction && (
                        <span className="recipe_step_instruction">{step.instruction}</span>
                      )}
                    </div>
                    <div className="recipe_step_qty">× {step.quantity}</div>
                    <button
                      className={`biz_icon_btn biz_icon_btn_danger ${deletingRecipe === step.id ? "btn_loading" : ""}`}
                      onClick={() => handleDeleteRecipe(step.id)}
                      disabled={deletingRecipe === step.id}
                      style={{ position: "relative" }}
                    >
                      {deletingRecipe === step.id
                        ? <span className="btn_loader" style={{ width: 13, height: 13, borderColor: "#ef4444", borderTopColor: "transparent" }} />
                        : <LuTrash2 size={13} />
                      }
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}