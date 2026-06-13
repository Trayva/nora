import { useState, useRef, useEffect } from "react";
import { MdOutlineHeadsetMic, MdOutlineSend, MdCheckCircleOutline } from "react-icons/md";
import { HiOutlineTicket } from "react-icons/hi";
import { toast } from "react-toastify";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "./PublicConcepts.css";
import { publicCreateTicket } from "../../api/ticketApi";

const INITIAL = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  category: "GENERAL",
  priority: "MEDIUM",
  description: "",
};

const CATEGORIES = [
  { value: "GENERAL", label: "General Inquiry" },
  { value: "TECHNICAL", label: "Technical Issue" },
  { value: "BILLING", label: "Billing / Payments" },
  { value: "ACCOUNT", label: "Account Management" },
  { value: "KIOSK_ISSUE", label: "Kiosk Hardware / Software" },
];

function PublicSupportSection() {
  const [form, setForm] = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketRef, setTicketRef] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("lp-visible");
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (form.phone && form.phone.length < 7) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    setLoading(true);
    try {
      const formattedPhone = form.phone
        ? form.phone.startsWith("+") ? form.phone : `+${form.phone}`
        : undefined;

      const result = await publicCreateTicket({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: formattedPhone,
        subject: form.subject.trim(),
        category: form.category,
        priority: form.priority,
        description: form.description.trim(),
      });

      setTicketRef(result?.data?.id);
      setSubmitted(true);
      setForm(INITIAL);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="lp-section" id="support" style={{ background: "var(--lp-bg-alt, #f8f9fc)" }}>
      <div className="lp-inner lp-block" ref={ref}>
        {/* Header */}
        <div className="lp-section-header lp-reveal lp-reveal-up">
          <div className="lp-eyebrow">
            <HiOutlineTicket size={14} style={{ marginRight: 6, verticalAlign: "middle" }} />
            Support
          </div>
          <h2 className="lp-heading lp-heading-center">Need Help? We're Here.</h2>
          <p className="lp-sub-center">
            Submit a support ticket and our team will respond to your email promptly.
            No account needed — just fill in your details below.
          </p>
        </div>

        {/* Two-column layout */}
        <div className="lp-two-col lp-two-col-contact" style={{ alignItems: "flex-start", marginTop: 48 }}>

          {/* Left — info */}
          <div className="lp-contact-left lp-reveal lp-reveal-left">
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              {[
                {
                  icon: "⚡",
                  title: "Fast Response",
                  desc: "We aim to reply to all tickets within 24 hours on business days.",
                },
                {
                  icon: "🔒",
                  title: "Secure & Private",
                  desc: "Your information is protected and only used to resolve your request.",
                },
                {
                  icon: "🎯",
                  title: "Expert Support",
                  desc: "Our team is trained to handle technical, billing, and operational queries.",
                },
              ].map((item) => (
                <div key={item.title} className="pss-feature-row">
                  <div className="pss-feature-icon">{item.icon}</div>
                  <div>
                    <h4 className="pss-feature-title">{item.title}</h4>
                    <p className="pss-feature-desc">{item.desc}</p>
                  </div>
                </div>
              ))}

              <div className="pss-already-registered">
                <MdOutlineHeadsetMic size={18} />
                <span>
                  Already have an account?{" "}
                  <a href="/auth/login" className="pss-login-link">
                    Login to track your tickets
                  </a>
                </span>
              </div>
            </div>
          </div>

          {/* Right — form or success */}
          <div className="lp-contact-form-card lp-reveal lp-reveal-right">
            {submitted ? (
              <div className="pss-success-state">
                <MdCheckCircleOutline size={56} className="pss-success-icon" />
                <h3 className="pss-success-title">Ticket Submitted!</h3>
                <p className="pss-success-body">
                  Your support request has been received. We've sent a confirmation to your email.
                </p>
                {ticketRef && (
                  <div className="pss-ticket-ref">
                    <span className="pss-ticket-ref-label">Reference ID</span>
                    <code className="pss-ticket-ref-code">{ticketRef}</code>
                  </div>
                )}
                <button
                  className="lp-contact-submit"
                  style={{ marginTop: 24 }}
                  onClick={() => setSubmitted(false)}
                >
                  Submit Another Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="lp-contact-form">
                <div className="lp-contact-form-row">
                  <div className="lp-contact-field">
                    <label className="lp-contact-label">Full Name *</label>
                    <input
                      className="lp-contact-input"
                      type="text"
                      placeholder="Jane Doe"
                      value={form.name}
                      onChange={set("name")}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="lp-contact-field">
                    <label className="lp-contact-label">Email Address *</label>
                    <input
                      className="lp-contact-input"
                      type="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={set("email")}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>

                <div className="lp-contact-field">
                  <label className="lp-contact-label">Phone Number (optional)</label>
                  <div className="register_phone_wrapper">
                    <PhoneInput
                      country="ae"
                      value={form.phone}
                      onChange={(value) => setForm((prev) => ({ ...prev, phone: value }))}
                      enableSearch
                      searchPlaceholder="Search country..."
                      disableSearchIcon
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="lp-contact-field">
                  <label className="lp-contact-label">Subject *</label>
                  <input
                    className="lp-contact-input"
                    type="text"
                    placeholder="Brief summary of your issue"
                    value={form.subject}
                    onChange={set("subject")}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="lp-contact-form-row">
                  <div className="lp-contact-field">
                    <label className="lp-contact-label">Category</label>
                    <select
                      className="lp-contact-input"
                      value={form.category}
                      onChange={set("category")}
                      disabled={loading}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="lp-contact-field">
                    <label className="lp-contact-label">Priority</label>
                    <select
                      className="lp-contact-input"
                      value={form.priority}
                      onChange={set("priority")}
                      disabled={loading}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent (Critical)</option>
                    </select>
                  </div>
                </div>

                <div className="lp-contact-field">
                  <label className="lp-contact-label">Description *</label>
                  <textarea
                    className="lp-contact-input lp-contact-textarea"
                    placeholder="Describe your issue in detail. Include any error messages, steps to reproduce, etc."
                    rows={5}
                    value={form.description}
                    onChange={set("description")}
                    disabled={loading}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`lp-contact-submit ${loading ? "btn_loading" : ""}`}
                  disabled={loading}
                >
                  <span className="btn_text">
                    <MdOutlineSend size={18} />
                    {loading ? "Submitting…" : "Submit Ticket"}
                  </span>
                  {loading && <span className="btn_loader" style={{ width: 16, height: 16 }} />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default PublicSupportSection;
