import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { LuPlus, LuPencil } from "react-icons/lu";
import { MdOutlineBlender } from "react-icons/md";
import Drawer from "../../../components/Drawer";
import RecipeStepForm from "../../../components/RecipeStepForm";
import RecipeStepsList from "../../../components/RecipeStepsList";
import ExtraEditForm from "./ExtraEditForm";
import {
  getExtra,
  addExtraStep,
  updateExtraStep,
  deleteExtraStep,
} from "../../../api/library";

export default function ExtraDrawer({ extra, onClose, onUpdate }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showStepForm, setShowStepForm] = useState(false);
  const [deletingStep, setDeletingStep] = useState(null);
  const [editingExtra, setEditingExtra] = useState(false);

  const fetchDetail = async () => {
    if (!extra) return;
    setLoading(true);
    try {
      const res = await getExtra(extra.id);
      setDetail(res.data.data);
    } catch {
      toast.error("Failed to load prep item");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (extra) fetchDetail();
    else setDetail(null);
  }, [extra?.id]);

  const handleAddStep = async (stepData) => {
    try {
      await addExtraStep({ prepItemId: extra.id, ...stepData });
      toast.success("Step added");
      setShowStepForm(false);
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add step");
    }
  };

  const handleUpdateStep = async (stepId, body) => {
    await updateExtraStep(stepId, body);
    fetchDetail();
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

  const steps =
    detail?.prepRecipes || detail?.menuRecipes || detail?.steps || [];

  return (
    <Drawer
      isOpen={!!extra}
      onClose={onClose}
      title={extra?.name || ""}
      description={extra?.description || "Prep item details and recipe"}
      width={480}
    >
      {loading ? (
        <div style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div className="skeleton_shimmer skeleton_rect" style={{ width: 52, height: 52, borderRadius: 12 }} />
            <div style={{ flex: 1, paddingTop: 4 }}>
              <div className="skeleton_shimmer skeleton_text" style={{ width: "40%", height: 14, marginBottom: 8 }} />
              <div className="skeleton_shimmer skeleton_text" style={{ width: "60%", height: 10 }} />
            </div>
          </div>
          <div className="skeleton_shimmer skeleton_text" style={{ width: "30%", height: 14, marginBottom: 12 }} />
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton_shimmer skeleton_rect" style={{ height: 60, borderRadius: 12, marginBottom: 10 }} />
          ))}
        </div>
      ) : detail ? (
        <>
          {/* ── Info header ── */}
          <div className="drawer_item_hero">
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: "var(--bg-active)",
                border: "1px solid rgba(203,108,220,0.2)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {detail.image ? (
                <img
                  src={detail.image}
                  alt={detail.name}
                  style={{ width: 52, height: 52, objectFit: "cover" }}
                />
              ) : (
                <MdOutlineBlender size={22} />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div className="drawer_meta_item">
                <span className="wallet_info_label">Unit</span>
                <span className="wallet_info_value">{detail.unit || "—"}</span>
              </div>
              {detail.recipeOutput && (
                <div className="drawer_meta_item" style={{ marginTop: 4 }}>
                  <span className="wallet_info_label">Recipe Output</span>
                  <span className="wallet_info_value">
                    {detail.recipeOutput} {detail.unit}
                  </span>
                </div>
              )}
            </div>
            <button
              className="biz_icon_btn"
              title="Edit prep item"
              onClick={() => setEditingExtra((v) => !v)}
              style={{
                alignSelf: "flex-start",
                color: editingExtra ? "var(--accent)" : "var(--text-muted)",
              }}
            >
              <LuPencil size={14} />
            </button>
          </div>

          {/* ── Inline edit form ── */}
          {editingExtra && (
            <div style={{ marginBottom: 16 }}>
              <ExtraEditForm
                extra={detail}
                onSaved={() => {
                  setEditingExtra(false);
                  fetchDetail();
                  if (onUpdate) onUpdate(detail);
                }}
                onCancel={() => setEditingExtra(false)}
              />
            </div>
          )}

          {/* ── Recipe steps (hidden when editing since ExtraEditForm has its own step management) ── */}
          {!editingExtra && (
            <div className="drawer_section">
              <div className="drawer_section_header">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="wallet_section_title">Recipe Steps</span>
                  <span className="drawer_section_count">{steps.length}</span>
                </div>
                <button
                  className="app_btn app_btn_confirm biz_add_btn"
                  onClick={() => setShowStepForm((v) => !v)}
                >
                  <LuPlus size={13} /> Add Step
                </button>
              </div>

              {showStepForm && (
                <RecipeStepForm
                  onAdd={handleAddStep}
                  onCancel={() => setShowStepForm(false)}
                />
              )}

              <RecipeStepsList
                steps={steps}
                onDelete={handleDeleteStep}
                deletingId={deletingStep}
                onUpdate={handleUpdateStep}
              />
            </div>
          )}

          {/* Tutorial preview (hidden when editing) */}
          {detail.tutorialVideo && !editingExtra && (
            <div className="drawer_section">
              <div className="drawer_section_header">
                <span className="wallet_section_title">Tutorial Video</span>
              </div>
              <div className="tutorial_preview">
                {detail.tutorialVideo.includes("vimeo.com") ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${detail.tutorialVideo.split("/").pop()}`}
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    style={{
                      border: "none",
                      width: "100%",
                      aspectRatio: "16/9",
                      borderRadius: 12,
                    }}
                  />
                ) : (
                  <video
                    src={detail.tutorialVideo}
                    controls
                    className="tutorial_video"
                  />
                )}
              </div>
            </div>
          )}
        </>
      ) : null}
    </Drawer>
  );
}
