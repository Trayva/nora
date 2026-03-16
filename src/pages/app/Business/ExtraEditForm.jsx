import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { MdUpload } from "react-icons/md";
import { LuX, LuPlus } from "react-icons/lu";
import api from "../../../api/axios";
import {
  updateExtraStep,
  deleteExtraStep,
  addExtraStep,
} from "../../../api/library";
import RecipeStepsList from "../../../components/RecipeStepsList";
import RecipeStepForm from "../../../components/RecipeStepForm";

export default function ExtraEditForm({ extra, onSaved, onCancel }) {
  const [name, setName] = useState(extra?.name || "");
  const [unit, setUnit] = useState(extra?.unit || "");
  const [description, setDescription] = useState(extra?.description || "");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(extra?.image || null);
  const [videoFile, setVideoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const imageRef = useRef(null);
  const videoRef = useRef(null);

  // Steps state
  const [steps, setSteps] = useState(extra?.menuRecipes || extra?.steps || []);
  const [showStepForm, setShowStepForm] = useState(false);
  const [deletingStep, setDeletingStep] = useState(null);

  const handleImageChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    const fd = new FormData();
    if (name) fd.append("name", name.trim());
    if (unit) fd.append("unit", unit.trim());
    if (description) fd.append("description", description);
    if (imageFile) fd.append("image", imageFile);

    setSaving(true);
    try {
      // Update basic fields
      await api.patch(`/library/recipe/extra/${extra.id}`, fd);

      // Upload tutorial video if provided
      if (videoFile) {
        const vfd = new FormData();
        vfd.append("video", videoFile);
        await api.post(`/library/recipe/extra/${extra.id}/tutorial`, vfd);
      }

      toast.success("Prep item updated");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  // ── Step handlers ───────────────────────────────────────────────────────────
  const handleAddStep = async (stepData) => {
    try {
      await addExtraStep({ prepItemId: extra.id, ...stepData });
      toast.success("Step added");
      setShowStepForm(false);
      // Refresh steps inline
      const res = await api.get(`/library/recipe/extra/${extra.id}`);
      setSteps(res.data.data?.menuRecipes || res.data.data?.steps || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add step");
    }
  };

  const handleUpdateStep = async (stepId, body) => {
    await updateExtraStep(stepId, body);
    const res = await api.get(`/library/recipe/extra/${extra.id}`);
    setSteps(res.data.data?.menuRecipes || res.data.data?.steps || []);
  };

  const handleDeleteStep = async (stepId) => {
    setDeletingStep(stepId);
    try {
      await deleteExtraStep(stepId);
      toast.success("Step removed");
      setSteps((prev) => prev.filter((s) => s.id !== stepId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove step");
    } finally {
      setDeletingStep(null);
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-hover)",
        border: "1px solid rgba(203,108,220,0.15)",
        borderRadius: 12,
        padding: "14px 14px 10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: "0.9rem",
            fontWeight: 700,
            color: "var(--text-heading)",
          }}
        >
          Edit Prep Item
        </span>
        <button className="biz_icon_btn" onClick={onCancel}>
          <LuX size={14} />
        </button>
      </div>

      {/* Image upload */}
      <div className="form-field">
        <label className="modal-label">Image</label>
        <div
          onClick={() => imageRef.current?.click()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 12px",
            background: "var(--bg-hover)",
            border: "1px dashed var(--border)",
            borderRadius: 10,
            cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "rgba(203,108,220,0.5)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "var(--border)")
          }
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt=""
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "var(--bg-active)",
                border: "1px solid rgba(203,108,220,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MdUpload size={16} style={{ color: "var(--accent)" }} />
            </div>
          )}
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            {imageFile ? imageFile.name : "Click to upload image"}
          </span>
        </div>
        <input
          ref={imageRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleImageChange}
        />
      </div>

      <div className="register_row">
        <div className="form-field">
          <label className="modal-label">Name</label>
          <input
            className="modal-input"
            placeholder="e.g. Tomato Sauce"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">Unit</label>
          <input
            className="modal-input"
            placeholder="e.g. g, ml, pcs"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="modal-label">Description</label>
        <textarea
          className="modal-input"
          rows={3}
          style={{ resize: "vertical" }}
          placeholder="Describe this prep item…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Tutorial video */}
      <div className="form-field">
        <label className="modal-label">
          Tutorial Video {extra?.tutorialVideo ? "(replace)" : "(optional)"}
        </label>
        {extra?.tutorialVideo && !videoFile && (
          <div
            style={{
              marginBottom: 8,
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>Current video uploaded</span>
            <a
              href={extra.tutorialVideo}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--accent)", fontWeight: 600 }}
            >
              View
            </a>
          </div>
        )}
        <input
          ref={videoRef}
          className="modal-input"
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files[0])}
        />
      </div>

      <div className="recipe_add_actions" style={{ marginBottom: 20 }}>
        <button className="app_btn app_btn_cancel" onClick={onCancel}>
          Cancel
        </button>
        <button
          className={`app_btn app_btn_confirm ${saving ? "btn_loading" : ""}`}
          onClick={handleSubmit}
          disabled={saving}
          style={{ position: "relative", minWidth: 110 }}
        >
          <span className="btn_text">Save Changes</span>
          {saving && (
            <span className="btn_loader" style={{ width: 13, height: 13 }} />
          )}
        </button>
      </div>

      {/* ── Recipe steps (inline editing within this form) ── */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--text-heading)",
            }}
          >
            Recipe Steps{" "}
            <span className="drawer_section_count" style={{ marginLeft: 4 }}>
              {steps.length}
            </span>
          </span>
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
    </div>
  );
}
