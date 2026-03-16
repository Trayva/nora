import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { MdUpload } from "react-icons/md";
import { LuX } from "react-icons/lu";
import { updateConcept } from "../../../api/vendor";

export default function ConceptEditForm({ concept, onSaved, onCancel }) {
  const [name, setName] = useState(concept?.name || "");
  const [origin, setOrigin] = useState(concept?.origin || "");
  const [serveTo, setServeTo] = useState(concept?.serveTo || "");
  const [description, setDescription] = useState(concept?.description || "");
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(concept?.banner || null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const handleBannerChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setBannerFile(f);
    setBannerPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    const fd = new FormData();
    if (name) fd.append("name", name.trim());
    if (origin) fd.append("origin", origin.trim());
    if (serveTo) fd.append("serveTo", serveTo.trim());
    if (description) fd.append("description", description);
    if (bannerFile) fd.append("banner", bannerFile);

    setSaving(true);
    try {
      await updateConcept(concept.id, fd);
      toast.success("Concept updated");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update concept");
    } finally {
      setSaving(false);
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
          Edit Concept
        </span>
        <button className="biz_icon_btn" onClick={onCancel}>
          <LuX size={14} />
        </button>
      </div>

      {/* Banner upload */}
      <div className="form-field">
        <label className="modal-label">Banner Image</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            position: "relative",
            cursor: "pointer",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px dashed var(--border)",
            background: "var(--bg-hover)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = "rgba(203,108,220,0.5)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = "var(--border)")
          }
        >
          {bannerPreview ? (
            <img
              src={bannerPreview}
              alt=""
              style={{
                width: "100%",
                height: 120,
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                height: 80,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                color: "var(--text-muted)",
              }}
            >
              <MdUpload size={18} />
              <span style={{ fontSize: "0.8rem" }}>Click to upload banner</span>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleBannerChange}
        />
      </div>

      <div className="form-field">
        <label className="modal-label">Name</label>
        <input
          className="modal-input"
          placeholder="e.g. Nigerian Street Food"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="register_row">
        <div className="form-field">
          <label className="modal-label">Origin</label>
          <input
            className="modal-input"
            placeholder="e.g. Lagos"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="modal-label">Serve To</label>
          <input
            className="modal-input"
            placeholder="e.g. All ages"
            value={serveTo}
            onChange={(e) => setServeTo(e.target.value)}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="modal-label">Description</label>
        <textarea
          className="modal-input"
          rows={3}
          style={{ resize: "vertical" }}
          placeholder="Describe this concept…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="recipe_add_actions">
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
    </div>
  );
}
