import { useState } from "react";
import Modal from "../../../components/Modal";
import { createConcept } from "../../../api/vendor";
import { toast } from "react-toastify";

export default function CreateConceptModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: "", origin: "", serveTo: "", description: "" });
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("origin", form.origin);
      fd.append("serveTo", form.serveTo);
      if (form.description) fd.append("description", form.description);
      if (banner) fd.append("banner", banner);
      await createConcept(fd);
      toast.success("Concept created!");
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create concept");
    } finally {
      setLoading(false);
    }
  };

  const f = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Concept" description="Create a new menu concept for your business.">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-field">
            <label className="modal-label">Concept Name *</label>
            <input className="modal-input" placeholder="e.g. Nigerian Classics" value={form.name} onChange={f("name")} required />
          </div>
          <div className="register_row">
            <div className="form-field">
              <label className="modal-label">Origin *</label>
              <input className="modal-input" placeholder="e.g. Lagos" value={form.origin} onChange={f("origin")} required />
            </div>
            <div className="form-field">
              <label className="modal-label">Serves *</label>
              <input className="modal-input" placeholder="e.g. Families" value={form.serveTo} onChange={f("serveTo")} required />
            </div>
          </div>
          <div className="form-field">
            <label className="modal-label">Description</label>
            <textarea className="modal-input" placeholder="Describe this concept..." value={form.description} onChange={f("description")} rows={3} style={{ resize: "none" }} />
          </div>
          <div className="form-field">
            <label className="modal-label">Banner Image</label>
            <input className="modal-input" type="file" accept="image/*" onChange={(e) => setBanner(e.target.files[0])} />
          </div>
          <div className="modal-footer">
            <button className="app_btn app_btn_cancel" type="button" onClick={onClose}>Cancel</button>
            <button
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              type="submit" disabled={loading}
              style={{ position: "relative", minWidth: 120 }}
            >
              <span className="btn_text">Create</span>
              {loading && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}