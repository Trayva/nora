import { useState } from "react";
import { toast } from "react-toastify";
import IngredientSearchInput from "./IngredientSearchInput";

export default function RecipeStepForm({ onAdd, loading }) {
  const [selected, setSelected] = useState(null); // { id, name, type, unit }
  const [quantity, setQuantity] = useState("");
  const [instruction, setInstruction] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return toast.error("Please select an ingredient or prep item");
    if (!quantity) return toast.error("Please enter a quantity");
    await onAdd({
      type: selected.type,
      itemId: selected.id,
      quantity: Number(quantity),
      instruction: instruction || undefined,
    });
    setSelected(null);
    setQuantity("");
    setInstruction("");
  };

  return (
    <form onSubmit={handleSubmit} className="recipe_add_form">
      <div className="form-field">
        <label className="modal-label">Ingredient / Prep Item *</label>
        <IngredientSearchInput
          onSelect={(item) => setSelected(item)}
          placeholder="Search e.g. Green Pepper, Pepper Mix..."
        />
        {selected && (
          <div className="ing_selected_chip">
            <span className={`ing_type_badge ing_type_${selected.type}`}>{selected.type}</span>
            <span>{selected.name}</span>
            <span className="ing_option_unit">{selected.unit}</span>
          </div>
        )}
      </div>

      <div className="register_row">
        <div className="form-field">
          <label className="modal-label">Quantity *</label>
          <input
            className="modal-input"
            type="number"
            placeholder="e.g. 100"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label className="modal-label">Unit</label>
          <input
            className="modal-input"
            value={selected?.unit || ""}
            readOnly
            placeholder="auto"
            style={{ color: "var(--text-muted)" }}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="modal-label">Instruction</label>
        <input
          className="modal-input"
          placeholder="e.g. Dice into small pieces and put in the bowl"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
      </div>

      <div className="recipe_add_actions">
        <button
          className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
          type="submit"
          disabled={loading}
          style={{ position: "relative", minWidth: 110, height: 38 }}
        >
          <span className="btn_text">Add Step</span>
          {loading && <span className="btn_loader" style={{ width: 14, height: 14 }} />}
        </button>
      </div>
    </form>
  );
}