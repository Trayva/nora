import { LuTrash2 } from "react-icons/lu";

export default function RecipeStepsList({ steps, onDelete, deleting, cost }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="biz_empty" style={{ padding: "20px 0" }}>
        <p>No recipe steps yet.</p>
      </div>
    );
  }

  return (
    <div className="recipe_steps_list">
      {steps.map((step, i) => (
        <div key={step.id} className="recipe_step_row">
          <div className="recipe_step_num">{i + 1}</div>
          <div className="recipe_step_info">
            <div className="recipe_step_top_row">
              <span className={`ing_type_badge ing_type_${step.type}`}>
                {step.type}
              </span>
              <span className="recipe_step_name">
                {step.ingredient?.name || step.prepRef?.name || "—"}
              </span>
              <span className="recipe_step_qty_inline">
                × {step.quantity}{" "}
                {step.ingredient?.unit || step.prepRef?.unit || ""}
              </span>
            </div>
            {step.instruction && (
              <span className="recipe_step_instruction">
                {step.instruction}
              </span>
            )}
          </div>
          <button
            className="biz_icon_btn biz_icon_btn_danger"
            onClick={() => onDelete(step.id)}
            disabled={deleting === step.id}
            style={{ position: "relative", flexShrink: 0 }}
          >
            {deleting === step.id ? (
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
      ))}

      {/* Cost result */}
      {cost && (
        <div className="recipe_cost_result">
          <div className="recipe_cost_row">
            <span className="recipe_cost_label">Recipe Output</span>
            <span className="recipe_cost_value">
              {cost.recipeOutput} {cost.unit}
            </span>
          </div>
          <div className="recipe_cost_row">
            <span className="recipe_cost_label">Total Cost</span>
            <span className="recipe_cost_value recipe_cost_total">
              ₦{Number(cost.totalCost || 0).toLocaleString()}
            </span>
          </div>
          {cost.costPerUnit && (
            <div className="recipe_cost_row">
              <span className="recipe_cost_label">Cost per {cost.unit}</span>
              <span className="recipe_cost_value">
                ₦{Number(cost.costPerUnit).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
