import { useState, useRef } from "react";
import { toast } from "react-toastify";
import { MdUpload } from "react-icons/md";
import Drawer from "../../../components/Drawer";
import api from "../../../api/axios";

function FileUploadField({
  label,
  hint,
  preview,
  fileName,
  onFile,
  accept = "image/*",
}) {
  const ref = useRef(null);
  return (
    <div className="form-field">
      <label className="modal-label">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
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
        {preview ? (
          <img
            src={preview}
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color:
                fileName || preview ? "var(--text-body)" : "var(--text-muted)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {fileName ||
              (preview ? "Uploaded · click to change" : "Click to upload")}
          </div>
          {hint && (
            <div style={{ fontSize: "0.66rem", color: "var(--text-muted)" }}>
              {hint}
            </div>
          )}
        </div>
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}

const EMPTY = {
  name: "",
  description: "",
  ticketTime: "",
  origin: "",
  serveTo: "",
  packaging: "",
};

export default function CreateMenuItemModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [packagingImage, setPackagingImage] = useState(null);
  const [packagingPreview, setPackagingPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const reset = () => {
    setForm(EMPTY);
    setImage(null);
    setImagePreview(null);
    setPackagingImage(null);
    setPackagingPreview(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      if (form.description.trim())
        fd.append("description", form.description.trim());
      if (form.ticketTime) fd.append("ticketTime", Number(form.ticketTime));
      if (form.origin.trim()) fd.append("origin", form.origin.trim());
      if (form.serveTo.trim()) fd.append("serveTo", form.serveTo.trim());
      if (form.packaging.trim()) fd.append("packaging", form.packaging.trim());
      if (image) fd.append("image", image);
      if (packagingImage) fd.append("packagingImage", packagingImage);
      await api.post("/vendor/menu", fd);
      toast.success("Menu item created!");
      reset();
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      title="New Menu Item"
      description="Add a new item to your menu"
      width={480}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        <FileUploadField
          label="Item Image"
          hint="PNG or JPG"
          preview={imagePreview}
          fileName={image?.name}
          onFile={(file) => {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
          }}
        />

        <div className="form-field">
          <label className="modal-label">Item Name *</label>
          <input
            className="modal-input"
            placeholder="e.g. Jollof Rice"
            value={form.name}
            onChange={f("name")}
          />
        </div>

        <div className="form-field">
          <label className="modal-label">Description</label>
          <textarea
            className="modal-input"
            rows={3}
            style={{ resize: "none" }}
            placeholder="Describe the item…"
            value={form.description}
            onChange={f("description")}
          />
        </div>

        <div className="register_row">
          <div className="form-field">
            <label className="modal-label">Origin</label>
            <input
              className="modal-input"
              placeholder="e.g. Nigeria"
              value={form.origin}
              onChange={f("origin")}
            />
          </div>
          <div className="form-field">
            <label className="modal-label">Serves</label>
            <input
              className="modal-input"
              placeholder="e.g. All ages"
              value={form.serveTo}
              onChange={f("serveTo")}
            />
          </div>
        </div>

        <div className="form-field">
          <label className="modal-label">Ticket Time (minutes)</label>
          <input
            className="modal-input"
            type="number"
            min="1"
            placeholder="e.g. 15"
            value={form.ticketTime}
            onChange={f("ticketTime")}
          />
        </div>

        <div className="form-field">
          <label className="modal-label">Packaging Details</label>
          <textarea
            className="modal-input"
            rows={2}
            style={{ resize: "none" }}
            placeholder="e.g. Sealed paper bag, 500g capacity"
            value={form.packaging}
            onChange={f("packaging")}
          />
        </div>

        <FileUploadField
          label="Packaging Image"
          hint="PNG or JPG"
          preview={packagingPreview}
          fileName={packagingImage?.name}
          onFile={(file) => {
            setPackagingImage(file);
            setPackagingPreview(URL.createObjectURL(file));
          }}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            className="app_btn app_btn_cancel"
            style={{ flex: 1, height: 42 }}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            className={`app_btn app_btn_confirm${loading ? " btn_loading" : ""}`}
            style={{ flex: 2, height: 42, position: "relative" }}
            onClick={handleSubmit}
            disabled={loading}
          >
            <span className="btn_text">Create Item</span>
            {loading && (
              <span className="btn_loader" style={{ width: 15, height: 15 }} />
            )}
          </button>
        </div>
      </div>
    </Drawer>
  );
}
