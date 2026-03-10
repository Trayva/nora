import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LuCalculator, LuChefHat } from "react-icons/lu";
import Drawer from "../../../components/Drawer";
import RecipeStepForm from "../../../components/RecipeStepForm";
import RecipeStepsList from "../../../components/RecipeStepsList";
import {
  getExtra,
  addExtraStep,
  deleteExtraStep,
} from "../../../api/library";
import { useAppState } from "../../../contexts/StateContext";

export default function ExtraDrawer({ extra, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addingStep, setAddingStep] = useState(false);
  const [savingStep, setSavingStep] = useState(false);
  const [deletingStep, setDeletingStep] = useState(null);
  const [cost, setCost] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { selectedState } = useAppState();

  const fetchDetail = async () => {
    if (!extra) return;
    setLoading(true);
    try {
      const res = await getExtra(extra.id);
      console.log("Extra detail response:", res.data); // ← add this
      setDetail(res.data.data);
      setCost(null);
    } catch (err) {
      console.log("fetchDetail error:", err); // ← and this
      toast.error("Failed to load extra");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (extra) {
      fetchDetail();
      setShowForm(false);
    } else setDetail(null);
  }, [extra?.id]);

  const handleAddStep = async (stepData) => {
    setSavingStep(true);
    try {
      await addExtraStep({ prepItemId: extra.id, ...stepData });
      toast.success("Step added");
      setShowForm(false);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add step");
    } finally {
      setSavingStep(false);
    }
  };

  const handleDeleteStep = async (stepId) => {
    setDeletingStep(stepId);
    try {
      await deleteExtraStep(stepId);
      toast.success("Step removed");
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove step");
    } finally {
      setDeletingStep(null);
    }
  };

  const steps = detail?.prepRecipes || [];

  return (
    <Drawer
      isOpen={!!extra}
      onClose={onClose}
      title={extra?.name || ""}
      description={
        extra?.description ||
        `Recipe output: ${extra?.recipeOutput} ${extra?.unit}`
      }
      width={540}
    >
      {loading ? (
        <div className="page_loader">
          <div className="page_loader_spinner" />
        </div>
      ) : detail ? (
        <>
          {/* Info tiles */}
          <div className="drawer_meta_grid">
            <div className="drawer_meta_item">
              <span className="wallet_info_label">Unit</span>
              <span className="wallet_info_value">{detail.unit}</span>
            </div>
            <div className="drawer_meta_item">
              <span className="wallet_info_label">Recipe Output</span>
              <span className="wallet_info_value">
                {detail.recipeOutput} {detail.unit}
              </span>
            </div>
            <div className="drawer_meta_item">
              <span className="wallet_info_label">Steps</span>
              <span className="wallet_info_value">{steps.length}</span>
            </div>
            <div className="drawer_meta_item">
              <span className="wallet_info_label">Cost / {detail.unit}</span>
              <span
                className="wallet_info_value"
                style={{ color: cost ? "#22c55e" : "var(--text-muted)" }}
              >
                {cost?.costPerUnit
                  ? `₦${Number(cost.costPerUnit).toLocaleString()}`
                  : "—"}
              </span>
            </div>
          </div>

          {/* Recipe section */}
          <div className="drawer_section">
            <div className="drawer_section_header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <LuChefHat size={16} style={{ color: "var(--accent)" }} />
                <span className="wallet_section_title">Recipe Steps</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="app_btn app_btn_confirm biz_add_btn"
                  onClick={() => setShowForm((v) => !v)}
                >
                  {showForm ? "Cancel" : "+ Add Step"}
                </button>
              </div>
            </div>

            {showForm && (
              <RecipeStepForm onAdd={handleAddStep} loading={savingStep} />
            )}

            <RecipeStepsList
              steps={steps}
              onDelete={handleDeleteStep}
              deleting={deletingStep}
              cost={cost}
            />
          </div>
        </>
      ) : null}
    </Drawer>
  );
}
