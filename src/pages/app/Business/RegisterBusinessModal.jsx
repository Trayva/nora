import { useState, useEffect } from "react";
import Modal from "../../../components/Modal";
import { registerBusiness, updateBusiness } from "../../../api/vendor";
import { toast } from "react-toastify";

export default function RegisterBusinessModal({ isOpen, onClose, onSuccess, mode = "register", defaultValues = {} }) {
  const [form, setForm] = useState({
    businessName: "", brandTagline: "", brandColor: "",
  });
  const [brandLogo, setBrandLogo] = useState(null);
  const [businessRegDoc, setBusinessRegDoc] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && defaultValues) {
      setForm({
        businessName: defaultValues.businessName || "",
        brandTagline: defaultValues.brandTagline || "",
        brandColor: defaultValues.brandColor || "",
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("businessName", form.businessName);
      if (form.brandTagline) fd.append("brandTagline", form.brandTagline);
      if (form.brandColor) fd.append("brandColor", form.brandColor);
      if (brandLogo) fd.append("brandLogo", brandLogo);
      if (businessRegDoc) fd.append("businessRegDoc", businessRegDoc);

      if (mode === "register") await registerBusiness(fd);
      else await updateBusiness(fd);

      toast.success(mode === "register" ? "Business registered!" : "Business updated!");
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "register" ? "Register Business" : "Edit Business"}
      description={mode === "register"
        ? "Set up your business profile to get started."
        : "Update your business information."}
    >
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-field">
            <label className="modal-label">Business Name *</label>
            <input
              className="modal-input"
              placeholder="e.g. Nora Foods"
              value={form.businessName}
              onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
              required
            />
          </div>
          <div className="form-field">
            <label className="modal-label">Brand Tagline</label>
            <input
              className="modal-input"
              placeholder="e.g. Fresh, fast, and local"
              value={form.brandTagline}
              onChange={(e) => setForm((p) => ({ ...p, brandTagline: e.target.value }))}
              maxLength={200}
            />
          </div>
          <div className="form-field">
            <label className="modal-label">Brand Color</label>
            <div className="biz_color_field">
              <input
                className="modal-input"
                placeholder="#cb6cdc"
                value={form.brandColor}
                onChange={(e) => setForm((p) => ({ ...p, brandColor: e.target.value }))}
              />
              <input
                type="color"
                className="biz_color_picker"
                value={form.brandColor || "#cb6cdc"}
                onChange={(e) => setForm((p) => ({ ...p, brandColor: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-field">
            <label className="modal-label">Brand Logo</label>
            <input
              className="modal-input"
              type="file"
              accept="image/*"
              onChange={(e) => setBrandLogo(e.target.files[0])}
            />
          </div>
          <div className="form-field">
            <label className="modal-label">Registration Document</label>
            <input
              className="modal-input"
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setBusinessRegDoc(e.target.files[0])}
            />
          </div>

          <div className="modal-footer">
            <button className="app_btn app_btn_cancel" type="button" onClick={onClose}>
              Cancel
            </button>
            <button
              className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
              type="submit"
              disabled={loading}
              style={{ position: "relative", minWidth: 120 }}
            >
              <span className="btn_text">
                {mode === "register" ? "Register" : "Save Changes"}
              </span>
              {loading && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}