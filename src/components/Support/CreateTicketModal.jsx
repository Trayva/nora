import { useState } from "react";
import { MdClose } from "react-icons/md";
import { createTicket } from "../../api/ticketApi";
import { toast } from "react-toastify";
import Modal from "../Modal";

export default function CreateTicketModal({ onClose, onSuccess, isOpen }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    category: "GENERAL",
    priority: "MEDIUM",
    description: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      await createTicket(formData);
      toast.success("Ticket created successfully");
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create New Ticket" isOpen={isOpen} onClose={onClose}>

      {/* <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: "500px" }}>
          <div className="modal-header">
            <h3>Create New Ticket</h3>
            <button className="modal-close" onClick={onClose}>
              <MdClose size={20} />
            </button>
          </div> */}

      <form onSubmit={handleSubmit} className="modal-body">
        <div className="modal-field">
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Subject</label>
          <input
            type="text"
            placeholder="Brief summary of the issue"
            className="modal-input"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />
        </div>

        <div className="form-row" style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
          <div className="modal-field" style={{ flex: 1 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Category</label>
            <select
              className="modal-input"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="GENERAL">General Inquiry</option>
              <option value="TECHNICAL">Technical Issue</option>
              <option value="BILLING">Billing / Payments</option>
              <option value="ACCOUNT">Account Management</option>
              <option value="KIOSK_ISSUE">Kiosk Hardware/Software</option>
            </select>
          </div>

          <div className="modal-field" style={{ flex: 1 }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Priority</label>
            <select
              className="modal-input"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent (Critical Issue)</option>
            </select>
          </div>
        </div>

        <div className="modal-field" style={{ marginTop: "16px" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>Description</label>
          <textarea
            className="modal-input"
            rows="5"
            placeholder="Provide detailed information about your issue..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
        </div>

        <div className="modal-footer" style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button type="button" className="app_btn app_btn_cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="app_btn app_btn_confirm" disabled={loading}>
            {loading ? "Creating..." : "Submit Ticket"}
          </button>
        </div>
      </form>
      {/* </div>
      </div> */}
    </Modal>
  );
}
