import { useState } from "react";
import { toast } from "react-toastify";
import { MdUpload } from "react-icons/md";
import Modal from "../../../components/Modal";
import api from "../../../api/axios";

export default function CreateMenuItemModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: "", description: "", ticketTime: "" });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name.trim());
      if (form.description.trim()) fd.append("description", form.description.trim());
      if (form.ticketTime) fd.append("ticketTime", Number(form.ticketTime));
      if (image) fd.append("image", image);
      await api.post("/vendor/menu", fd);
      toast.success("Menu item created!");
      setForm({ name: "", description: "", ticketTime: "" });
      setImage(null);
      setImagePreview(null);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ name: "", description: "", ticketTime: "" });
    setImage(null);
    setImagePreview(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Menu Item" description="Add a new item to your menu.">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">

          {/* Image upload */}
          <div className="form-field">
            <label className="modal-label">Image</label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--bg-hover)", border: "1px dashed var(--border)", borderRadius: 10, cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(203,108,220,0.5)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-active)", border: "1px solid rgba(203,108,220,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MdUpload size={16} style={{ color: "var(--accent)" }} />
                </div>
              )}
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {image ? image.name : "Click to upload image"}
              </span>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleImage} />
            </label>
          </div>

          <div className="form-field">
            <label className="modal-label">Item Name *</label>
            <input className="modal-input" placeholder="e.g. Jollof Rice" value={form.name} onChange={f("name")} required />
          </div>

          <div className="form-field">
            <label className="modal-label">Description</label>
            <textarea
              className="modal-input" rows={3} style={{ resize: "none" }}
              placeholder="Describe the item…"
              value={form.description} onChange={f("description")}
            />
          </div>

          <div className="form-field">
            <label className="modal-label">Ticket Time (minutes)</label>
            <input
              className="modal-input" type="number" min="1" placeholder="e.g. 15"
              value={form.ticketTime} onChange={f("ticketTime")}
            />
          </div>

          <div className="modal-footer">
            <button className="app_btn app_btn_cancel" type="button" onClick={handleClose}>
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              type="submit" disabled={loading}
              style={{ position: "relative", minWidth: 120 }}
            >
              <span className="btn_text">Create Item</span>
              {loading && <span className="btn_loader" style={{ width: 15, height: 15 }} />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}