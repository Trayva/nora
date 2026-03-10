import { useState } from "react";
import Modal from "../../../components/Modal";
import { createExtra } from "../../../api/library";
import { toast } from "react-toastify";
import UnitSelect from "../../../components/UnitSelect";

export default function CreateExtraModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    name: "",
    unit: "",
    recipeOutput: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();


    if (
      !form.recipeOutput ||
      isNaN(Number(form.recipeOutput)) ||
      Number(form.recipeOutput) <= 0
    )
      return toast.error("Recipe output must be a valid number greater than 0");

    setLoading(true);
    try {
      await createExtra({
        name: form.name.trim(),
        unit: form.unit.trim(),
        recipeOutput: Number(form.recipeOutput),
        ...(form.description.trim() && {
          description: form.description.trim(),
        }),
      });
      toast.success("Extra created!");
      onSuccess();
    } catch (err) {
      console.log("Error data:", err.response?.data);
      toast.error(err.response?.data?.message || "Failed to create extra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Prep Item"
      description="Create a reusable prep item like 'Pepper Mix' or 'Pepper Sauce'."
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-field">
            <label className="modal-label">Name *</label>
            <input
              className="modal-input"
              placeholder="e.g. Pepper Mix"
              value={form.name}
              onChange={f("name")}
              required
            />
          </div>
          <div className="form-field">
            <label className="modal-label">Description</label>
            <input
              className="modal-input"
              placeholder="e.g. My signature pepper mix"
              value={form.description}
              onChange={f("description")}
            />
          </div>
          <div className="register_row">
            <div className="form-field">
              <label className="modal-label">Unit of Measure *</label>
              <UnitSelect value={form.unit} onChange={f("unit")} />
            </div>
            <div className="form-field">
              <label className="modal-label">Recipe Output *</label>
              <input
                className="modal-input"
                type="number"
                placeholder="e.g. 300"
                value={form.recipeOutput}
                onChange={f("recipeOutput")}
                required
              />
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="app_btn app_btn_cancel"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              type="submit"
              disabled={loading}
              style={{ position: "relative", minWidth: 120 }}
            >
              <span className="btn_text">Create Extra</span>
              {loading && (
                <span
                  className="btn_loader"
                  style={{ width: 16, height: 16 }}
                />
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
