import { useState } from "react";
import { IoLocationOutline, IoMailOutline } from "react-icons/io5";
import { MdOutlinePhone } from "react-icons/md";
import { toast } from "react-toastify";
import api from "../../api/axios";

const INITIAL = { name: "", email: "", phone: "", message: "" };

function Contact() {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/support", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        message: form.message.trim(),
      });
      toast.success("Message sent! We'll get back to you shortly.");
      setForm(INITIAL);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact-section" id="contact">
      <div className="contact-inner">

        {/* Left */}
        <div className="contact-left">
          <h1 className="contact-heading">Contact Us</h1>
          <p className="contact-sub">
            Have a question or need more information? Submit your enquiry, and
            our team will get back to you promptly with the answers you need.
            We're here to help!
          </p>

          <div className="contact-info-list">
            <div className="contact-info-item">
              <div className="contact-info-icon">
                <IoLocationOutline size={18} />
              </div>
              <p className="contact-info-text">
                Office 1703- Fahidi Heights-Alhamriya <br />
                Dubai-United Arab Emirates
              </p>
            </div>

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <IoMailOutline size={18} />
              </div>
              <a
                className="contact-info-text contact-link"
                href="mailto:support@trynora.net"
              >
                support@trynora.net
              </a>
            </div>

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <MdOutlinePhone size={18} />
              </div>
              <a
                className="contact-info-text contact-link"
                href="tel:+2348012345678"
              >
                +234 80 123 4567
              </a>
            </div>
          </div>
        </div>

        {/* Right — Form */}
        <div className="contact-form-card">
          <form onSubmit={handleSubmit}>
            <div className="contact-form-fields">
              <div className="form-field">
                <label className="modal-label">Name *</label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Jane Doe"
                  value={form.name}
                  onChange={set("name")}
                  disabled={loading}
                  required
                />
              </div>
              <div className="form-field">
                <label className="modal-label">Email *</label>
                <input
                  className="modal-input"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={set("email")}
                  disabled={loading}
                  required
                />
              </div>
              <div className="form-field">
                <label className="modal-label">Phone Number</label>
                <input
                  className="modal-input"
                  type="tel"
                  placeholder="+234 80 123 4567"
                  value={form.phone}
                  onChange={set("phone")}
                  disabled={loading}
                />
              </div>
              <div className="form-field">
                <label className="modal-label">Message *</label>
                <textarea
                  className="modal-input contact-textarea"
                  placeholder="Type your message here..."
                  rows={5}
                  value={form.message}
                  onChange={set("message")}
                  disabled={loading}
                  required
                />
              </div>

              <button
                type="submit"
                className={`app_btn app_btn_confirm ${loading ? "btn_loading" : ""}`}
                style={{ width: "100%", height: 50, marginTop: 8, fontSize: "0.9375rem", position: "relative" }}
                disabled={loading}
              >
                <span className="btn_text">Send Message</span>
                {loading && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
              </button>
            </div>
          </form>
        </div>

      </div>
    </section>
  );
}

export default Contact;