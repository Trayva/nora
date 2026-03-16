import { useState } from "react";
import { toast } from "react-toastify";
import { LuTrash2, LuPencil, LuCheck, LuX } from "react-icons/lu";
import IngredientSearchInput from "./IngredientSearchInput";

export default function RecipeStepsList({
  steps,
  onDelete,
  deletingId,
  onUpdate,
  cost,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const startEdit = (step) => {
    setEditingId(step.id);
    setEditForm({
      type: step.type || (step.ingredient ? "ingredient" : "prep"),
      itemId: step.ingredientId || step.prepItemId || step.itemId || "",
      quantity: step.quantity || "",
      instruction: step.instruction || "",
      _itemName:
        step.ingredient?.name || step.prepItem?.name || step.item?.name || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async (stepId) => {
    if (!editForm.itemId || !editForm.quantity) {
      toast.error("Item and quantity are required");
      return;
    }
    setSaving(true);
    try {
      await onUpdate(stepId, {
        type: editForm.type,
        itemId: editForm.itemId,
        quantity: Number(editForm.quantity),
        instruction: editForm.instruction || undefined,
      });
      toast.success("Step updated");
      cancelEdit();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update step");
    } finally {
      setSaving(false);
    }
  };

  if (!steps || steps.length === 0) {
    return (
      <div className="biz_empty" style={{ padding: "20px 0" }}>
        <p>No recipe steps yet.</p>
      </div>
    );
  }

  return (
    <div className="recipe_steps_list">
      {steps.map((step, i) => {
        const isEditing = editingId === step.id;
        const isDeleting = deletingId === step.id;
        const itemName =
          step.ingredient?.name ||
          step.prepItem?.name ||
          step.item?.name ||
          step.ingredientId ||
          step.prepItemId ||
          "Item";

        return isEditing ? (
          /* ── Edit form replaces the row ── */
          <div
            key={step.id}
            style={{
              background: "var(--bg-hover)",
              border: "1px solid rgba(203,108,220,0.2)",
              borderRadius: 10,
              padding: 12,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Edit Step {i + 1}
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  className={`app_btn app_btn_confirm${saving ? " btn_loading" : ""}`}
                  style={{
                    height: 28,
                    padding: "0 12px",
                    fontSize: "0.72rem",
                    position: "relative",
                  }}
                  onClick={() => handleSave(step.id)}
                  disabled={saving}
                >
                  <span className="btn_text">
                    <LuCheck size={12} /> Save
                  </span>
                  {saving && (
                    <span
                      className="btn_loader"
                      style={{ width: 11, height: 11 }}
                    />
                  )}
                </button>
                <button
                  className="app_btn app_btn_cancel"
                  style={{ height: 28, padding: "0 10px", fontSize: "0.72rem" }}
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  <LuX size={12} />
                </button>
              </div>
            </div>

            <div className="form-field" style={{ marginBottom: 8 }}>
              <label className="modal-label">Type *</label>
              <select
                className="modal-input"
                value={editForm.type}
                onChange={(e) =>
                  setEditForm((p) => ({
                    ...p,
                    type: e.target.value,
                    itemId: "",
                    _itemName: "",
                  }))
                }
              >
                <option value="ingredient">Ingredient</option>
                <option value="prep">Prep Item</option>
              </select>
            </div>

            <div className="form-field" style={{ marginBottom: 8 }}>
              <label className="modal-label">Item *</label>
              {editForm._itemName && !editForm._searching ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="ing_selected_chip" style={{ flex: 1 }}>
                    <span
                      className={`ing_type_badge ing_type_${editForm.type}`}
                    >
                      {editForm.type}
                    </span>
                    <span>{editForm._itemName}</span>
                  </div>
                  <button
                    onClick={() =>
                      setEditForm((p) => ({
                        ...p,
                        itemId: "",
                        _itemName: "",
                        _searching: true,
                      }))
                    }
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                      padding: 0,
                    }}
                  >
                    <LuX size={13} />
                  </button>
                </div>
              ) : (
                <IngredientSearchInput
                  placeholder={`Search ${editForm.type === "ingredient" ? "ingredients" : "prep items"}…`}
                  onSelect={(item) => {
                    if (editForm.type === "prep" && item.type !== "prep") {
                      toast.error("Please select a prep item");
                      return;
                    }
                    if (
                      editForm.type === "ingredient" &&
                      item.type === "prep"
                    ) {
                      toast.error("Please select an ingredient");
                      return;
                    }
                    setEditForm((p) => ({
                      ...p,
                      itemId: item.id,
                      _itemName: item.name,
                      _searching: false,
                    }));
                  }}
                />
              )}
            </div>

            <div className="register_row">
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Quantity *</label>
                <input
                  className="modal-input"
                  type="number"
                  placeholder="e.g. 200"
                  value={editForm.quantity}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, quantity: e.target.value }))
                  }
                />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label className="modal-label">Instruction</label>
                <input
                  className="modal-input"
                  placeholder="e.g. Dice finely"
                  value={editForm.instruction}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, instruction: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        ) : (
          /* ── View mode — your original structure, pencil added ── */
          <div key={step.id} className="recipe_step_row">
            <div className="recipe_step_num">{i + 1}</div>
            <div className="recipe_step_info">
              <span className="recipe_step_type">{step.type}</span>
              <span className="recipe_step_id">{itemName}</span>
              {step.instruction && (
                <span className="recipe_step_instruction">
                  {step.instruction}
                </span>
              )}
            </div>
            <div className="recipe_step_qty">× {step.quantity}</div>
            <button
              className="biz_icon_btn"
              onClick={() => startEdit(step)}
              title="Edit step"
              style={{ color: "var(--text-muted)" }}
            >
              <LuPencil size={12} />
            </button>
            <button
              className={`biz_icon_btn biz_icon_btn_danger ${isDeleting ? "btn_loading" : ""}`}
              onClick={() => onDelete(step.id)}
              disabled={isDeleting}
              style={{ position: "relative" }}
            >
              {isDeleting ? (
                <span
                  className="btn_loader"
                  style={{
                    width: 13,
                    height: 13,
                    borderColor: "#ef4444",
                    borderTopColor: "transparent",
                  }}
                />
              ) : (
                <LuTrash2 size={13} />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
